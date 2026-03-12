# Build & Packaging Instructions

> **Scope**: Build scripts, packaging, shell/environment routing, output directories.
> Subordinate to `AGENTS.md` §2 (pnpm-only) and §5 (shell routing).

---

## Script Routing Matrix

| Script | What It Does | Shell |
|---|---|---|
| `pnpm build` | Vite production build → `dist/` | WSL: Ubuntu |
| `pnpm build:preview` | Build + local preview server | WSL: Ubuntu |
| `pnpm desktop:build` | Vite build + electron-builder for current platform → `release/` | Platform-dependent (see below) |
| `pnpm windows:build` | Windows `.exe` (portable) → `release/` | **PowerShell** |
| `pnpm linux:build` | Linux `.AppImage` → `release/` | WSL: Ubuntu |
| `pnpm mac:build` | macOS `.dmg` → `release/` | **macOS / Apple** |
| `pnpm android:sync` | Vite build + Capacitor sync to Android project | WSL: Ubuntu |
| `pnpm ios:sync` | Vite build + Capacitor sync to iOS project | WSL: Ubuntu |
| `pnpm wasm:build` | AssemblyScript → WASM → base64 | WSL: Ubuntu |
| `pnpm wasm:build:debug` | WASM debug build | WSL: Ubuntu |

---

## Shell / Environment Routing

| Environment | Tasks |
|---|---|
| **Bash (WSL: Ubuntu)** | `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm check`, `pnpm fix`, `pnpm validate`, `pnpm test`, `pnpm linux:build`, `pnpm android:sync`, `pnpm ios:sync`, `pnpm wasm:build` |
| **PowerShell** | `pnpm windows:build` only |
| **macOS / Apple** | `pnpm mac:build`, `pnpm ios:open`, `pnpm ios:run` |

**Default**: Bash (WSL: Ubuntu) for everything unless the task explicitly targets Windows packaging or Apple platforms.

Do not default to PowerShell for ordinary development.

---

## Electron Builder Configuration

Defined in `package.json` under the `"build"` key:

| Field | Value |
|---|---|
| `appId` | `com.scottreinhart.connectfour` |
| `productName` | `Connect Four` |
| `directories.output` | `release` |
| `files` | `dist/**/*`, `electron/**/*` |
| `win.target` | `portable` (unsigned) |
| `mac.target` | `dmg` |
| `linux.target` | `AppImage` |

- Windows builds set `signAndEditExecutable: false` (no code signing).
- All Electron builds require a prior `vite build` (the scripts chain this automatically).

---

## Output Directories

| Directory | Contents | Gitignored |
|---|---|---|
| `dist/` | Vite production build output | Yes |
| `release/` | Electron Builder distributables (`.exe`, `.dmg`, `.AppImage`) | Yes |
| `node_modules/` | Dependencies | Yes |

---

## Cleanup Scripts

| Script | Effect |
|---|---|
| `pnpm clean:cache` | Removes `node_modules/.vite` (Vite dep cache) |
| `pnpm clean:dist` | Removes `dist/` and `release/` |
| `pnpm clean` | Removes `node_modules/` |
| `pnpm clean:all` | Removes `dist/`, `release/`, and `node_modules/` |
| `pnpm reinstall` | `clean:all` + `pnpm install` |

---

## Quality Gate Scripts

| Script | Effect |
|---|---|
| `pnpm lint` | ESLint check on `src/` |
| `pnpm lint:fix` | ESLint auto-fix on `src/` |
| `pnpm format` | Prettier format `src/` |
| `pnpm format:check` | Prettier check `src/` (no write) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm check` | `lint` + `format:check` + `typecheck` |
| `pnpm fix` | `lint:fix` + `format` |
| `pnpm validate` | `check` + `build` (full pre-push gate) |
| `pnpm test` | Run tests via vitest |
| `pnpm test:ci` | Run tests with coverage (CI mode) |
| `pnpm test:coverage` | Run tests with coverage report |

Always run `pnpm validate` before pushing changes.

---

## Language Guardrails

Build scripts use **JavaScript** (Node) in `scripts/`. Do not introduce Python, Bash, PowerShell, or other side-language build helpers.
Prefer existing `package.json` scripts over raw CLI commands.
Do not create parallel build paths or duplicate tooling.
