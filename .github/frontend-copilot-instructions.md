# DEADLINE Frontend Copilot Instructions

applyTo: "\*\*"

---

## Purpose

Authoritative guidance for implementing and maintaining the DEADLINE web client (Next.js App Router) that consumes the Django REST API. This file tells AI assistants HOW to contribute while staying aligned with the PRD, task checklist, security, UX, and architectural constraints.

> CRITICAL: The terms Development / Staging / Production refer to USER ORGANIZATION of artifacts inside a workspace (a feature), NOT our deployment environments. We always develop locally (localhost:3000) against a local backend. Never introduce multi-deployment environment branching logic in the client for this feature.

---

## High-Level Product Context (Recap)

- Core Objects: Workspace → Artifacts (ENV_VAR | PROMPT | DOC_LINK) each scoped by user-selected logical environment (DEV/STAGING/PROD)
- Primary Goals: Centralize developer workflow elements; fast retrieval; safe viewing/copying of sensitive values.
- UX Pillars: Clarity, Speed (fewest clicks), Safety (mask secrets), Consistency (visual + state patterns).

---

## Technology Stack

- Framework: Next.js 15+ (App Router) with React 18/19 compatibility.
- Language: TypeScript strict mode.
- Styling: Tailwind CSS v4 (fallback: v3) + CSS variables for theme tokens.
- Icons: lucide-react.
- Forms: react-hook-form + Zod (add if not present) for schema validation.
- Auth: Firebase Web SDK (modular) – Email/password (MVP) + token retrieval for API Authorization header (Bearer <idToken>).
- HTTP: Axios instance with interceptors (auth + error normalization).
- Testing: Playwright (E2E) + Vitest / React Testing Library (unit) (add if not yet configured).

---

## Directory & Naming Conventions

```
src/
  app/                # Next.js App Router routes
    (public routes)/login
    dashboard
    workspaces
    w/[workspaceId]
    docs
    settings
    api/ (avoid: use server actions or route handlers only when needed)
  components/         # Reusable UI (atoms, molecules, layout) – create
  features/           # Feature-focused modules (workspaces, artifacts, auth)
  contexts/           # React Context Providers (AuthContext, WorkspaceContext)
  hooks/              # Reusable hooks (useAuth, useArtifacts, useClipboard)
  lib/
    api/              # axios client, endpoints, type defs
    firebase/         # firebase init & token helpers
    validation/       # Zod schemas & shared validators
  styles/             # Design tokens, tailwind extensions if any
  types/              # Global TypeScript interfaces (mirroring backend)
```

Naming:

- Components: PascalCase (ArtifactCard.tsx)
- Hooks: camelCase prefixed with use (useArtifacts.ts)
- Contexts: <Name>Context.tsx exporting provider & hook.
- Files inside feature folders may use index.ts for public exports.

---

## State Management Strategy

1. Global Auth: AuthContext wraps App (in `app/layout.tsx`). Provides: `{ user, loading, signIn(email,pw), signOut(), getIdToken(force?:boolean) }`.
2. Workspace Selection: WorkspaceContext stores currently viewed workspace (fetched on route entry). Invalidate after mutating workspace or artifacts.
3. Artifact Data: Hooks (`useArtifacts(workspaceId, { environment, kind, search })`) perform SWR-like fetch with local caching (consider react-query or SWR if added; else implement minimal stale-while-revalidate pattern).
4. Ephemeral UI State: Local component state (modals, drawers, form steps). Avoid placing transient UI state in Context.
5. Derived Filtering / Sorting: Always compute client-side from cached list; server queries can accept filter params for large sets but keep logic consistent.

---

## Authentication & Authorization

- Initialize Firebase in `lib/firebase/client.ts` (only once; guard with singleton).
- On sign-in, obtain ID token and attach to axios via request interceptor: `Authorization: Bearer <token>`.
- Refresh Strategy: If 401 and user is logged in, attempt `currentUser.getIdToken(true)` once, retry original request, else sign out.
- Protected Routes: Implement `middleware.ts` to redirect unauthenticated users away from protected segments (`/dashboard`, `/workspaces`, `/w`, `/docs`, `/settings`). Public: `/login`.
- Client-Side Guard: `AuthGuard` component shows skeleton/loader while `loading`, then either children or redirect.

---

## API Layer

`lib/api/http.ts`: axios instance configuration.

- Request Interceptor: inject fresh token from AuthContext.
- Response Interceptor: shape errors as `{ code, message, details? }`.

`lib/api/endpoints.ts` (or per-feature modules):

