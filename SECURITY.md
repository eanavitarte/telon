# Security Policy

Security is a fundamental pillar of TelonJS, given its nature as a cross-origin communication bridge.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Core Security Features

TelonJS implements multiple layers of security to prevent Cross-Site Scripting (XSS) and other injection attacks:

1. **Strict Origin Validation:** Every `postMessage` sent or received is strictly validated against a whitelist of `allowedHostOrigins`. Messages from unknown origins are silently ignored.
2. **Cryptographic Nonce:** The Top-Level Tab Bridge (Popup) uses a randomly generated, single-use `nonce` to prevent Replay Attacks. The Host verifies this nonce before accepting any token from the popup.
3. **No `eval()` or Unsafe Execution:** TelonJS never executes arbitrary strings or code received via payloads. Data is parsed and routed exclusively to registered handlers.

## Reporting a Vulnerability

If you discover a security vulnerability within TelonJS, please do not open a public issue. Instead, send an email directly to the maintainers:
**edjhanvi@gmail.com**

We will triage your report within 48 hours and work with you to patch the vulnerability responsibly before public disclosure.
