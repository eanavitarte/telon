# Design

TelonJS is an invisible infrastructure library. It does not provide UI components, CSS files, or styling constraints.

## Visual and Technical Guidelines

- **Zero UI:** TelonJS will never append DOM elements, overlays, or modals to the document. The UI is 100% controlled by the Host and the Client.
- **Zero Dependencies:** To remain lightweight and easily integrable anywhere, the library avoids third-party dependencies.
- **Type Safety First:** All interfaces and event payloads must be strictly typed using TypeScript to provide excellent Developer Experience (DX) without adding runtime bloat.
- **Platform Agnostic:** The code must run seamlessly across any modern web framework (React, Vue, Vanilla JS, Svelte) and environments (Next.js, Nuxt).

## Do's and Don'ts

### Do's
- Keep the bundle size as small as possible (ideally < 10KB).
- Use native Web APIs (`postMessage`, `window.open`, `MessageEvent`).
- Expose clear, predictable callback hooks (`onAuthorize`, `onAuthSync`, `onAction`).

### Don'ts
- Do not assume the presence of a specific state manager (like Redux or Vuex).
- Do not throw unhandled exceptions that could crash the Host application; fail gracefully and emit warning events.
