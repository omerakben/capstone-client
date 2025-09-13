DEADLINE Client (Next.js)
=========================

Frontend for the DEADLINE Developer Command Center. Provides a cohesive UI for managing:

- Workspaces (per‑owner isolation via Firebase Auth)
- Artifacts: ENV_VAR, PROMPT, DOC_LINK
- Tags (Many‑to‑Many) with create/list/delete and artifact assignment
- Environment awareness (DEV/STAGING/PROD) and workspace‑level enable/disable
- Global docs view and quick artifact search

Requirements
------------
- Node.js 18+ (recommended: 20+)
- A running DEADLINE API (default: http://localhost:8000/api/v1)
- Firebase Web config for authentication

Environment Variables
---------------------
Create `./.env.local` with at least:

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Install & Run
-------------
```
npm install
npm run dev       # http://localhost:3000

# Quality gates
npm run lint      # zero warnings enforced
npm run typecheck

# Production build
npm run build && npm start
```

Key Features
------------
- Secure Firebase authentication with token injection and retry logic
- Workspace isolation and environment toggling (server‑validated)
- Artifact editing with masked ENV_VAR values and environment switching
- Tagging (M2M) with usage counts and safe deletion
- Clean Axios error normalization with user‑friendly messages

Notes
-----
- Console logging is gated for development only.
- The API base URL can be overridden via `NEXT_PUBLIC_API_BASE_URL`.
- For a complete backend reference, see the server README.
