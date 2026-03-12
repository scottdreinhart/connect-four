# Development Workflows

> **Purpose**: Practical step-by-step workflows for common development tasks.
> This is an informational document — see `AGENTS.md` for binding governance rules.

---

## Prerequisites

- **Node.js** v24+ (pin via [nvm](https://github.com/nvm-sh/nvm) — see `.nvmrc`)
- **pnpm** v10+ (`corepack enable && corepack prepare pnpm@10.31.0 --activate`)
- **Default shell**: WSL: Ubuntu for all general development

---

## 1. Install Dependencies

```bash
pnpm install
```

Preserves `pnpm-lock.yaml`. Never use `npm install` or `yarn`.

---

## 2. Development Server

```bash
# Start dev server (accessible on LAN via 0.0.0.0)
pnpm start

# Or: same, with alias
pnpm dev

# No-cache mode (forces full dep re-optimization)
pnpm start:nocache
pnpm dev:nocache

# Clean reinstall + dev server
pnpm dev:clean
```

Opens at `http://localhost:5173`. Hot module replacement is enabled.

---

## 3. Production Build

```bash
pnpm build
```

Outputs to `dist/`. Automatically runs `pnpm clean:dist` via the `prebuild` script.

```bash
# Clean reinstall + build
pnpm build:clean
```

---

## 4. Preview Production Build

```bash
# Preview an existing dist/ build
pnpm preview

# Or: build + preview in one step
pnpm build:preview
```

---

## 5. Quality Gate

### Check Everything (Pre-Push)

```bash
pnpm validate    # lint + format:check + typecheck + build
```

### Individual Checks

```bash
pnpm lint           # ESLint — find issues
pnpm format:check   # Prettier — check formatting
pnpm typecheck      # TypeScript — type check
pnpm check          # All three above combined
```

### Auto-Fix

```bash
pnpm fix            # lint:fix + format
```

---

## 6. Testing

```bash
pnpm test           # Run tests once (Vitest)
pnpm test:watch     # Run tests in watch mode
pnpm test:ci        # Run tests with v8 coverage (CI mode)
pnpm test:coverage  # Run tests with v8 coverage report
```

---

## 7. Cleanup & Fresh Start

```bash
# Clean Vite dependency cache
pnpm clean:cache

# Clean build outputs only (dist/ + release/)
pnpm clean:dist

# Remove node_modules
pnpm clean

# Nuclear: remove everything (dist + release + node_modules)
pnpm clean:all

# Fresh reinstall from scratch
pnpm reinstall
```

---

## 8. Dependencies & Analysis

```bash
# Check for outdated packages
pnpm deps:check

# Security vulnerability audit
pnpm deps:audit

# Build + open bundle visualizer report
pnpm analyze
```

---

## 9. Electron Desktop App

### Development

```bash
pnpm desktop:dev
```

Runs Vite dev server and Electron concurrently. Electron waits for `localhost:5173` before launching.

### Preview Production Build in Electron

```bash
pnpm desktop:preview
```

Builds Vite, then opens the `dist/` output in Electron.

### Package for Distribution

```bash
# Windows (run in PowerShell)
pnpm windows:build           # → release/*.exe (portable)

# Linux (run in WSL: Ubuntu)
pnpm linux:build             # → release/*.AppImage

# macOS (run on Apple hardware)
pnpm mac:build               # → release/*.dmg
```

All distributables are output to `release/` (gitignored).

---

## 10. Capacitor Mobile App

### One-Time Setup

```bash
pnpm android:init            # Add Android platform
pnpm ios:init                # Add iOS platform (requires macOS)
```

### Build & Sync

```bash
pnpm android:sync            # Vite build + sync to Android project
pnpm ios:sync                # Vite build + sync to iOS project
```

### Open Native IDE

```bash
pnpm android:open            # Open Android Studio
pnpm ios:open                # Open Xcode (requires macOS)
```

### Run on Device

```bash
pnpm android:run             # Deploy to Android device/emulator
pnpm ios:run                 # Deploy to iOS device/simulator (requires macOS)
```

---

## 11. WASM AI Engine

```bash
# Production build
pnpm wasm:build

# Debug build (with symbols)
pnpm wasm:build:debug
```

Compiles `assembly/index.ts` (AssemblyScript) to a WASM binary, then base64-encodes it for embedding. The loader is at `src/wasm/ai-wasm.ts`.

---

## 12. Platform-Specific Installs

```bash
# Force Linux platform binaries (useful on WSL)
pnpm install:linux

# Force Windows platform binaries
pnpm install:windows
```

---

## Shell Quick Reference

| Task | Shell |
|---|---|
| General development | WSL: Ubuntu |
| `pnpm windows:build` | PowerShell |
| `pnpm mac:build` | macOS / Apple |
| iOS Capacitor commands | macOS / Apple |
| Everything else | WSL: Ubuntu |
