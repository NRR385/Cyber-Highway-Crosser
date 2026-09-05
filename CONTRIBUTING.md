# Contributing to Cyber Highway Crosser

Thank you for your interest in contributing to Cyber Highway Crosser! This document provides guidelines and instructions for contributing to this project.

## 📋 Project Overview

Cyber Highway Crosser is a cyberpunk-themed arcade game built with React 19, TypeScript, Tailwind CSS v4, HTML5 Canvas, and the Web Audio API. It originated as an upstream open-source contribution to [QuickPlayZone](https://github.com/shamilahmdt/quickplay-zone) and is actively maintained here as a standalone project.

## 🛠️ Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (bundled with Node.js)

### Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/Cyber-Highway-Crosser.git
   cd Cyber-Highway-Crosser
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

## 🌿 Branch Guidance

Create a descriptive branch for your work:

- Features: `feature/your-feature-name`
- Bug fixes: `fix/issue-description`
- Documentation: `docs/what-changed`
- Refactoring / Chores: `chore/clean-up-name`

```bash
git checkout -b feature/volume-slider
```

## 🧪 Verification & Build Commands

Before committing and submitting your pull request, verify that the project compiles and builds cleanly:

```bash
# Type-check and build production bundle
npm run build

# Preview production build locally
npm run preview
```

## 🔄 Contribution Workflow

1. Check the [Issues](https://github.com/NRR385/Cyber-Highway-Crosser/issues) tab for existing issues or create one to discuss proposed changes.
2. Branch off `main` and make your changes.
3. Keep pull requests focused on a single feature or bug fix.
4. Test changes locally across desktop and mobile screen sizes where applicable.
5. Commit your changes with clear, descriptive commit messages.
6. Push your branch to your fork and open a Pull Request against `main`.

## 🏷️ Issue Guidance & Labels

When looking for something to work on, look for these labels on the [Issues page](https://github.com/NRR385/Cyber-Highway-Crosser/issues):

- `good first issue` — Great starting points for newcomers
- `help wanted` — Tasks where extra help or input is appreciated
- `enhancement` — New features or improvements to existing mechanics
- `documentation` — Improvements to docs, comments, or guides
- `accessibility` — Keyboard navigation, screen-reader, or UI contrast enhancements

For substantial architectural changes or new mechanics, please open an issue to discuss the design before writing code.

## 🤝 Code of Conduct & Expectations

- Be respectful and constructive in discussions and reviews.
- Preserve existing code conventions and formatting.
- Avoid introducing unnecessary dependencies.
