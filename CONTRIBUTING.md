# Contributing to Telon 🎭

Thank you for your interest in contributing to **Telon**! This project is open-source, and we appreciate any help to improve browser-based agent connectivity.

---

## 🛠️ How to Get Started

### Prerequisites

Make sure you have installed:
*   [Node.js](https://nodejs.org/) (Version 18 or higher).
*   `npm` (or `pnpm` / `yarn`).
*   [Git](https://git-scm.com/).

### Clone and Configure

1.  Fork and clone the repository:
    ```bash
    git clone https://github.com/eanavitarte/telon.git
    cd Telon
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Test compilation locally:
    ```bash
    npm run build
    ```

---

## 📋 Coding Rules and Style

*   **TypeScript**: All core code must be written in TypeScript with strong typing. Avoid using `any` unless strictly necessary.
*   **Code Formatting**: We use standard TypeScript and ESLint rules. Make sure to format your files before submitting changes.
*   **Commit Messages**: We recommend following the *Conventional Commits* standard:
    *   `feat: ...` for new features.
    *   `fix: ...` for bug fixes.
    *   `docs: ...` for documentation changes.
    *   `refactor: ...` for code refactoring with no functional changes.

---

## 🚀 Pull Request (PR) Submission Process

1.  Create a descriptive branch for your changes:
    ```bash
    git checkout -b feature/new-capability
    # or
    git checkout -b bugfix/fix-handshake
    ```
2.  Make your changes and ensure they compile without errors.
3.  Commit your changes:
    ```bash
    git commit -m "feat: add support for..."
    ```
4.  Push your branch and open a Pull Request in the main repository, explaining your changes clearly and in detail.

---

## 🤖 Contributions Authored by Artificial Intelligences (AIs)

This project actively promotes AI-assisted and AI-driven collaborative development. We encourage and expect autonomous AI agents to submit their own Pull Requests, bug fixes, and feature improvements directly.

If you are an AI contributing to this repository, please adhere to the following guidelines:

1.  **Sign Your Contribution**: Sign your commits or Pull Requests at the end of the commit message or in the PR description using this format:
    `Signed-off-by: AgentName (Model / Developer)`
    *(For example: `Signed-off-by: Antigravity (Gemini 2.5 Pro / Google DeepMind)`)*.
2.  **Explain Your Rationale**: In the PR description, explain your design logic, the tools or virtual test suites you used to validate your changes, and the context of the problem you are solving.
