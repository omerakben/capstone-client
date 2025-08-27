# client/TODO.md

## Scope & Assumptions

This frontend implementation uses Next.js 15+ with App Router for the DEADLINE developer command center, integrating Firebase Authentication for user management and consuming a Django REST API backend. We assume Tailwind CSS v4 is stable (fallback to v3.x if needed), Firebase client SDK handles auth state management, and all sensitive data masking happens client-side with no plain-text storage. The MVP focuses on single-user workspaces without team features, with three environment types (Development, Staging, Production) that are pre-seeded and read-only.

## Checklist

[ ] fe-setup-task-001 [plan] [M] — Initialize Next.js 15+ project with App Router
   [x] fe-setup-sub_task-001 — Run create-next-app with TypeScript, Tailwind CSS, and App Router enabled
   [x] fe-setup-sub_task-002 — Configure src/ directory structure with app/, components/, lib/, hooks/ folders
   [x] fe-setup-sub_task-003 — Set up environment variables for Firebase config and API base URL
   [x] fe-setup-sub_task-004 — Verify dev server runs on localhost:3000 with no errors

[ ] fe-setup-task-002 [build] [S] — Configure Tailwind CSS v4 with design system
   [x] fe-setup-sub_task-001 — Install Tailwind CSS v4 (or v3.x fallback) with PostCSS and autoprefixer
   [x] fe-setup-sub_task-002 — Create design tokens for spacing (4/6/8), colors (neutral palette), and typography
   [x] fe-setup-sub_task-003 — Configure global styles in app/globals.css with base component classes

[ ] fe-setup-task-003 [build] [S] — Install and configure essential dependencies
   [x] fe-setup-sub_task-001 — Install lucide-react for icons, axios for API calls, react-hook-form for forms
   [x] fe-setup-sub_task-002 — Install firebase and firebase-admin SDK packages (firebase-admin skipped client-side)
   [x] fe-setup-sub_task-003 — Configure TypeScript paths in tsconfig.json for @ imports

[x] fe-auth-task-001 [build] [L] — Implement Firebase Authentication integration
   [x] fe-auth-sub_task-001 — Create AuthContext provider with login/logout/signup methods
   [x] fe-auth-sub_task-002 — Implement useAuth hook for accessing auth state and user info
   [x] fe-auth-sub_task-003 — Build login/signup page components at app/(auth)/login/page.tsx
   [x] fe-auth-sub_task-004 — Add middleware.ts for route protection checking Firebase tokens

[ ] fe-auth-task-002 [build] [M] — Create auth flow components
   [ ] fe-auth-sub_task-001 — Build AuthGuard wrapper component for protected pages
   [x] fe-auth-sub_task-002 — Implement token refresh logic with axios interceptors
   [ ] fe-auth-sub_task-003 — Add loading states during auth verification

[ ] fe-pages-task-001 [build] [M] — Implement Dashboard page (deps: fe-auth-task-001)
   [ ] fe-pages-sub_task-001 — Create app/dashboard/page.tsx with recent workspaces grid
   [ ] fe-pages-sub_task-002 — Add Quick Actions section with New Workspace and New Prompt buttons
   [ ] fe-pages-sub_task-003 — Implement global search bar component with debounced input
   [ ] fe-pages-sub_task-004 — Display artifact counts and environment badges per workspace card

[ ] fe-pages-task-002 [build] [L] — Build Workspaces list page
   [ ] fe-pages-sub_task-001 — Create app/workspaces/page.tsx with data table component
   [ ] fe-pages-sub_task-002 — Add columns for Name, Environments (badges), Artifacts count, Actions
   [ ] fe-pages-sub_task-003 — Implement New Workspace button triggering modal/drawer
   [ ] fe-pages-sub_task-004 — Add edit and navigate actions per row

[ ] fe-pages-task-003 [build] [L] — Develop Workspace Detail page with environment tabs
   [ ] fe-pages-sub_task-001 — Create app/w/[id]/page.tsx with dynamic routing
   [ ] fe-pages-sub_task-002 — Implement tab navigation for Dev/Staging/Production environments
   [ ] fe-pages-sub_task-003 — Build artifacts table with type filters (ENV_VAR, PROMPT, DOC_LINK)
   [ ] fe-pages-sub_task-004 — Add row actions: View, Edit, Copy, Duplicate to Env, Delete

[ ] fe-pages-task-004 [build] [M] — Create Artifact create/edit forms
   [ ] fe-pages-sub_task-001 — Build app/w/[id]/new/page.tsx for new artifact creation
   [ ] fe-pages-sub_task-002 — Implement dynamic form fields based on artifact type selection
   [ ] fe-pages-sub_task-003 — Add validation for ENV_VAR (key/value), PROMPT (title/content), DOC_LINK (title/url)
   [ ] fe-pages-sub_task-004 — Handle form submission with API calls and success/error feedback

[ ] fe-pages-task-005 [build] [M] — Implement Docs Hub page
   [ ] fe-pages-sub_task-001 — Create app/docs/page.tsx with pinned links grid
   [ ] fe-pages-sub_task-002 — Display link cards with favicon, title, domain, and last opened
   [ ] fe-pages-sub_task-003 — Add "Open in new tab" and "Copy link" actions per card
   [ ] fe-pages-sub_task-004 — Implement Add Link button and form

[ ] fe-pages-task-006 [build] [S] — Build Settings page
   [ ] fe-pages-sub_task-001 — Create app/settings/page.tsx with profile section
   [ ] fe-pages-sub_task-002 — Add Export Workspace to JSON functionality
   [ ] fe-pages-sub_task-003 — Implement Import Workspace from JSON with validation
   [ ] fe-pages-sub_task-004 — Add Delete Account danger zone with confirmation

