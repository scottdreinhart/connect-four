# Build Matrix

> **Purpose**: Human-readable reference for all build targets, scripts, and environment requirements.
> This is an informational document — see `AGENTS.md` for binding governance rules.

---

## Web Builds

| Target / Task | Script | Shell / Environment | Local / Remote | Output / Result | Notes |
|---|---|---|---|---|---|
| Dev server | `pnpm start` | WSL: Ubuntu | Local | `localhost:5173` | `--host` flag exposes on LAN |
| Dev server (port-safe) | `pnpm dev` | WSL: Ubuntu | Local | `localhost:5173` | Same as `start` |
| Dev server (no cache) | `pnpm start:nocache` | WSL: Ubuntu | Local | `localhost:5173` | Uses `--mode nocache` |
| Dev (clean reinstall) | `pnpm dev:clean` | WSL: Ubuntu | Local | `localhost:5173` | `clean` + `install` + `dev` |
| Production build | `pnpm build` | WSL: Ubuntu | Either | `dist/` | Runs `prebuild` (clean:dist) automatically |
| Build (clean reinstall) | `pnpm build:clean` | WSL: Ubuntu | Either | `dist/` | `clean` + `install` + `build` |
| Preview production build | `pnpm preview` | WSL: Ubuntu | Local | `localhost:4173` | Serves `dist/` locally |
| Build + preview | `pnpm build:preview` | WSL: Ubuntu | Local | `dist/` + preview server | Chains `build` → `preview` |
| Bundle analysis | `pnpm analyze` | WSL: Ubuntu | Local | `dist/bundle-report.html` | Build + open visualizer report |

## Quality Gate

| Target / Task | Script | Shell / Environment | Local / Remote | Output / Result | Notes |
|---|---|---|---|---|---|
| Lint | `pnpm lint` | WSL: Ubuntu | Either | Console output | ESLint on `src/` |
| Lint + fix | `pnpm lint:fix` | WSL: Ubuntu | Either | Console output | ESLint auto-fix on `src/` |
| Format | `pnpm format` | WSL: Ubuntu | Either | Formatted files | Prettier on `src/` |
| Format check | `pnpm format:check` | WSL: Ubuntu | Either | Console output | Prettier check (no write) |
| Type check | `pnpm typecheck` | WSL: Ubuntu | Either | Console output | `tsc --noEmit` |
| Quality gate | `pnpm check` | WSL: Ubuntu | Either | Console output | lint + format:check + typecheck |
| Auto-fix all | `pnpm fix` | WSL: Ubuntu | Either | Fixed files | lint:fix + format |
| Full validation | `pnpm validate` | WSL: Ubuntu | Either | `dist/` | check + build (pre-push gate) |

## Testing

| Target / Task | Script | Shell / Environment | Local / Remote | Output / Result | Notes |
|---|---|---|---|---|---|
| Run tests | `pnpm test` | WSL: Ubuntu | Either | Console output | Vitest (single run) |
| Watch mode | `pnpm test:watch` | WSL: Ubuntu | Local | Console output | Vitest in watch mode |
| CI tests | `pnpm test:ci` | WSL: Ubuntu | Either | Console + coverage | Vitest run + v8 coverage |
| Coverage report | `pnpm test:coverage` | WSL: Ubuntu | Either | Console + coverage | Same as `test:ci` |

## Electron Desktop Builds

| Target / Task | Script | Shell / Environment | Local / Remote | Output / Result | Notes |
|---|---|---|---|---|---|
| Electron dev | `pnpm desktop:dev` | WSL: Ubuntu | Local | Electron window on `localhost:5173` | `concurrently` + `wait-on` |
| Electron preview | `pnpm desktop:preview` | WSL: Ubuntu | Local | Electron window on `dist/` | Build + launch |
| Electron build (auto) | `pnpm desktop:build` | Platform-dependent | Local | `release/` | Detects current platform |
| Windows `.exe` | `pnpm windows:build` | **PowerShell** | Local | `release/*.exe` | Portable, unsigned |
| Linux `.AppImage` | `pnpm linux:build` | WSL: Ubuntu | Local | `release/*.AppImage` | Self-contained binary |
| macOS `.dmg` | `pnpm mac:build` | **macOS / Apple** | Local | `release/*.dmg` | Requires Apple hardware |

## Capacitor Mobile Builds

| Target / Task | Script | Shell / Environment | Local / Remote | Output / Result | Notes |
|---|---|---|---|---|---|
| Init Android | `pnpm android:init` | WSL: Ubuntu | Local | `android/` project | One-time setup |
| Init iOS | `pnpm ios:init` | **macOS / Apple** | Local | `ios/` project | One-time setup, requires Xcode |
| Sync to Android | `pnpm android:sync` | WSL: Ubuntu | Local | Updated native assets | Builds web + syncs to Android |
| Sync to iOS | `pnpm ios:sync` | WSL: Ubuntu | Local | Updated native assets | Builds web + syncs to iOS |
| Open Android Studio | `pnpm android:open` | Any | Local | Android Studio IDE | Requires Android Studio |
| Open Xcode | `pnpm ios:open` | **macOS / Apple** | Local | Xcode IDE | Requires Apple hardware |
| Run on Android | `pnpm android:run` | Any | Local | Device/emulator | Requires Android SDK |
| Run on iOS | `pnpm ios:run` | **macOS / Apple** | Local | Device/simulator | Requires Apple hardware |

## WASM Builds

| Target / Task | Script | Shell / Environment | Local / Remote | Output / Result | Notes |
|---|---|---|---|---|---|
| WASM build | `pnpm wasm:build` | WSL: Ubuntu | Either | WASM binary (base64) | AssemblyScript → `.wasm` |
| WASM debug build | `pnpm wasm:build:debug` | WSL: Ubuntu | Either | WASM binary (debug) | With debug symbols |

## Cleanup

| Target / Task | Script | Shell / Environment | Local / Remote | Output / Result | Notes |
|---|---|---|---|---|---|
| Clean Vite cache | `pnpm clean:cache` | WSL: Ubuntu | Local | Removes `node_modules/.vite` | — |
| Clean build outputs | `pnpm clean:dist` | WSL: Ubuntu | Local | Removes `dist/`, `release/` | — |
| Clean node_modules | `pnpm clean` | WSL: Ubuntu | Local | Removes `node_modules/` | — |
| Nuclear clean | `pnpm clean:all` | WSL: Ubuntu | Local | Removes `dist/`, `release/`, `node_modules/` | — |
| Fresh reinstall | `pnpm reinstall` | WSL: Ubuntu | Local | Clean install | `clean:all` + `pnpm install` |

## Dependencies & Platform

| Target / Task | Script | Shell / Environment | Local / Remote | Output / Result | Notes |
|---|---|---|---|---|---|
| Check outdated | `pnpm deps:check` | WSL: Ubuntu | Either | Console output | `pnpm outdated` |
| Security audit | `pnpm deps:audit` | WSL: Ubuntu | Either | Console output | `pnpm audit` |
| Install for Linux | `pnpm install:linux` | WSL: Ubuntu | Local | `node_modules/` | Force Linux platform binaries |
| Install for Windows | `pnpm install:windows` | WSL: Ubuntu | Local | `node_modules/` | Force Windows platform binaries |
