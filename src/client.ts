import { 
  TelonClientConfig, 
  WebMcpMessage,
  HostHandshakeMessage,
  HostActionMessage
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
      console.warn(`[TelonClient] Cannot send data update: not authorized by Host yet.`);
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
      console.error('[TelonClient] Failed to request storage access:', e);
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
      console.warn(`[TelonClient] Message ignored from unauthorized origin: ${event.origin}`);
      return;
    }

    const { type } = data;

    if (type === 'MCP_HOST_HANDSHAKE') {
      const handshake = data as HostHandshakeMessage;
      console.log(`[TelonClient] Handshake received from: ${event.origin}. Validating...`);

      // 1. Check storage access & session
      let hasStorage = true;
      if (typeof document !== 'undefined' && typeof document.hasStorageAccess === 'function') {
        hasStorage = await document.hasStorageAccess();
      }

      const isSessionActive = this.config.checkSession ? await this.config.checkSession() : true;

      if (!hasStorage || !isSessionActive) {
        console.warn(`[TelonClient] Handshake paused: hasStorage=${hasStorage}, isSessionActive=${isSessionActive}.`);
        
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
        console.warn('[TelonClient] API key could not be resolved.');
        return;
      }

      if (handshake.apiKey !== expectedKey) {
        console.warn(`[TelonClient] Connection denied: API keys do not match.`);
        return;
      }

      // 3. Complete Handshake
      this.isAuthorized = true;
      this.authorizedHostOrigin = event.origin;
      console.log(`[TelonClient] Connection successful with host: ${this.authorizedHostOrigin}`);

      window.parent.postMessage({
        protocol: 'MCPOwnStandard',
        type: 'MCP_CLIENT_REGISTER',
        clientName: this.config.name,
        description: this.config.description,
        capabilities: this.config.capabilities,
        version: '2.0.0'
      }, this.authorizedHostOrigin);
    }

    if (type === 'MCP_HOST_ACTION') {
      const actionMsg = data as HostActionMessage;
      if (!this.isAuthorized || event.origin !== this.authorizedHostOrigin) {
        console.warn(`[TelonClient] Blocked action: message source is not authorized.`);
        return;
      }

      const key = `${actionMsg.capability}:${actionMsg.action}`;
      const handler = this.actionHandlers.get(key);
      if (handler) {
        try {
          await handler(actionMsg.payload);
        } catch (e) {
          console.error(`[TelonClient] Error handling action ${key}:`, e);
        }
      } else if (this.config.onAction) {
        try {
          await this.config.onAction(actionMsg.capability, actionMsg.action, actionMsg.payload);
        } catch (e) {
          console.error(`[TelonClient] Error handling global action:`, e);
        }
      }
    }
  }
}
