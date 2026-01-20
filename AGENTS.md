# AGENT GUIDE FOR THIS REPO

This repo hosts a mobile-first Svelte single-page app that displays weekly exercise plans from a Markdown source. There is no backend.

## Build / Run / Check
- Package manager: npm (lockfile present).
- Install deps: `npm install` (use `npm ci` in CI once lockfile stabilizes).
- Dev server: `npm run dev` (default Vite server on port 5173).
- Build: `npm run build` (Vite).
- Preview prod build: `npm run preview`.
- Type-check: `npm run check` (runs `svelte-check` + `tsc` with `tsconfig.node.json`).
- Tests: none configured; add Vitest later if needed. For now, rely on `npm run check`.
- Single-test guidance (when added): prefer Vitest `vitest run path -t "name"`.
- Node version: use latest LTS; no `.nvmrc` yet.

## Data Source (exercise.md)
- Location: `src/lib/exercise.md`.
- Schema (strict for parsing):
  - Week header: `## Week N` (text after `##` captured as the week name).
  - Session header: `### Session X` (each week can have multiple sessions).
  - Topic line: `Topic: <topic>` (one per session).
  - Exercises: `- Name | Reps | Weight` (weight is free text: `60kg`, `135lb`, `bodyweight`).
- Parsing: handled by `src/lib/parseExercise.ts` via a line-based state machine. It collects errors for malformed lines, missing topics, or exercises before sessions/weeks.
- Error display: inline notice on the page when parsing errors exist.
- If you change the Markdown format, update the parser and the UI expectations together.

## UI & Interaction Model
- Mobile-only focus; double-tap interactions are primary.
- Views: `overview` (all weeks), `week` focus (single week), `exercise` focus (single exercise card).
- Navigation:
  - Double-tap a week chip to enter week focus.
  - Double-tap an exercise entry to enter exercise focus.
  - Back button appears in focus modes: from exercise → week, from week → overview.
- Animations: simple CSS transitions (scale/opacity) only; no external animation libs.
- Layout: table-like grid in overview; stacked cards in focus modes. Responsive adjustments in `src/app.css`.

## Files to Know
- `src/App.svelte`: main page; view state, double-tap logic, rendering, error notice.
- `src/lib/parseExercise.ts`: parser/types for the Markdown source.
- `src/lib/exercise.md`: sample data following the schema above.
- `src/app.css`: custom styling (Space Grotesk, gradients, cards, buttons).
- `vite.config.ts`: plain Vite config with Svelte plugin (no test config).
- `package.json`: scripts and dev dependencies; no lint/test tooling yet.

## Imports & Modules
- Use relative imports (no path aliases defined). Keep import order: Svelte/third-party first, then local files.
- Do not reintroduce unused imports; rely on TypeScript errors and manual cleanup.

## Formatting & Style
- Follow existing formatting; no formatter configured yet. Keep lines ≤ 120 chars.
- Use single quotes in TS/Svelte code, two-space indentation.
- End files with a newline; avoid trailing whitespace.
- CSS: keep selectors flat and purposeful; prefer descriptive utility classes over deep nesting.

## Types & State
- Types live in `parseExercise.ts`. The page uses a discriminated `ViewState` union.
- Keep derived values reactive (`$:`) for active week/session/exercise; avoid duplicating state.
- Default weight may be empty string; handle gracefully in UI if you add conditional display.

## Error Handling
- Parser: collect readable errors with line numbers and missing-topic messages; surface inline.
- UI: guard against out-of-range indices before access; current code checks availability before rendering focus views.
- When extending, prefer explicit user feedback over silent failures.

## Naming Conventions
- Components/files: PascalCase for Svelte components; current files are `App.svelte` plus libs.
- Variables/functions: camelCase; booleans prefixed with is/has/should.
- Weeks/Sessions/Exercises data follow `name/topic/reps/weight` keys; keep consistent.

## Interaction Notes (Touch)
- Double-tap detection: `registerTap` with 350ms threshold. `on:dblclick` is also attached for browsers that emit it; assignments are idempotent.
- Buttons: interactive elements are actual `<button>` with `button-reset` class to satisfy a11y and avoid ghost styling.
- Keep tap targets ≥44px height where feasible.

## Styling Notes
- Typography: Space Grotesk via Google Fonts; fallback system stack.
- Colors: light background gradients, navy accents; badges in blue tones. Preserve this palette unless redesigning intentionally.
- Avoid adding dark mode until requirements change.

## Extending Features (future suggestions)
- Add filters by topic, search by exercise name, or per-session notes.
- Add per-exercise metadata (tempo, rest, RPE) by extending the Markdown schema and parser.
- Add persistence later (localStorage) if editing becomes required; currently read-only.

## Testing Guidance (when added)
- Preferred: Vitest + @testing-library/svelte for component tests; place tests under `src/__tests__/` or alongside files with `.test.ts`.
- Single-test example: `npx vitest run src/lib/parseExercise.test.ts -t "parses week"`.
- Keep parser unit tests deterministic; avoid coupling to animations.

## Performance
- Dataset is tiny; avoid premature optimization. Keep animations lightweight (CSS transitions only).
- If adding large data, consider pagination or virtualized lists.

## Accessibility & Mobile
- App is mobile-first; keyboard shortcuts are not required per requirements, but keep semantic elements (buttons for actions, lists for data).
- Ensure color contrast remains acceptable for text and badges.

## Security & Privacy
- No backend or user data. Still avoid introducing analytics/trackers without consent.
- Do not log or embed secrets; none are required locally.

## Git Hygiene for Agents
- Do not commit unless explicitly asked. Avoid destructive commands (`git reset --hard`, force pushes).
- Never overwrite user-authored changes outside your scope.
- Keep changes scoped; update `exercise.md` sample only when adjusting schema or demonstrating features.

## Cursor / Copilot Rules
- None detected (`.cursor/rules/`, `.cursorrules`, `.github/copilot-instructions.md` absent). Document any future AI guardrails here.

## Updating This Doc
- Keep commands and schema in sync with the code. Update when adding tests, linting, or formatters.
- Maintain roughly ~150 lines; prefer concise, actionable bullets.
