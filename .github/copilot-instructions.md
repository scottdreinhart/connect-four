# Copilot Runtime Policy — Connect Four

> **Authority**: This file is subordinate to `AGENTS.md`. If any rule here conflicts, `AGENTS.md` wins.

Default development shell for this repository: **Bash (WSL Ubuntu)**.

Do not default to PowerShell unless the task is specifically a Windows packaging workflow such as `windows:build`.

---

## Package Manager

**pnpm only.** Never use npm, npx, yarn, or generate non-pnpm lockfiles.

```
pnpm install | pnpm add <pkg> | pnpm remove <pkg> | pnpm exec <bin> | pnpm run <script>
```

---

## Architecture (CLEAN + Atomic Design)

Three layers with strict import boundaries enforced by `eslint-plugin-boundaries`:

| Layer | Path | May Import |
|---|---|---|
| Domain | `src/domain/` | `domain/` only (zero framework deps) |
| App | `src/app/` | `domain/`, `app/` |
| UI | `src/ui/` | `domain/`, `app/`, `ui/` |
| Workers | `src/workers/` | `domain/` only |
| Themes | `src/themes/` | nothing (pure CSS) |

**Component hierarchy**: `atoms/ → molecules/ → organisms/`  
**Data flow**: Hooks → Organism → Molecules → Atoms (unidirectional)

---

## Import Rules

- Use path aliases: `@/domain/...`, `@/app/...`, `@/ui/...`.
- Import from barrel `index.ts` files, not internal modules.
- Never use `../../` cross-layer relative imports.

---

## Key Scripts

| Task | Script |
|---|---|
| Dev server | `pnpm start` or `pnpm dev` |
| Build | `pnpm build` |
| Quality gate | `pnpm check` (lint + format:check + typecheck) |
| Auto-fix | `pnpm fix` (lint:fix + format) |
| Full validation | `pnpm validate` (check + build) |
| Test | `pnpm test` / `pnpm test:ci` / `pnpm test:coverage` |
| Clean | `pnpm clean:cache` / `pnpm clean:dist` / `pnpm clean` / `pnpm clean:all` / `pnpm reinstall` |

Always prefer `pnpm <script>` over raw CLI commands when a matching script exists.

---

## Shell Routing

Default to **Bash (WSL: Ubuntu)** for all development work.

Use Bash for: installs, dev server, Vite builds, WASM builds, linting, formatting, typechecking, validation, testing, cleanup, Electron dev/preview, Linux Electron packaging, Capacitor sync, docs, and maintenance.

Use **PowerShell** only for:
- `pnpm run windows:build`

Use **macOS** only for:
- `pnpm run mac:build`
- `pnpm run ios:init`, `pnpm run ios:open`, `pnpm run ios:run`

Use **Android SDK** only for:
- `pnpm run android:init`, `pnpm run android:open`, `pnpm run android:run`

All other tasks must use **Bash**. Do not switch to PowerShell for ordinary development.

---

## Testing

This project uses **Vitest** with **@testing-library/react** and **jsdom**.

- Test setup: `src/__tests__/setup.ts`.
- Coverage via `@vitest/coverage-v8`.

Run `pnpm test` before pushing. Run `pnpm test:coverage` for coverage reports.

---

## Language Guardrails

Use the repository's approved languages only:

- HTML
- CSS
- JavaScript
- TypeScript
- AssemblyScript
- WebAssembly

Default to TypeScript and JavaScript for implementation.
Use HTML/CSS for structure and presentation.
Use AssemblyScript and WebAssembly only within the existing WASM pipeline.

Do not introduce orphaned helper scripts or alternate runtimes.
Do not create Python, Bash, PowerShell, Ruby, Go, Rust, Java, C#, or other side-language utilities unless explicitly requested.

Prefer:
1. existing `package.json` scripts
2. existing Node/TypeScript/JavaScript tooling
3. existing repository structure and file placement

Do not create parallel build paths or duplicate tooling.

---

## Anti-Orphan-Script Policy

Every new script must satisfy all of the following:

- it solves a real repository need
- it belongs to the approved language stack
- it fits the existing project structure
- it is callable from the existing package-script workflow when appropriate
- it does not duplicate an existing script, config, or toolchain
- it has a clear long-term owner and purpose

If a proposed script fails any of these checks, do not create it.

---

## Behavioral Rules

1. **Minimal change** — modify only what was requested; do not refactor, reorganize, or add dependencies unsolicited.
2. **Preserve style** — match existing code conventions, naming, and formatting.
3. **Cite governance** — if a request violates a rule, name the rule and suggest a compliant alternative.
4. **No new top-level directories** without explicit user instruction.
5. **Use existing scripts** from `package.json` before inventing CLI commands.
