import { 
  TelonHostConfig, 
  ClientDefinition, 
  RegisteredClient, 
  WebMcpMessage,
  ClientRegisterMessage,
  ClientDataUpdateMessage,
  ClientUnauthorizedMessage,
  AuthBridgeSuccessMessage
} from './types';

export class TelonHost {
  private config: TelonHostConfig;
  private clients: Map<string, ClientDefinition> = new Map();
  private registeredClients: Map<string, RegisteredClient> = new Map();
  private activeIframes: Map<string, Window> = new Map();
  private handshakeIntervals: Map<string, any> = new Map();
  private activeNonces: Map<string, string> = new Map();
  private activePopups: Map<string, Window> = new Map();

  constructor(config: TelonHostConfig) {
    this.config = config;
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.onMessage.bind(this));
    }
  }

  public register(client: ClientDefinition): void {
    this.clients.set(client.id, client);
  }

  public unregister(clientId: string): void {
    this.clients.delete(clientId);
    this.registeredClients.delete(clientId);
    this.activeIframes.delete(clientId);
    this.clearHandshake(clientId);
  }

  public getRegisteredClient(clientId: string): RegisteredClient | undefined {
    return this.registeredClients.get(clientId);
  }

  public isRegistered(clientId: string): boolean {
    return this.registeredClients.has(clientId);
  }

  public connectIframe(clientId: string, iframeWindow: Window | null): void {
    if (!iframeWindow) return;
    const client = this.clients.get(clientId);
    if (!client) {
      console.warn(`[TelonHost] Client definition not found for: ${clientId}`);
      return;
    }

    this.activeIframes.set(clientId, iframeWindow);
    this.clearHandshake(clientId);

    const sendHandshake = () => {
      if (this.isRegistered(clientId)) {
        this.clearHandshake(clientId);
        return;
      }

      const payload = {
        protocol: 'MCPOwnStandard',
        type: 'MCP_HOST_HANDSHAKE',
        version: '2.0.0',
        hostOrigin: typeof window !== 'undefined' ? window.location.origin : '',
        apiKey: client.apiKey || ''
      };

      try {
        const targetOrigin = new URL(client.url).origin;
        iframeWindow.postMessage(payload, targetOrigin);
      } catch (e) {
        console.error(`[TelonHost] Failed to send handshake to ${clientId}:`, e);
      }
    };

    // Send first handshake immediately
    sendHandshake();

    // Start retries
    const interval = setInterval(sendHandshake, 2000);
    this.handshakeIntervals.set(clientId, interval);
  }

  public openAuthBridge(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      console.warn(`[TelonHost] Client definition not found for: ${clientId}`);
      return;
    }

    if (typeof window === 'undefined') return;

    // Generate cryptographic-like random nonce
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.activeNonces.set(clientId, nonce);

    const hostOrigin = window.location.origin;
    const baseUrl = client.authUrl || client.url;
    
    let targetUrl: string;
    try {
      const urlObj = new URL(baseUrl);
      urlObj.searchParams.set('hostOrigin', hostOrigin);
      urlObj.searchParams.set('nonce', nonce);
      urlObj.searchParams.set('clientId', clientId);
      targetUrl = urlObj.toString();
    } catch (e) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      targetUrl = `${baseUrl}${separator}hostOrigin=${encodeURIComponent(hostOrigin)}&nonce=${encodeURIComponent(nonce)}&clientId=${encodeURIComponent(clientId)}`;
    }

    console.log(`[TelonHost] Opening auth bridge popup for client ${clientId} at: ${targetUrl}`);
    const popup = window.open(targetUrl, `TelonAuth_${clientId}`, 'width=600,height=700,status=yes,resizable=yes');
    if (popup) {
      this.activePopups.set(clientId, popup);
    } else {
      console.error('[TelonHost] Popup blocked. Please allow popups for this site.');
    }
  }

  public sendAction(clientId: string, capability: string, action: string, payload: any): void {
    const client = this.clients.get(clientId);
    const iframeWindow = this.activeIframes.get(clientId);
    
    if (!client || !iframeWindow) {
      console.warn(`[TelonHost] Cannot send action to ${clientId}: client or iframe not ready.`);
      return;
    }

    const message = {
      protocol: 'MCPOwnStandard',
      type: 'MCP_HOST_ACTION',
      clientName: client.name || client.id,
      capability,
      action,
      payload
    };

    try {
      const targetOrigin = new URL(client.url).origin;
      iframeWindow.postMessage(message, targetOrigin);
    } catch (e) {
      console.error(`[TelonHost] Failed to send action to ${clientId}:`, e);
    }
  }

  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.onMessage.bind(this));
    }
    for (const interval of this.handshakeIntervals.values()) {
      clearInterval(interval);
    }
    this.handshakeIntervals.clear();
  }

  private clearHandshake(clientId: string): void {
    const interval = this.handshakeIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.handshakeIntervals.delete(clientId);
    }
  }

  private onMessage(event: MessageEvent): void {
    const data = event.data as WebMcpMessage;
    if (!data || typeof data !== 'object' || data.protocol !== 'MCPOwnStandard') {
      return;
    }

    // Find the client definition matching this origin
    let matchingClientId: string | null = null;
    let matchingClient: ClientDefinition | null = null;

    for (const [id, client] of this.clients.entries()) {
      try {
        const clientOrigin = new URL(client.url).origin;
        if (event.origin === clientOrigin) {
          matchingClientId = id;
          matchingClient = client;
          break;
        }
      } catch {
        // Invalid URL
      }
    }

    if (!matchingClientId || !matchingClient) {
      return;
    }

    const { type } = data;

    if (type === 'MCP_AUTH_BRIDGE_SUCCESS') {
      const authData = data as AuthBridgeSuccessMessage;
      
      if (authData.clientId !== matchingClientId) {
        console.warn(`[TelonHost] Client ID mismatch. Expected: ${matchingClientId}, Got: ${authData.clientId}`);
        return;
      }

      const expectedNonce = this.activeNonces.get(matchingClientId);
      if (!expectedNonce || authData.nonce !== expectedNonce) {
        console.warn(`[TelonHost] Nonce validation failed or expired for: ${matchingClientId}`);
        return;
      }

      this.activeNonces.delete(matchingClientId);

      const iframeWindow = this.activeIframes.get(matchingClientId);
      if (iframeWindow) {
        const syncMessage = {
          protocol: 'MCPOwnStandard',
          type: 'MCP_HOST_AUTH_SYNC',
          token: authData.token,
          nonce: authData.nonce
        };
        try {
          iframeWindow.postMessage(syncMessage, event.origin);
          console.log(`[TelonHost] Forwarded auth token to iframe: ${matchingClientId}`);
        } catch (e) {
          console.error(`[TelonHost] Failed to forward auth token to iframe ${matchingClientId}:`, e);
        }
      }

      const popup = this.activePopups.get(matchingClientId);
      if (popup && !popup.closed) {
        try {
          popup.close();
        } catch {}
        this.activePopups.delete(matchingClientId);
      }
      return;
    }

    if (type === 'MCP_CLIENT_REGISTER') {
      const regData = data as ClientRegisterMessage;
      this.clearHandshake(matchingClientId);

      const registered: RegisteredClient = {
        id: matchingClientId,
        url: matchingClient.url,
        name: regData.clientName,
        description: regData.description,
        capabilities: regData.capabilities || []
      };

      this.registeredClients.set(matchingClientId, registered);
      if (this.config.onClientRegister) {
        this.config.onClientRegister(registered);
      }
    }

    if (type === 'MCP_CLIENT_UNAUTHORIZED') {
      const unauthData = data as ClientUnauthorizedMessage;
      if (this.config.onClientUnauthorized) {
        this.config.onClientUnauthorized(matchingClient, unauthData.reason);
      }
    }

    if (type === 'MCP_CLIENT_DATA_UPDATE') {
      const updateData = data as ClientDataUpdateMessage;
      const registered = this.registeredClients.get(matchingClientId);
      
      const clientObj = registered || {
        id: matchingClientId,
        url: matchingClient.url,
        name: updateData.clientName || matchingClient.name || matchingClient.id,
        description: '',
        capabilities: []
      };

      if (this.config.onClientDataUpdate) {
        this.config.onClientDataUpdate(clientObj, updateData.capability, updateData.data);
      }
    }
  }
}
