# Architecture

TelonJS is built under a strict philosophy: **Atomicity and Agnosticism**. 

The core architectural decision is that TelonJS provides *only* the communication and connection tool between environments (Host and Client). It is explicitly designed **not** to manage state, visual interfaces, or implementation details of the peers. 

## 1. Core Philosophy: The Atomic Bridge
TelonJS does not care *how* a micro-app authenticates its users, nor *what* the Manager dashboard looks like. 
- **Up to the Host:** The Host decides when to render the iframe, when to hide it, and when to trigger the authentication popup bridge.
- **Up to the Client:** The Client (Micro-App) decides what to show in the popup window (a dedicated route, a banner, or its main app), how it reads its own session storage, and how its internal logic operates.
- **The Library's Role:** TelonJS merely guarantees that the cryptographic handshakes, nonce validation, and `postMessage` payloads flow securely and reliably across cross-origin boundaries, overcoming issues like Partitioned Storage (Safari ITP).

## 2. Components

### A. The Host (`TelonHost`)
Runs in the parent window. It maintains a registry of allowed clients, orchestrates the iframe injection conceptually, and handles the `window.open` trigger for the Auth Bridge when a client's storage is partitioned.

### B. The Client (`TelonClient`)
Runs inside the child iframe or popup. It listens for the Host's handshake, responds with its capabilities, and leverages the Top-Level Tab Bridge to sync its session back to the Host if its iframe context is blocked from accessing `localStorage`.

## 3. Communication Protocol (MCPOwnStandard)
All messages follow a strict standard to ensure predictability:
- `MCP_HOST_HANDSHAKE`: Initiates connection.
- `MCP_CLIENT_UNAUTHORIZED`: Fired when the client detects partition blocks or expired sessions.
- `MCP_AUTH_BRIDGE_SUCCESS`: Sent by the popup back to the Host with the token.
- `MCP_HOST_AUTH_SYNC`: Sent by the Host to the partitioned iframe to inject the recovered token.
