import { 
  TelonHostConfig, 
  ClientDefinition, 
  RegisteredClient, 
  WebMcpMessage,
  ClientRegisterMessage,
  ClientDataUpdateMessage,
  ClientUnauthorizedMessage
} from './types';

export class TelonHost {
  private config: TelonHostConfig;
  private clients: Map<string, ClientDefinition> = new Map();
  private registeredClients: Map<string, RegisteredClient> = new Map();
  private activeIframes: Map<string, Window> = new Map();
  private handshakeIntervals: Map<string, any> = new Map();

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
