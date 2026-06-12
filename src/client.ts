import { 
  TelonClientConfig, 
  WebMcpMessage,
  HostHandshakeMessage,
  HostActionMessage,
  HostAuthSyncMessage
} from './types';

export class TelonClient {
  private config: TelonClientConfig;
  private isAuthorized: boolean = false;
  private authorizedHostOrigin: string = '';
  private actionHandlers: Map<string, (payload: any) => void | Promise<void>> = new Map();

  constructor(config: TelonClientConfig) {
    this.config = config;
  }

  public start(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('message', this.onMessage.bind(this));
  }

  public destroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('message', this.onMessage.bind(this));
  }

  public onAction(capability: string, action: string, handler: (payload: any) => void | Promise<void>): void {
    const key = `${capability}:${action}`;
    this.actionHandlers.set(key, handler);
  }

  public sendDataUpdate(capability: string, data: any): void {
    if (!this.isAuthorized || !this.authorizedHostOrigin) {
      console.warn(`%c[TelonClient]%c Cannot send data update: not authorized by Host yet.`, 'color: #10b981; font-weight: bold;', '');
      return;
    }

    if (typeof window === 'undefined') return;

    window.parent.postMessage({
      protocol: 'MCPOwnStandard',
      type: 'MCP_CLIENT_DATA_UPDATE',
      clientName: this.config.name,
      capability,
      data
    }, this.authorizedHostOrigin);
  }

  public getAuthorized(): boolean {
    return this.isAuthorized;
  }

  public getAuthorizedHostOrigin(): string {
    return this.authorizedHostOrigin;
  }

  public async requestStorageAccess(): Promise<boolean> {
    if (typeof document === 'undefined' || typeof document.requestStorageAccess !== 'function') {
      return false;
    }

    try {
      await document.requestStorageAccess();
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return true;
    } catch (e) {
      console.error('%c[TelonClient]%c Failed to request storage access:', 'color: #ef4444; font-weight: bold;', '', e);
      return false;
    }
  }

  private isOriginAllowed(origin: string): boolean {
    return this.config.allowedHostOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });
  }

  private async onMessage(event: MessageEvent): Promise<void> {
    const data = event.data as WebMcpMessage;
    if (!data || typeof data !== 'object' || data.protocol !== 'MCPOwnStandard') {
      return;
    }

    // Validate origin
    if (!this.isOriginAllowed(event.origin)) {
      console.warn(`%c[TelonClient]%c Message ignored from unauthorized origin: ${event.origin}`, 'color: #10b981; font-weight: bold;', '');
      return;
    }

    const { type } = data;

    if (type === 'MCP_HOST_AUTH_SYNC') {
      const syncData = data as HostAuthSyncMessage;
      console.log(`%c[TelonClient]%c Received auth token sync from Host: ${event.origin}`, 'color: #10b981; font-weight: bold;', '');

      if (this.config.onAuthSync) {
        try {
          await this.config.onAuthSync(syncData.token, syncData.nonce);
        } catch (e) {
          console.error('%c[TelonClient]%c Error in onAuthSync callback:', 'color: #ef4444; font-weight: bold;', '', e);
        }
      }
      return;
    }

    if (type === 'MCP_HOST_HANDSHAKE') {
      const handshake = data as HostHandshakeMessage;
      console.log(`%c[TelonClient]%c Handshake received from: ${event.origin}. Validating...`, 'color: #10b981; font-weight: bold;', '');

      // 1. Check storage access & session
      let hasStorage = true;
      if (typeof document !== 'undefined' && typeof document.hasStorageAccess === 'function') {
        hasStorage = await document.hasStorageAccess();
      }

      const isSessionActive = this.config.checkSession ? await this.config.checkSession() : true;

      if (!hasStorage || !isSessionActive) {
        console.warn(`%c[TelonClient]%c Handshake paused: hasStorage=${hasStorage}, isSessionActive=${isSessionActive}.`, 'color: #10b981; font-weight: bold;', '');
        
        window.parent.postMessage({
          protocol: 'MCPOwnStandard',
          type: 'MCP_CLIENT_UNAUTHORIZED',
          clientName: this.config.name,
          reason: !hasStorage ? 'storage_partitioned' : 'session_expired',
          version: '2.0.0'
        }, event.origin);
        return;
      }

      // 2. Validate API key / Signature
      const expectedKey = this.config.resolveApiKey ? await this.config.resolveApiKey() : '';
      if (!expectedKey) {
        console.warn('%c[TelonClient]%c API key could not be resolved.', 'color: #10b981; font-weight: bold;', '');
        return;
      }

      if (handshake.apiKey !== expectedKey) {
        console.warn(`%c[TelonClient]%c Connection denied: API keys do not match.`, 'color: #10b981; font-weight: bold;', '');
        return;
      }

      // 3. Complete Handshake
      this.isAuthorized = true;
      this.authorizedHostOrigin = event.origin;
      console.log(`%c[TelonClient]%c Connection successful with host: ${this.authorizedHostOrigin}`, 'color: #10b981; font-weight: bold;', '');

      window.parent.postMessage({
        protocol: 'MCPOwnStandard',
        type: 'MCP_CLIENT_REGISTER',
        clientName: this.config.name,
        description: this.config.description,
        capabilities: this.config.capabilities,
        version: '2.0.0'
      }, this.authorizedHostOrigin);

      if (this.config.onAuthorize) {
        this.config.onAuthorize(event.origin);
      }
    }

    if (type === 'MCP_HOST_ACTION') {
      const actionMsg = data as HostActionMessage;
      if (!this.isAuthorized || event.origin !== this.authorizedHostOrigin) {
        console.warn(`%c[TelonClient]%c Blocked action: message source is not authorized.`, 'color: #10b981; font-weight: bold;', '');
        return;
      }

      const key = `${actionMsg.capability}:${actionMsg.action}`;
      const handler = this.actionHandlers.get(key);
      if (handler) {
        try {
          await handler(actionMsg.payload);
        } catch (e) {
          console.error(`%c[TelonClient]%c Error handling action ${key}:`, 'color: #ef4444; font-weight: bold;', '', e);
        }
      } else if (this.config.onAction) {
        try {
          await this.config.onAction(actionMsg.capability, actionMsg.action, actionMsg.payload);
        } catch (e) {
          console.error(`%c[TelonClient]%c Error handling global action:`, 'color: #ef4444; font-weight: bold;', '', e);
        }
      }
    }
  }
}
