export type WebMcpCapability = 'tasks' | 'habits' | 'telephone' | string;

export interface WebMcpMessage {
  protocol: 'MCPOwnStandard';
  type: string;
  clientName?: string;
  version?: string;
  [key: string]: any;
}

export interface HostHandshakeMessage extends WebMcpMessage {
  type: 'MCP_HOST_HANDSHAKE';
  hostOrigin: string;
  apiKey: string;
  version: string;
}

export interface ClientRegisterMessage extends WebMcpMessage {
  type: 'MCP_CLIENT_REGISTER';
  clientName: string;
  description: string;
  capabilities: WebMcpCapability[];
  version: string;
}

export interface ClientUnauthorizedMessage extends WebMcpMessage {
  type: 'MCP_CLIENT_UNAUTHORIZED';
  clientName: string;
  reason: 'storage_partitioned' | 'session_expired' | string;
  version: string;
}

export interface ClientDataUpdateMessage extends WebMcpMessage {
  type: 'MCP_CLIENT_DATA_UPDATE';
  clientName: string;
  capability: WebMcpCapability;
  data: any;
}

export interface HostActionMessage extends WebMcpMessage {
  type: 'MCP_HOST_ACTION';
  clientName: string;
  capability: WebMcpCapability;
  action: string;
  payload: any;
}

export interface TelonClientConfig {
  name: string;
  description: string;
  capabilities: WebMcpCapability[];
  allowedHostOrigins: (string | RegExp)[];
  checkSession?: () => boolean | Promise<boolean>;
  resolveApiKey?: () => string | Promise<string>;
  onAction?: (capability: WebMcpCapability, action: string, payload: any) => void | Promise<void>;
}

export interface TelonHostConfig {
  onClientRegister?: (client: RegisteredClient) => void;
  onClientDataUpdate?: (client: RegisteredClient, capability: WebMcpCapability, data: any) => void;
  onClientUnauthorized?: (client: ClientDefinition, reason: string) => void;
}

export interface ClientDefinition {
  id: string;
  url: string;
  apiKey: string;
  name?: string;
}

export interface RegisteredClient {
  id: string;
  url: string;
  name: string;
  description: string;
  capabilities: WebMcpCapability[];
}
