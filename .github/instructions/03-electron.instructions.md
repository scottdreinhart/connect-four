# Electron Instructions

> **Scope**: Electron desktop app development, builds, preview, and platform-specific packaging.
> Subordinate to `AGENTS.md` §5 (shell routing) and `01-build.instructions.md` for general build rules.

---

## Overview

Electron wraps the Vite web app in a native desktop window.

- **Dev mode**: Connects to the Vite dev server at `localhost:5173`.
- **Production**: Loads the built `dist/` files directly.
- **Main process**: `electron/main.js`
- **Preload script**: `electron/preload.js` (sandboxed context bridge)

---

## Scripts

| Script | What It Does |
|---|---|
| `pnpm desktop:dev` | Launches Vite + Electron together (via `concurrently` + `wait-on`) |
| `pnpm desktop:preview` | Builds Vite → opens Electron on the built `dist/` |
| `pnpm desktop:build` | Vite build + electron-builder for current platform → `release/` |
| `pnpm windows:build` | Windows `.exe` (portable, unsigned) → `release/` |
| `pnpm linux:build` | Linux `.AppImage` → `release/` |
| `pnpm mac:build` | macOS `.dmg` → `release/` |

---

## Environment Routing

| Script | Required Shell |
|---|---|
| `pnpm desktop:dev` | Bash (WSL: Ubuntu) |
| `pnpm desktop:preview` | Bash (WSL: Ubuntu) |
| `pnpm windows:build` | **PowerShell** (Windows) |
| `pnpm linux:build` | Bash (WSL: Ubuntu) |
| `pnpm mac:build` | **macOS / Apple** (requires Apple hardware) |

Never run `windows:build` in WSL. Never run `mac:build` without confirmed Apple hardware.
Default to Bash for all Electron dev and preview work.

---

## Packaging Configuration

Defined in `package.json` `"build"` key (electron-builder config):

| Field | Value |
|---|---|
| `appId` | `com.scottreinhart.connectfour` |
| `productName` | `Connect Four` |
| `directories.output` | `release` |
| `files` | `dist/**/*`, `electron/**/*` |

### Platform Targets

| Platform | Target | Output |
|---|---|---|
| Windows | `portable` | `.exe` (no installer, unsigned — `signAndEditExecutable: false`) |
| macOS | `dmg` | `.dmg` disk image |
| Linux | `AppImage` | `.AppImage` self-contained binary |

---

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `electron` | 40.8.0 | Desktop runtime |
| `electron-builder` | 26.8.1 | Packaging & distribution |
| `concurrently` | 9.2.1 | Run Vite + Electron in parallel for dev |
| `wait-on` | 8.0.5 | Wait for Vite server before launching Electron |

---

## Output

All Electron distributables are written to `release/` (gitignored).
The `dist/` directory (Vite build output) must exist before packaging — the build scripts chain this automatically.

---

## Language Guardrails

Electron main and preload scripts use **JavaScript** (`electron/main.js`, `electron/preload.js`).
Do not introduce orphaned helper scripts or alternate runtimes for Electron workflows.
Prefer existing `package.json` scripts and repository-native tooling.
