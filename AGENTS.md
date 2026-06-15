# print-design AI Development Guide

This guide is written **for AI coding agents only**. Follow it literally; improvise only when the rules explicitly authorize it.

## Platform Snapshot

print-design is a lightweight, data-driven Vue 3 print template designer library (`@print-design/vue`). It provides a visual drag-and-drop interface for assembling print templates and compiles them into pure HTML strings with `@page` CSS rules for direct printing via external tools (e.g., Lodop).

- **Core idea**: two-level JSON model — `MaterialItem` (mold, no instance ID) and `TemplateSchema` (canvas instance with paper config + positioned elements). Once an element is instantiated on the canvas, it is completely independent from the mold.
- **Layout model**: implicit-row table-based layout. Elements are assigned `(row, col, colSpan)` coordinates; the compiler groups them into `<tr>` rows inside a 12-column `<table>`.
- **Element types**: `value` (single text), `label-value` (key-value pair), `image` (`<img>`), `table` (data table with recursive children and row-level style overrides).
- **Compiler output**: pure `<table>/<tr>/<td>` + inline styles — deliberately avoids flex/grid for Lodop (IE engine) compatibility.

## Repository Structure

```
printDesign/
├── src/
│   ├── main.ts                    # App entry (dev mode only)
│   ├── App.vue                    # Demo host application with toolbar
│   ├── index.ts                   # Library main entry (@print-design/vue)
│   ├── compiler.ts                # Framework-agnostic compiler entry (@print-design/vue/compiler)
│   ├── env.d.ts                   # Vite/Vue type declarations
│   ├── designer/
│   │   ├── index.ts               # Internal barrel file
│   │   ├── types.ts               # All core type definitions
│   │   ├── useDesigner.ts         # Top-level composable (state management)
│   │   ├── inject.ts              # Provide/inject helpers
│   │   ├── paperPresets.ts        # Paper size presets (A4/A5/TRISECTION/80mm/58mm)
│   │   ├── compiler/
│   │   │   ├── generateHTML.ts    # Main HTML compilation engine
│   │   │   ├── renderElement.ts   # Element-to-HTML dispatcher
│   │   │   ├── styleToString.ts   # Style object → CSS inline string
│   │   │   └── resolvePath.ts     # Dot-path resolver for nested data
│   │   ├── components/
│   │   │   ├── Designer.vue       # Three-column layout container
│   │   │   ├── Canvas.vue         # Central canvas editing area
│   │   │   ├── LeftPanel.vue      # Material library sidebar
│   │   │   ├── RightPanel.vue     # Property inspector sidebar
│   │   │   └── elements/
│   │   │       ├── ElementPreview.vue  # Design-time element renderer
│   │   │       └── DesignTable.vue     # Interactive table designer
│   │   ├── materials/
│   │   │   └── index.ts           # Material registry (mutable array + registration)
│   │   └── utils/
│   │       └── units.ts           # mm ↔ px conversion (96 DPI)
│   ├── demo/
│   │   ├── index.ts               # Demo template registry
│   │   ├── materials.ts           # Demo material definitions (3 document types)
│   │   ├── sampleSchema.ts        # Kitchen receipt demo (80mm)
│   │   ├── moreSamples.ts         # Guest registration (A4) + cashier receipt (58mm)
│   │   └── preview.ts             # HTML export + preview window
│   └── styles/
│       ├── global.css             # CSS reset + base layout
│       └── tokens.css             # Design token CSS custom properties (--pd-*)
├── scripts/
│   └── test-compiler.mjs          # Compiler smoke test (Node.js, no browser)
├── samples-agents-md/             # Reference AGENTS.md samples from other projects
├── vite.config.ts                 # Dev server config
├── vite.config.lib.ts             # Library build config (ESM + CJS multi-entry)
├── vite.config.umd.ts             # UMD build config (single entry)
├── tsconfig.json                  # Main TypeScript config (strict mode)
├── tsconfig.node.json             # Node-side TS config (Vite)
├── package.json                   # @print-design/vue
├── design.md                      # UI design system specification (--pd-* tokens)
└── 项目设计文档.md                  # Project design document (architecture & data flow)
```