- Functions: `listWorkspaces()`, `createWorkspace(dto)`, `getWorkspace(id)`, `updateWorkspace(id,dto)`, `deleteWorkspace(id)`
- Artifact: `listArtifacts({workspaceId, environment, kind, search})`, `createArtifact(workspaceId,dto)`, `updateArtifact(id,dto)`, `deleteArtifact(id)`, `duplicateArtifact(id, environment)`
- Docs Hub: `listDocLinksGlobal()` (maps backend global doc link endpoint).

Types mirror backend fields; always include `environment` on artifact operations. Masking: backend may mask ENV_VAR values; treat `value === '••••••'` as masked; show Reveal flow requiring dedicated fetch (if backend supplies an endpoint) or do nothing (MVP: copy masked not allowed – disable until actual value known). Do NOT store unmasked values in any persistent client storage (no localStorage/sessionStorage/indexedDB).

Error Handling Pattern:

- Central toast or inline alert component (TBD). Provide user-friendly messages: fallback "Unexpected error" if unknown.
- Validation errors: map `serializer errors` -> field errors in react-hook-form via `setError`.

---

## Forms & Validation

- Use react-hook-form + Zod resolver (if adding zod). Example schemas:

```
EnvVarSchema: { key: /^[A-Z0-9_]+$/, value: string().min(1), notes?: string() }
PromptSchema: { title: string().min(1), content: string().max(10000), notes? }
DocLinkSchema: { title: string().min(1), url: string().url(), label?: string(), notes? }
WorkspaceSchema: { name: string().min(1), description?: string() }
```

- Submit handler: set `isSubmitting`, disable buttons, show spinner.
- Success: optimistic cache update → navigate or show toast.
- Duplicate Artifact Flow: open modal prefilled with existing values + changed environment.

Accessibility:

- All inputs have `id` + `<label htmlFor>`.
- Error text `aria-live="polite"`.
- Modals trap focus; ESC closes; backdrop clickable.

---

## UI Components (Key)

- Input / TextArea / Select / RadioGroup: minimal wrappers mapping RHF registration + Tailwind focus rings and error states.
- EnvironmentBadge: Colors (DEV=blue-600, STAGING=amber-500, PROD=red-600) with subtle background + accessible contrast; `aria-label` describing environment.
- ArtifactCard: Minimal fields based on kind; actions: Copy (value or content), Duplicate, Edit, Delete.
- CopyButton: Uses Clipboard API with fallback message; success ephemeral state (e.g., checkmark). Avoid copying masked values.
- Modal & Drawer: shared overlay styles, supports size variants.
- Tabs (for environments on workspace detail): keyboard navigable; maintain environment in search param `?env=DEV` for shareable link.

Layout:

- Primary nav (left or top) with icons referencing dashboard/workspaces/docs/settings; active route highlighted.
- Breadcrumb on workspace detail: Workspaces / {Workspace Name} / {Environment}

Images Provided (interpretation):

- dashboard.png: Workspace grid w/ artifact counts & environment badge cluster.
- workspace-create.png: Workspace creation form with environment selection (three toggles pre-defined; they are not dynamic additions).
- workspace.png: Detail page with environment tabs and artifact list segmented.
- docs.png: Documentation hub showing link cards (favicon + title + label + open action).
- settings.png: User profile + dangerous account delete zone.

---

## Pages & Routes

| Route       | Purpose                    | Protection | Notes                                       |
| ----------- | -------------------------- | ---------- | ------------------------------------------- |
| /login      | Auth screens               | Public     | Redirect if already authed → /dashboard     |
| /dashboard  | Recent workspaces overview | Auth       | Show last updated workspaces + quick create |
| /workspaces | Full list/table            | Auth       | Sort, search, counts                        |
| /w/[id]     | Workspace detail           | Auth       | Tabs: DEV/STAGING/PROD, artifact filtering  |
| /w/[id]/new | New artifact wizard        | Auth       | Query param `kind=ENV_VAR` etc to preselect |
| /docs       | Global DOC_LINK hub        | Auth       | Filter/search across workspaces             |
| /settings   | User settings profile      | Auth       | Delete account                              |

Navigation Assumptions: Use Next.js Link for transitions; prefer server components for data when possible but keep Firebase client-side constraint (auth token) => Most data fetching will happen on client after token acquisition. For SSR gap, show skeleton placeholders.

---

## Environment Handling (User Feature Clarification)

- Hard-coded enum: DEV | STAGING | PROD.
- Present as tabs & selection pills – not editable, not creatable, not deletable.
- Unselected environment states (if future customization) are out of MVP scope: assume all three available.
- Duplicate action must allow selecting target environment different from source.

---

## Security & Privacy

- Never persist secrets locally. Do not place raw ENV_VAR values in URL, logs, analytics.
- Masking logic: If backend sends masked placeholder, keep UI masked. Add "Reveal" only when backend supports secure endpoint (not MVP if absent).
- Prevent accidental copy of masked values (disable or tooltip explaining hidden).
- Sanitize markdown rendering for PROMPT content (add `marked` or `react-markdown` + rehype-sanitize).

