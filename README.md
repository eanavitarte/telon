# Telon 🎭

> **A fast, effortless, and reliable way to connect agents in the browser.**

**Telon** is a lightweight, modular, and framework-agnostic library designed to enable secure, bi-directional communication between a central dashboard (**Orchestrator/Host**) and multiple decentralized micro-apps (**Agents/Clients**) embedded via `iframes` in the user's browser, using the `MCPOwnStandard` protocol.

Its main strength is the native and integrated resolution of **third-party cookie blocking and storage partitioning** in modern browsers, achieved through the transparent implementation of the **Storage Access API**.

---

## Key Features 🚀

*   **100% Client-Side & Site-Agnostic**: Direct communication in the browser via `postMessage`. Works with any combination of domains or local development environments.
*   **Storage Access API Management**: Proactively detects if the browser blocks the client's session inside the iframe and provides a user gesture flow to request and grant native storage access.
*   **Secure Handshake**: Automatic origin validation (`event.origin`) using regular expressions and dynamic signatures (`apiKey`) to prevent Clickjacking, XSS, and CSRF attacks.
*   **Isolated Diagnostics**: Enables individual tracking of connection logs and event traces for each client micro-app.
*   **Fully Typed**: Written in TypeScript to guarantee robust autocomplete and compile-time type safety.

---

## Installation 📦

Install the library as a dependency:

```bash
npm install telon
```

---

## Quick Start 💻

### 1. The Orchestrator (`telon/host`)

Instantiate `TelonHost` in your main dashboard to register clients and interact with them:

```typescript
import { TelonHost } from 'telon/host';

const host = new TelonHost({
  onClientRegister: (client) => {
    console.log(`Client ${client.name} successfully synced!`);
  },
  onClientDataUpdate: (client, capability, data) => {
    console.log(`Data received from client ${client.name} [${capability}]:`, data);
  },
  onClientUnauthorized: (client, reason) => {
    console.warn(`Client ${client.name} requires authorization:`, reason);
    // Style the iframe as visible so the user can click the authorization button inside it
  }
});

// Register a client
host.register({
  id: 'mantras',
  url: 'https://mantras.lexmente.app/mcp-frame',
  apiKey: 'my_secret_api_key'
});

// Connect your iframe window to start the connection handshake
const iframe = document.getElementById('my-client-iframe') as HTMLIFrameElement;
host.connectIframe('mantras', iframe.contentWindow);

// Send an action to the client agent
host.sendAction('mantras', 'tasks', 'TOGGLE_STATE', { id: 'uuid-123', completed: true });
```

### 2. The Client Agent (`telon/client`)

Instantiate `TelonClient` on the page dedicated to your iframe (e.g., `/mcp-frame`):

```typescript
import { TelonClient } from 'telon/client';

const client = new TelonClient({
  name: 'Mantras (ZenFlow)',
  description: 'Daily meditation and wellness micro-app.',
  capabilities: ['habits', 'tasks', 'telephone'],
  allowedHostOrigins: [/^http:\/\/localhost(:\d+)?$/, 'https://manager.lexmente.app'],
  
  // Verify if your application has an active session
  checkSession: async () => {
    return !!localStorage.getItem('user_id');
  },
  
  // Return the API key to validate the connection signature
  resolveApiKey: async () => {
    return localStorage.getItem('api_key') || 'fallback_key';
  }
});

// Handle actions coming from the orchestrator
client.onAction('tasks', 'TOGGLE_STATE', async (payload) => {
  await db.updateTask(payload.id, { completed: payload.completed });
  // Send back updated data
  client.sendDataUpdate('tasks', await db.getTasks());
});

// Start listening for protocol events
client.start();
```

---

## License 📄

This project is licensed under the **MIT** License. See the `LICENSE.md` file for details.