## Dev Environment Tips

- **Package manager**: npm (lock file `package-lock.json` is gitignored; no lock file committed).
- **Node.js**: requires a version supporting ES2020 and ES modules.
- **IDE**: VS Code with the Volar extension recommended for Vue 3 + TypeScript.
- **Path alias**: `@` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
- Install dependencies: `npm install`
- Start dev server: `npm run dev` (opens browser at `http://localhost:5173`)

## Commands

- **Dev server:** `npm run dev`
- **Type check:** `npm run typecheck` (runs `vue-tsc --noEmit`)
- **Build library (ESM + CJS + UMD):** `npm run build` (runs `vue-tsc -b && vite build -c vite.config.lib.ts && vite build -c vite.config.umd.ts`)
- **Build app only:** `npm run build:app` (runs `vue-tsc -b && vite build`)
- **Preview built app:** `npm run preview`
- **Run compiler smoke tests:** `npm run test` (runs `tsx scripts/test-compiler.mjs`)

## Coding Standards

### TypeScript & Vue

- **Framework**: Vue 3 Composition API (`<script setup lang="ts">`) exclusively. No Options API.
- **Strict mode**: TypeScript strict mode is enabled. `noUnusedLocals` and `noUnusedParameters` are enforced — do not leave dead variables or parameters.
- **State management**: strictly no Pinia / Vuex. Use Vue native `reactive` + `provide`/`inject` via the `useDesigner` composable and `DESIGNER_KEY` injection key.
- **Component naming**: PascalCase for component files (`Designer.vue`, `LeftPanel.vue`). One component per file.
- **Props & emits**: always declare explicit types for props. Use `defineProps<>()` and `defineEmits<>()` (type-based macros).
- **Reactivity**: prefer `ref()` for primitives, `reactive()` for objects. Use `computed()` for derived state.
- **Imports**: use the `@/` path alias for cross-directory imports within `src/`.

### CSS & Design Tokens

- **All visual values must use CSS custom properties** from `src/styles/tokens.css`. Never hardcode colors, font sizes, spacing, border radii, or shadows in component styles.
- **Token prefix**: all tokens use `--pd-` prefix. See `design.md` for the complete token reference.
- **Scoped styles**: all component styles must be `<style scoped>`.
- **Exceptions** for hardcoded values (allowed only in these cases):
  - User-configurable default values (e.g., `el.borderColor ?? '#000'`)
  - Color swatch presets (e.g., `SWATCHES = ['#000', '#333', ...]`)
  - One-off special state colors (e.g., drag highlight `#fff3e0`)

### Library Output Constraints

- The compiler output must use **pure `<table>/<tr>/<td>` + inline styles only** — no flex, no grid, no CSS classes. This is a hard requirement for Lodop (IE engine) compatibility.
- All text output must be **HTML-escaped** via `escapeHtml()` to prevent injection.
- Column widths in table elements are output in **mm units** (not px) for print accuracy.

### General

- **Language**: write code comments and documentation in Chinese (matching the existing codebase).
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces/components, UPPER_SNAKE_CASE for constants.
- **No `any`**: avoid `any` types. Use proper type assertions or generics.
- **No unused code**: delete dead code immediately; do not leave commented-out blocks or TODOs.
- **Dependencies**: minimize new dependencies. The project intentionally stays lightweight (only `vue`, `naive-ui`, `lodash-es`, `nanoid` as runtime deps).

## Architecture Boundaries

### Two-Level JSON Model

- **`MaterialItem`** (mold): defines the template for a business component — type, name, icon, documentType, and a `preset` (no instance ID, no canvas position). Lives in the material registry.
- **`TemplateElement`** (instance): a canvas element with unique `id` (nanoid), real `row/col/colSpan` coordinates, and full style overrides. Once created, it is completely decoupled from the mold.
- **`TemplateSchema`**: the top-level canvas state — paper config + flat array of elements.