---

## Performance Guidelines

- Use route-level code splitting by default (App Router does this).
- Dynamic imports for heavy components (markdown preview, code highlighting) only when needed.
- Memoize large lists (artifact list virtualization if > 200 items; leave as enhancement flag `// TODO: virtualize` when threshold separated).
- Avoid unnecessary re-renders: narrow context value objects; custom hooks return stable references where possible.

---

## Accessibility (A11y)

- Focus management on modal open/close.
- Keyboard: All interactive elements reachable via Tab; Enter/Space triggers actions; Arrow keys for tabs.
- Color contrast: Ensure badges pass WCAG AA (≥ 4.5:1 for text); use Tailwind text-white where necessary.
- Provide `aria-live` region for toasts.

---

## Testing Strategy

E2E (Playwright):

- Auth Flow (login success/fail)
- Create Workspace (US-1)
- Add ENV_VAR artifact, mask & copy restrictions
- Duplicate artifact across environments (US-5)
- Docs Hub list & open link

Unit / Component (Vitest + RTL):

- AuthContext logic (mock Firebase).
- ArtifactCard conditional rendering by kind.
- EnvironmentBadge accessible labels.
- Form validation mapping (simulate error responses).

Testing Utilities:

- Provide `renderWithProviders` helper injecting contexts.
- Mock axios with MSW or manual jest.mock to control responses.

---

## Error UX Patterns

- Inline field errors below input.
- Global operation errors: toast at top-right (auto-dismiss 5s) with unique id.
- Destructive actions (Delete workspace/artifact): confirmation modal requiring explicit phrase or at least second button confirm.

---

## Logging & Monitoring (MVP)

- Console warnings only for development misconfig (missing token). Avoid shipping verbose logs to users.
- Optional: Add simple Web Vitals logging in `reportWebVitals` (Next.js) printing to console.

---

## Implementation Phasing Guidance

Follow checklist from `client-TODO.md` sequentially. Do not start pages dependent on auth before auth foundation complete. Prefer shipping vertical slices: Auth → Workspace CRUD → Artifacts → Docs Hub → Settings → Polish.

---

## Code Style & Linting

- ESLint + TypeScript strict; fix all type errors before commit.
- Prefer explicit return types for exported functions.
- Import order: Node/Lib | External | Internal alias (@/...) | Relative.
- Use `@/*` path alias configured in `tsconfig.json`.

---

## Common Pitfalls (Avoid)

- Treating environments as deployment contexts (WRONG) – they are user classification only.
- Storing unmasked secret values beyond immediate component memory.
- Using server components where Firebase client auth gating is required (token only in browser) – fallback to client component + skeleton.
- Over-centralizing ephemeral UI state into contexts.

---

## Roadmap (Frontend-Specific Enhancements – Post-MVP)

- Virtualized artifact lists.
- Markdown variable interpolation preview for PROMPT placeholders `{{variable}}`.
- Search-as-you-type with debounced backend query.
- Theme switch (light/dark) with CSS variables.
- Role-based multi-user workspaces.

---

## Quick Reference (Do / Don't)

Do:

- Enforce form schemas.
- Keep environment enum consistent.
- Mask secret values everywhere.
- Use modular Firebase imports.
  Don't:
- Log raw secret values.
- Create dynamic environment names.
- Block UI without loading indicators.
- Duplicate axios configuration per feature.

---

## Minimal Code Contracts (Examples)

AuthContext Value:

```
interface AuthContextValue {
  user: FirebaseUser | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getIdToken(force?: boolean): Promise<string | null>;
}
```

Artifact Type (mirror backend subset):

```
interface BaseArtifact { id: number; workspace: number; kind: 'ENV_VAR'|'PROMPT'|'DOC_LINK'; environment: 'DEV'|'STAGING'|'PROD'; notes?: string; updated_at: string; }
interface EnvVarArtifact extends BaseArtifact { kind:'ENV_VAR'; key: string; value: string; }
interface PromptArtifact extends BaseArtifact { kind:'PROMPT'; title: string; content: string; }
interface DocLinkArtifact extends BaseArtifact { kind:'DOC_LINK'; title: string; url: string; label?: string; }
```

---

## Contribution Checklist (PR Template Suggestion)

- [ ] Follows directory conventions
- [ ] Types added/updated
- [ ] No secret exposure
- [ ] Loading & error states implemented
- [ ] Accessibility review (labels, focus, contrast)
- [ ] Tests added/updated (if logic)
- [ ] Lint & type check pass
- [ ] No environment misuse

---

## Final Reminder

When in doubt about environments or masking, re-read top CRITICAL note. Consistency & safety > novelty.

---

End of Frontend Copilot Instructions.
