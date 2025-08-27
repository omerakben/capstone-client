---
applyTo: "**"
---

# DEADLINE - Developer Command Center

## Frontend (Next.js) Copilot Instructions

Authoritative guidance for building and maintaining the DEADLINE web client. Replace backend-specific assumptions with these frontend rules while consuming the existing Django REST API.

> CRITICAL: "Development / Staging / Production" are USER CLASSIFICATION options for artifacts inside a workspace, NOT deployment environments. Never implement multi-deploy branching logic for them. We always run locally (localhost:3000) and send the selected logical environment as a field in artifact/workspace-related API calls.

---

## Product Recap

DEADLINE centralizes developer artifacts:

- Workspaces (containers) → Artifacts (ENV_VAR | PROMPT | DOC_LINK) each tagged with one of three fixed logical environments: DEV, STAGING, PROD.
- Goals: Reduce context switching, prevent configuration mistakes, speed copying and referencing.
- Security: Secrets masked, no client-side persistent storage of raw secret values.

### Key Value Propositions

- Unified Hub (configs, prompts, docs)
- Environment Awareness (user feature)
- Security First (masking, Firebase Auth tokens)
- Developer Efficiency (fast navigation, duplication)

---

## Technology Stack (Frontend)

- Framework: Next.js 15+ App Router (React Server Components where possible, but auth gating often requires client components).
- Language: TypeScript (strict).
- Styling: Tailwind CSS v4 (fallback to v3).
- Icons: lucide-react.
- Forms: react-hook-form (+ Zod resolver recommended).
- Auth: Firebase Web SDK (modular).
- HTTP: Axios single instance with interceptors (token + error shaping).
- Markdown (PROMPT preview): react-markdown + rehype-sanitize (add when implementing).
- Testing: Playwright (E2E), Vitest + React Testing Library (unit) (add scaffolding if missing).

---

## Directory & Module Conventions

```
src/
    app/                     # Route segments (App Router)
        login/                 # Public auth route
        dashboard/             # Recent workspaces
        workspaces/            # List page
        w/[id]/                # Workspace detail (tabs for environments)
        w/[id]/new/            # New artifact form
        docs/                  # Global documentation links hub
        settings/              # User settings page
    components/              # Reusable UI (atoms/molecules/layout)
    features/                # Feature-focused logic (auth, workspaces, artifacts)
    contexts/                # React Context providers
    hooks/                   # Reusable hooks (useAuth, useArtifacts, useClipboard)
    lib/
        api/                   # axios client + endpoint wrappers + types
        firebase/              # firebase init + token helpers
        validation/            # Zod schemas
    styles/                  # Tailwind extensions / tokens
    types/                   # Shared TS interfaces
```

Naming:

- Components: PascalCase (ArtifactCard.tsx)
- Hooks: camelCase starting with `use` (useArtifacts.ts)
- Context files: `<Name>Context.tsx` exporting Provider + hook (`useName`).
- Public exports via index.ts where aggregation helps.

---

## Core Frontend Architecture

1. Auth Context: Supplies `{ user, loading, signIn, signOut, getIdToken }`.
2. Data Fetching: Client-side fetch after auth (token), show skeletons meanwhile. Consider adding SWR/react-query later; start minimal with local cache + revalidation.
3. Environment Tabs: Controlled via URL search param `?env=DEV` to allow deep links; default DEV.
4. Artifact Operations: Use workspace-scoped endpoints; duplication posts to backend duplicate action; optimistic UI updates on success.
5. Separation of Concerns: API layer returns typed data; components do not embed axios logic directly.

---

## Authentication Flow

1. Initialize Firebase once in `lib/firebase/client.ts`.
2. `AuthProvider` listens to `onAuthStateChanged` → sets user & loading.
3. Middleware (`middleware.ts`) redirects unauthenticated users away from protected routes → `/login`.
4. Axios request interceptor injects fresh ID token if available.
5. On 401: Attempt one silent token refresh; if still failing → force sign out.

Security Rules:

- Never stash raw ENV_VAR values in localStorage/sessionStorage.
- Do not log secrets; redact to `'***'` if debugging.

---

## API Layer Design

`lib/api/http.ts` (axios instance):

- Base URL from env var (e.g., NEXT_PUBLIC_API_BASE_URL) fallback http://localhost:8000.
- Interceptors: add Authorization header, normalize errors to `{ code, message, details? }`.

`lib/api/workspaces.ts` / `artifacts.ts` / `docs.ts`:

- Functions return typed promises. Example:

```
export async function listWorkspaces(): Promise<Workspace[]> { /* ... */ }
export async function listArtifacts(params: { workspaceId:number; environment?:EnvCode; kind?:ArtifactKind; search?:string }): Promise<Artifact[]> {}
```

Types (simplified):