### Material System

- Materials are registered via `registerMaterials()` at application startup. The registry is a mutable global array (`ALL_MATERIALS`).
- Each material can have **at most one instance** per template (enforced by name matching in `toggleMaterial()`).
- Materials are filtered by `documentType` — the left panel only shows materials matching the current template's document type.

### Compiler Separation

- `src/compiler.ts` is the **framework-agnostic** entry point. It exports pure functions with no Vue dependency. This is the sub-package for Node.js or non-Vue consumers.
- `src/index.ts` is the **full library** entry point that includes Vue components and composables.
- The compiler is a pure function: `generateHTML(schema, dataSource) → string`. No side effects, no DOM access.

### State Flow

1. `Designer.vue` instantiates `useDesigner()` and provides it via `provideDesigner()`.
2. Child components (`Canvas`, `LeftPanel`, `RightPanel`) consume state via `injectDesigner()`.
3. `RightPanel` uses direct `v-model:value` binding to `activeElement.style` — zero event dispatch.
4. `Canvas` renders elements using the same layout logic as the compiler (`table-layout:fixed`, 12-column `<colgroup>`), ensuring WYSIWYG.

### What is NOT in Scope

- No `window.print()` calls — the library only generates printable HTML.
- No printer communication or physical print configuration.
- No Pinia / Vuex — this is a hard architectural decision, not a preference.

## Testing

- **Compiler smoke tests**: `npm run test` runs `scripts/test-compiler.mjs` via `tsx`. This is a Node.js-only test that validates the compiler's pure functions without a browser.
- **Test coverage**: the smoke test covers utility functions, layout skeleton, business data rendering, row/column layout (colspan), nested table features (tree-recursive children), image rendering, column hide/rename, and border/header toggles.
- **Adding tests**: add new test cases to `scripts/test-compiler.mjs` using the existing `check(name, condition)` pattern. Each test section should have a descriptive comment header.
- **No formal test framework** (no Vitest/Jest). The test script uses a simple custom harness with pass/fail counting and `process.exit()`.

## Commits and PRs

- Write commit messages in Chinese or English, focused on what changed and why.
- Prefix with a scope when relevant: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`.
- Keep PRs focused — one logical change per PR.
- Run `npm run typecheck` before pushing to ensure no type errors.
- Run `npm run test` before pushing to ensure compiler correctness.

## Design Playbook

- **Preferred styles**: elegant, minimal solutions. Keep components lean. Use guard clauses. Delete dead code immediately.
- **Patterns to lean on**: composables for state, provide/inject for distribution, pure functions for compilation, CSS custom properties for theming.
- **Anti-patterns to avoid**:
  - Hardcoding visual values instead of using `--pd-*` tokens
  - Using flex/grid in compiler output (breaks Lodop)
  - Adding Pinia/Vuex or any external state library
  - Mixing Vue dependencies into the compiler entry (`src/compiler.ts`)
  - Creating elements without nanoid IDs
  - Bypassing the material registry for direct element creation

## Boundaries

- **Ask first**
  - Adding new runtime dependencies.
  - Changing the compiler output format (table → non-table).
  - Modifying the core type definitions in `types.ts`.
  - Changing the grid column count (`GRID_COLUMNS = 12`).
- **Never**
  - Add Pinia, Vuex, or any external state management library.
  - Use flex or grid in compiler-generated HTML output.
  - Hardcode colors, sizes, or spacing in component styles (use `--pd-*` tokens).
  - Call `window.print()` or interact with printers directly.
  - Import Vue or Naive UI in `src/compiler.ts` or any `src/designer/compiler/*` file.
  - Edit files in `dist/` (build output is generated).

## References

- `design.md` — complete UI design system specification (all CSS tokens and usage rules)
- `src/designer/types.ts` — all core type definitions
- `src/styles/tokens.css` — CSS custom property definitions
