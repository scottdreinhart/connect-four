# Frontend Instructions — React / Vite / UI

> **Scope**: Frontend stack, CLEAN architecture layers, component hierarchy, styling, linting, formatting, and type checking.
> Subordinate to `AGENTS.md` §3 (architecture) and §4 (path discipline).

---

## Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI library (hooks, memo, lazy, context) |
| TypeScript | 5.9 | Static type checking (strict mode) |
| Vite | 7 | Build tool + dev server |
| ESLint | 10 | Linting (flat config + `react`, `react-hooks`, `boundaries`, `prettier`) |
| Prettier | 3 | Code formatting |
| CSS Modules | — | Scoped component styling |

---

## Architecture — CLEAN Layers

| Layer | Path | May Import | Must Not Import |
|---|---|---|---|
| **Domain** | `src/domain/` | `domain/` only | `app/`, `ui/`, React, any framework |
| **App** | `src/app/` | `domain/`, `app/` | `ui/` |
| **UI** | `src/ui/` | `domain/`, `app/`, `ui/` | — |
| **Workers** | `src/workers/` | `domain/` only | `app/`, `ui/`, React |
| **Themes** | `src/themes/` | nothing (pure CSS) | everything |

Boundaries are enforced at lint time by `eslint-plugin-boundaries` (see `eslint.config.js`).

### Domain Layer (`src/domain/`)

- Pure, framework-agnostic game logic. Zero React dependencies.
- Files: `types.ts`, `constants.ts`, `board.ts`, `rules.ts`, `ai.ts`, `themes.ts`, `layers.ts`, `sprites.ts`.
- All exported through barrel `src/domain/index.ts`.

### App Layer (`src/app/`)

- React hooks, context providers, and services.
- Files: `useTheme.ts`, `useSoundEffects.ts`, `ThemeContext.tsx`, `SoundContext.tsx`, `sounds.ts`, `haptics.ts`, `storageService.ts`.
- All exported through barrel `src/app/index.ts`.

### UI Layer (`src/ui/`)

- Presentational React components following Atomic Design.
- `atoms/` → smallest reusable primitives (e.g., `ErrorBoundary.tsx`).
- `molecules/` → composed atom groups.
- `organisms/` → full feature components (e.g., `App.tsx`).
- `utils/` → UI utilities (e.g., `cssModules.ts` for `cx()` class binding).
- All exported through barrel `src/ui/index.ts`.

---

## Component Hierarchy (Atomic Design)

```
atoms/ → molecules/ → organisms/
```

- Data flows unidirectionally: **Hooks → Organism → Molecules → Atoms**.
- Organisms contain zero inline markup; all composition happens in JSX.
- Components are predictable, composable, and reusable across contexts.

---

## Import Conventions

- **Path aliases**: `@/domain/...`, `@/app/...`, `@/ui/...` (configured in `tsconfig.json` paths + `vite.config.js` resolve.alias).
- **Barrel imports**: Always import from `index.ts`, never from internal module files.
- **No cross-layer relative imports**: Never use `../../` to cross layer boundaries.

```typescript
// ✅ Correct
import { createBoard, checkGameResult } from '@/domain';
import { useTheme } from '@/app';

// ❌ Wrong — cross-layer relative import
import { createBoard } from '../../domain/board';
```

---

## Entry Point

`src/index.tsx` wires the provider tree:

```
ThemeProvider > SoundProvider > ErrorBoundary > App
```

- `ThemeProvider` — theme state via React Context.
- `SoundProvider` — sound state + guarded play functions via React Context.
- `ErrorBoundary` — crash isolation with themed fallback UI + retry button.

---

## Styling

- Global styles and CSS custom properties in `src/styles.css`.
- Theme files in `src/themes/` — lazy-loaded CSS chunks (pure data, no imports).
- Component-scoped styles via CSS Modules.
- UI layout constants in `src/ui/ui-constants.ts`.

---

## Quality Workflow

All commands run in **Bash (WSL: Ubuntu)** (default shell).

```bash
pnpm lint           # ESLint check
pnpm lint:fix       # ESLint auto-fix
pnpm format         # Prettier format
pnpm format:check   # Prettier check (no write)
pnpm typecheck      # tsc --noEmit
pnpm check          # lint + format:check + typecheck (quality gate)
pnpm fix            # lint:fix + format (auto-fix everything)
pnpm validate       # check + build (full pre-push validation)
```

Run `pnpm validate` before pushing.

---

## Language Guardrails

Frontend code uses **TypeScript** for logic and **CSS** for styling.

Do not introduce orphaned helper scripts or alternate runtimes.
Do not create Python, Bash, PowerShell, Ruby, Go, Rust, Java, C#, or other side-language utilities.
Prefer existing `package.json` scripts and repository-native tooling (Vite, ESLint, Prettier).
Modern ESM syntax; match existing code conventions.