[ ] fe-components-task-001 [build] [M] — Create reusable form components
   [ ] fe-components-sub_task-001 — Build Input, Select, TextArea, RadioGroup components
   [ ] fe-components-sub_task-002 — Create Button component with variants (primary, secondary, danger)
   [ ] fe-components-sub_task-003 — Implement FormField wrapper with label and error display
   [ ] fe-components-sub_task-004 — Add focus states and ARIA labels for accessibility

[ ] fe-components-task-002 [build] [M] — Build artifact display components
   [ ] fe-components-sub_task-001 — Create ArtifactCard for dashboard/list views
   [ ] fe-components-sub_task-002 — Build SecretValue component with mask/reveal toggle for ENV_VARs
   [ ] fe-components-sub_task-003 — Implement MarkdownPreview for PROMPT content display
   [ ] fe-components-sub_task-004 — Add CopyButton with clipboard API and success feedback

[ ] fe-components-task-003 [build] [S] — Develop environment badge components
   [ ] fe-components-sub_task-001 — Create EnvironmentBadge with color coding (Dev=blue, Staging=yellow, Prod=red)
   [ ] fe-components-sub_task-002 — Build EnvironmentTabs component for workspace detail navigation
   [ ] fe-components-sub_task-003 — Add active state styling and keyboard navigation

[ ] fe-components-task-004 [build] [M] — Implement modal and drawer components
   [ ] fe-components-sub_task-001 — Build Modal component with backdrop and close handlers
   [ ] fe-components-sub_task-002 — Create ConfirmDialog for destructive actions
   [ ] fe-components-sub_task-003 — Implement Drawer for mobile-responsive forms

[ ] fe-state-task-001 [build] [M] — Set up workspace state management
   [ ] fe-state-sub_task-001 — Create WorkspaceContext for current workspace data
   [ ] fe-state-sub_task-002 — Implement useWorkspace hook with CRUD operations
   [ ] fe-state-sub_task-003 — Add optimistic updates for better UX
   [ ] fe-state-sub_task-004 — Handle cache invalidation on mutations

[ ] fe-state-task-002 [build] [M] — Implement artifact state management
   [ ] fe-state-sub_task-001 — Create useArtifacts hook with filtering and sorting
   [ ] fe-state-sub_task-002 — Add artifact type validation helpers
   [ ] fe-state-sub_task-003 — Implement cross-environment duplication logic

[ ] fe-api-task-001 [build] [M] — Configure API client
   [x] fe-api-sub_task-001 — Set up axios instance with base URL and auth headers
   [x] fe-api-sub_task-002 — Create API service modules for workspaces, artifacts, docs
   [ ] fe-api-sub_task-003 — Implement request/response interceptors for token handling (refresh logic pending)
   [x] fe-api-sub_task-004 — Add TypeScript interfaces for all API responses

[ ] fe-api-task-002 [build] [S] — Handle API errors gracefully
   [ ] fe-api-sub_task-001 — Create centralized error handler with toast notifications
   [ ] fe-api-sub_task-002 — Implement retry logic for failed requests
   [ ] fe-api-sub_task-003 — Add loading states for all async operations

[ ] fe-testing-task-001 [test] [L] — Write Playwright E2E tests for user stories
   [ ] fe-testing-sub_task-001 — Test US-1: Create workspace with selected environments
   [ ] fe-testing-sub_task-002 — Test US-2: Add and manage environment variables
   [ ] fe-testing-sub_task-003 — Test US-3: Save and use prompt templates
   [ ] fe-testing-sub_task-004 — Test US-4: Pin documentation links
   [ ] fe-testing-sub_task-005 — Test US-5: Duplicate artifacts across environments

[ ] fe-testing-task-002 [test] [M] — Add unit tests for critical components
   [ ] fe-testing-sub_task-001 — Test auth hooks and context providers
   [ ] fe-testing-sub_task-002 — Test form validation and submission logic
   [ ] fe-testing-sub_task-003 — Test artifact type-specific rendering

[ ] fe-polish-task-001 [finish] [M] — Optimize performance
   [ ] fe-polish-sub_task-001 — Implement code splitting and lazy loading for routes
   [ ] fe-polish-sub_task-002 — Add React.memo and useMemo for expensive computations
   [ ] fe-polish-sub_task-003 — Optimize bundle size with tree shaking
   [ ] fe-polish-sub_task-004 — Add performance monitoring with Web Vitals

[ ] fe-polish-task-002 [finish] [S] — Enhance accessibility
   [ ] fe-polish-sub_task-001 — Audit all forms for proper labeling and ARIA attributes
   [ ] fe-polish-sub_task-002 — Ensure keyboard navigation works throughout app
   [ ] fe-polish-sub_task-003 — Add skip links and landmark regions
   [ ] fe-polish-sub_task-004 — Test with screen reader and fix issues

[ ] fe-polish-task-003 [finish] [S] — Add PWA features
   [ ] fe-polish-sub_task-001 — Configure manifest.json with app metadata
   [ ] fe-polish-sub_task-002 — Implement service worker for offline support
   [ ] fe-polish-sub_task-003 — Add install prompt for desktop/mobile

## Open Questions / Risks

- Tailwind CSS v4 stability and documentation availability
- Firebase Auth session persistence across App Router navigation
- Secret masking security in browser environment
- Performance impact of real-time sync if implemented later
- Mobile responsiveness requirements not fully specified
- Search functionality scope (client-side vs server-side filtering)
- Maximum artifact count per workspace/environment
- Browser clipboard API compatibility for copy features

## References

- <https://nextjs.org/docs/app>
- <https://firebase.google.com/docs/auth/web/start>
- <https://tailwindcss.com/docs/installation>
- <https://playwright.dev/docs/intro>
