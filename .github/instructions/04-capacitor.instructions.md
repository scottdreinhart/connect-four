# Capacitor Instructions

> **Scope**: Capacitor mobile/tablet app development, native platform setup, and deployment.
> Subordinate to `AGENTS.md` §5 (shell routing) and `01-build.instructions.md` for general build rules.

---

## Overview

Capacitor wraps the Vite `dist/` output in native Android and iOS app shells. The web code runs in a native WebView — no code changes are needed between web and mobile builds.

Configuration: `capacitor.config.ts` in the project root.

---

## Scripts

| Script | What It Does |
|---|---|
| `pnpm android:init` | Add Android project (one-time setup) |
| `pnpm ios:init` | Add iOS project (one-time setup) |
| `pnpm android:sync` | Vite build + sync web assets to Android project |
| `pnpm ios:sync` | Vite build + sync web assets to iOS project |
| `pnpm android:open` | Open in Android Studio |
| `pnpm ios:open` | Open in Xcode |
| `pnpm android:run` | Deploy to Android device/emulator |
| `pnpm ios:run` | Deploy to iOS device/simulator |

All scripts use `pnpm exec cap` (never `npx cap`).

---

## Environment Routing

| Script | Required Environment |
|---|---|
| `pnpm android:init` | Bash (WSL: Ubuntu) or any |
| `pnpm ios:init` | **macOS / Apple** (Xcode required) |
| `pnpm android:sync` | Bash (WSL: Ubuntu) |
| `pnpm ios:sync` | Bash (WSL: Ubuntu) |
| `pnpm android:open` | Any (requires Android Studio) |
| `pnpm ios:open` | **macOS / Apple** (requires Xcode) |
| `pnpm android:run` | Any (requires Android SDK + connected device/emulator) |
| `pnpm ios:run` | **macOS / Apple** (requires Xcode + iOS device/simulator) |

**iOS builds require Apple hardware.** Never suggest iOS Capacitor commands unless the user has confirmed macOS availability.
Default to Bash for sync and general Capacitor setup.

---

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@capacitor/core` | 8.2.0 | Runtime (dependency) |
| `@capacitor/android` | 8.2.0 | Android platform (dependency) |
| `@capacitor/cli` | 8.2.0 | CLI tool (devDependency) |

---

## Platform Support

| Platform | Distribution | Input Method |
|---|---|---|
| Android phones | Google Play Store / `.apk` | Touch, swipe gestures |
| Android tablets | Google Play Store | Touch, swipe gestures |
| Amazon Fire tablets | Amazon Appstore | Touch, swipe gestures |
| iPad | App Store | Touch, swipe gestures |
| iPhone | App Store | Touch, swipe gestures |

---

## Workflow

1. Build the web app: `pnpm build`
2. Sync to native projects: `pnpm android:sync` or `pnpm ios:sync`
3. Open IDE: `pnpm android:open` or `pnpm ios:open`
4. Build and run from the native IDE (Android Studio / Xcode)

For rapid iteration, use `pnpm android:run` or `pnpm ios:run` to deploy directly to a connected device.

---

## Language Guardrails

Capacitor configuration uses **TypeScript** (`capacitor.config.ts`).\nDo not introduce orphaned helper scripts or alternate runtimes for Capacitor workflows.
Prefer existing `package.json` scripts and repository-native tooling.
Do not create parallel build paths or duplicate tooling.