```
type EnvCode = 'DEV'|'STAGING'|'PROD';
type ArtifactKind = 'ENV_VAR'|'PROMPT'|'DOC_LINK';

interface BaseArtifact { id:number; workspace:number; kind:ArtifactKind; environment:EnvCode; notes?:string; updated_at:string; };
interface EnvVarArtifact extends BaseArtifact { kind:'ENV_VAR'; key:string; value:string; }
interface PromptArtifact extends BaseArtifact { kind:'PROMPT'; title:string; content:string; }
interface DocLinkArtifact extends BaseArtifact { kind:'DOC_LINK'; title:string; url:string; label?:string; }
```

Error Handling:

- Axios errors mapped to friendly messages; validation field errors surfaced to forms using react-hook-form `setError`.
- Global toast component for operation failures (auto-dismiss, accessible region).

---

## Forms & Validation

Use `react-hook-form` + Zod (if installed) for schemas:

```
EnvVarSchema: key: /^[A-Z0-9_]+$/; value: nonempty; notes? string
PromptSchema: title nonempty; content max 10000; notes? string
DocLinkSchema: title nonempty; url valid; label?; notes?
WorkspaceSchema: name nonempty; description? string
```

Guidelines:

- Disable submit while submitting; show spinner.
- Focus first invalid field on failure.
- Provide `aria-describedby` for error messages.

---

## UI Components

- Input / Select / TextArea wrappers integrate RHF errors & Tailwind states.
- EnvironmentBadge: DEV (blue), STAGING (amber), PROD (red). `aria-label` with full name.
- ArtifactCard: Minimal subset fields; actions (Copy, Duplicate, Edit, Delete). Hide irrelevant fields per kind.
- CopyButton: Disallow copying masked values (tooltip explains). Provide success feedback (check icon + short state).
- Modal / Drawer: Focus trap, ESC to close, accessible heading `<h2 id="modal-title">` referenced by `aria-labelledby`.
- Tabs: Keyboard (ArrowLeft/Right) cycling; maintain selected tab in URL.
- MarkdownPreview: Lazy load component & sanitize HTML.

Images Reference (UI Expectations):

- dashboard.png: Grid of workspaces showing counts & environment usage badges.
- workspace-create.png: Form with three fixed environment toggles (pre-checked all for MVP or user selectable? PRD indicates pre-seeded & read-only name set; treat them as always available).
- workspace.png: Detail view with environment tabs & artifact table/list.
- docs.png: Card gallery of DOC_LINK artifacts across all workspaces; filtering/search.
- settings.png: Profile info + destructive Delete Account section requiring confirmation.

---

## Environment Handling (Feature Clarification)

- Enum hard-coded; never allow custom environment names.
- All three environments assumed present; absence states out-of-scope.
- Duplication action: choose target environment != source; allow editing before confirm.

---

## Secrets & Masking

- Backend may return masked value `'••••••'`; UI must not attempt to treat that as real value.
- No reveal unless secure endpoint implemented; for MVP show disabled reveal button or omit.
- Avoid storing unmasked secret in any global context; keep in local state only if necessary for immediate display.

---

## Performance Guidelines

- Route-level code splitting inherent; dynamic import heavy components (Markdown, large tables).
- Debounce search inputs (250–300ms) before API call.
- Consider virtualization if artifact list exceeds 200 entries (placeholder TODO comment acceptable until implemented).
- Memoize expensive derived arrays (e.g., filtered artifacts) with `useMemo` keyed by dependencies.

---

## Accessibility (A11y)

- Provide visible focus outlines (Tailwind ring utilities).
- Ensure color contrast for badges (use white text on saturated backgrounds).
- `aria-live="polite"` region for toasts and form success messages.
- Keyboard-friendly modals & drawers (focus trap + restore previous focus on close).

---

## Testing Strategy

E2E (Playwright):

- Auth login/logout.
- Create workspace (US-1) and verify appearance on dashboard.
- Add ENV_VAR artifact (validation, masking, copy disabled when masked).
- Duplicate artifact across environments (US-5) and confirm distinct entry.
- Docs Hub listing & filtering.

Unit (Vitest + RTL):

- AuthContext transitions (mock Firebase).
- ArtifactCard conditional rendering per kind.
- EnvironmentBadge semantics & labels.
- Form validation mapping for each artifact type.

Utilities:

- `renderWithProviders` to wrap Auth + any other context.
- Mock axios (MSW preferred) for consistent responses.

---

## Error & Destructive Action UX

- Confirmations for delete workspace/artifact (modal; require explicit confirm click).
- Display inline field errors directly beneath component.
- Global unexpected errors: toast + console.warn (without secret payloads).

---

## Logging & Monitoring (MVP)

- Minimal console output in production build. Remove `console.log` before commit (lint rule optional).
- Optionally implement `reportWebVitals` file logging metrics to console for future instrumentation.

---

## Implementation Order (Aligns with `client-TODO.md`)

1. Project setup (Next.js, Tailwind, TS paths)
2. Auth foundation (Firebase init, AuthContext, middleware)
3. API layer + workspace pages
4. Artifact CRUD & duplication
5. Docs Hub
6. Settings & account deletion placeholder
7. Reusable form & modal components
8. Testing (E2E + unit)
9. Performance & polish (lazy loading, potential virtualization)

---

