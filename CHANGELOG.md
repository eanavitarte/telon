# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-12

### Added
- **Top-Level Tab Bridge Flow:** Introduced a secure, popup-based authentication mechanism to bypass storage partitioning (Iframe Sandboxing/ITP) in third-party contexts.
- **Nonce/State Support:** Added nonce-based verification to prevent Replay Attacks when transmitting authentication tokens through `postMessage`.
- **Host Sync:** Added `MCP_HOST_AUTH_SYNC` message to forward tokens from Host to Client iframe.
- **Popup Callback:** Added `onAuthSync` optional callback to `TelonClientConfig` to delegate storage/session persistence to micro-apps.
- **Auth URL Configuration:** Extended `ClientDefinition` with `authUrl` to customize the endpoint opened by the Host for authentication.
- **Popup Lifecycle Management:** Automatic closure of popup windows upon successful authentication.
