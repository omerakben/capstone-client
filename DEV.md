Developer Setup
===============

Local Git hook to prevent pushes to main/master:

1. Set the hooks path:

   git config core.hooksPath .githooks

2. Ensure executable:

   chmod +x .githooks/pre-push

Continuous Integration
----------------------

GitHub Actions workflow `.github/workflows/ci.yml`:

- Blocks direct pushes to `main`/`master` (CI fails).
- Runs lint, typecheck, and production build on PRs and pushes.