## Code Style

- Import order: Built-ins → External libs → Internal `@/...` → Relative.
- Explicit return types for exported functions/hooks.
- Avoid `any`; prefer discriminated unions for artifact kinds.
- Keep functions small & pure; move formatting helpers to `lib/`.

---

## Common Pitfalls to Avoid

- Treating environments as deployment envs (WRONG) – they are purely user classification.
- Caching secrets globally or storing in localStorage.
- Duplicating axios instances per feature.
- Bypassing form schema validation.
- Showing masked value as copy success.

---

## Roadmap (Post-MVP Ideas)

- Virtualized artifact lists.
- PROMPT variable interpolation preview & insertion UI.
- Light/Dark theme toggle with CSS variables.
- Advanced search facets & fuzzy search.
- Multi-user / shared workspaces & role permissions.

---

## Quick Do / Don’t

Do:

- Enforce validation & masking.
- Use a single axios client.
- Represent environment as enum everywhere.
- Provide loading and empty states.
  Don’t:
- Persist secrets.
- Create dynamic env names.
- Leave destructive actions unconfirmed.
- Ship console noise in prod.

---

## Minimal Contracts

Auth Context Value:

```
interface AuthContextValue {
    user: FirebaseUser | null;
    loading: boolean;
    signIn(email:string, password:string): Promise<void>;
    signOut(): Promise<void>;
    getIdToken(force?:boolean): Promise<string | null>;
}
```

Artifact Type Union (discriminated):

```
type Artifact = EnvVarArtifact | PromptArtifact | DocLinkArtifact;
```

---

## PR Checklist

- [ ] Feature scoped to correct directories
- [ ] Types & enums updated
- [ ] No secret persisted/logged
- [ ] Loading + error states implemented
- [ ] A11y: labels, focus, contrast
- [ ] Tests added/updated
- [ ] Lint & type check pass
- [ ] Environment usage correct
- [ ] client-TODO.md updated for any completed items (especially fe-setup-task-001 sub-tasks during setup phase)
- [ ] Memory entry added for each completed fe-setup-task-001 sub-task (use #memory tooling) capturing: task id, date, brief outcome
- [ ] Pre-push Quality Gates: build succeeds, `tsc` passes with 0 errors, ESLint passes with 0 errors & 0 warnings (treat warnings as errors), Playwright smoke (auth + one workspace flow) green
- [ ] No duplication of instruction files (single source: this file)
- [ ] No introduction of multi-deployment environment branching (DEV/STAGING/PROD remain artifact classification only)

---

If backend changes are required, consult the server repository's own Copilot instructions (do not duplicate server logic here). Frontend must remain thin: validation + user experience, not business rule enforcement beyond what’s necessary for UX quality.

---

## Operational Workflow & TODO Synchronization

Purpose: Ensure early setup tasks (fe-setup-task-001 and its sub-tasks) are rigorously tracked, memorialized, and quality-gated.

### When Completing Any fe-setup-task-001 Sub-Task

1. Update `client-TODO.md` checkbox from unchecked `[ ]` to checked `[x]` for that sub-task.
2. Add a memory observation (use `#memory` add) with fields: `taskId`, `status: done`, `date`, `notes (short outcome / deviations)`.
3. If change required code edits, run local quality gates before marking done.

### Pre-Push Quality Gates (Hard Requirement)

Execute (locally) and ensure ALL pass with zero warnings:

- Type check: `tsc --noEmit`
- Lint: ESLint (treat warnings as failures; resolve or explicitly justify & suppress with rule-specific comment)
- Build: `next build` (no warnings / errors)
- Minimal Playwright smoke: Auth login, create workspace, add ENV_VAR artifact (masked value path) – green.

If any gate fails, DO NOT push until resolved. Document any intentional, temporary suppression in PR description with rationale and removal plan.

### Memory Usage Policy for Setup Tasks

- Only persist durable state: which setup sub-tasks completed & notable deviations (e.g., Tailwind v4 unavailable → used v3.x commit hash). Avoid transient debugging notes.

### Single Source of Instruction Truth

This file (`.github/copilot-instructions.md`) supersedes and replaces prior duplicate `frontend-copilot-instructions.md`. Do not recreate secondary overlapping instruction files; consolidate here.

---

## Contribution Checklist (Extended Reference)

Use in addition to PR Checklist when introducing new feature slices:

- Architecture aligns with directory conventions.
- Secrets never logged or persisted client-side.
- Environment enum usage consistent & never treated as deployment toggle.
- Forms: schema validation (react-hook-form + Zod if available) + accessible errors.
- Masked values never copyable; tooltip explains restriction.
- Markdown sanitized (PROMPT artifacts).
- Loading skeletons or spinners shown for async gaps (no blank flashes).
- Tests cover happy path + at least one validation failure for new forms.
- Performance annotations (`// TODO: virtualize` etc.) added where future optimization identified.

---

## Final Reminder

When in doubt about environments or masking, re-read top CRITICAL note. Consistency & safety > novelty.

---

End of Frontend Copilot Instructions.
