# CSXL (Computer Science Experience Labs)

UNC Chapel Hill CS department web app. See `csxl.unc.edu` in production and [docs/](docs/) for human-readable documentation.

## Project Overview

This repo powers the Computer Science Experience Labs website at UNC Chapel Hill. The CSXL is a home base for CS students: it supports coworking reservations, office hours tickets, academic course views, student organizations, events, signage, and more. The same repo is also the semester project workspace for COMP 423: Foundations of Software Engineering.

## Agent Workflow (Required)

Before marking **any** task done, you must:

1. **Run lint**  
   - Frontend changes: `cd frontend && npm run lint`
2. **Run tests**  
   - Backend changes: `pytest`
3. **Reset demo data if you switched branches**  
   - `python3 -m backend.script.reset_demo`

If any command fails, stop and fix the issue instead of ignoring it.

## Environment

**Use the Dev Container.** Run \"Dev Container: Reopen in Container\" in VS Code. Requires `backend/.env` first—copy the variables from `docs/get_started.md` and set a strong `JWT_SECRET`.

## Build & Test

### Backend (Python / FastAPI)
- Install: `pip install -r backend/requirements.txt` (normally handled inside the dev container)
- Create DB: `python3 -m backend.script.create_database`
- Reset demo data: `python3 -m backend.script.reset_demo`
- Reset testing data: `python3 -m backend.script.reset_testing`
- Start dev servers: `honcho start` (backend + frontend + proxy)
- Run tests: `pytest`
- Coverage (services): `pytest --cov-report html:coverage --cov=backend/services backend/test/services`

When you add or change backend service methods, you should:
- Add or update tests under `backend/test/services/…`
- Re-run the coverage command above
- Open `coverage/index.html` on the host and ensure **100% coverage for the touched service files**

### Frontend (Angular 20 / TypeScript)
- Install: `cd frontend && npm install`
- Start: `npm run start` (or via `honcho start`)
- Lint: `npm run lint`
- Test: `npm run test` (not yet enforced in CI, but should pass for areas you touch)

## Architecture & Request Flow

High-level backend flow:
- **Request → FastAPI route (`backend/api/...`) → service (`backend/services/...`) → SQLAlchemy entity (`backend/entities/...`) → PostgreSQL DB**
- Pydantic models in `backend/models/` are used for request/response schemas.
- **All authorization and permission checks live in the service layer**, not in API route functions.
- Auth is via UNC SSO (Shibboleth). Dev-only auth helpers: `http://localhost:1560/auth/as/{onyen}/{pid}`.

High-level frontend flow:
- Angular modules and components live under `frontend/src/app/...`.
- Services (e.g. `ProfileService`, `PermissionService`) encapsulate API calls and permission checks.
- Components should stay thin: they call services and render templates.

For more detail, see `docs/auth.md`, `docs/database.md`, and `docs/testing.md`.

## Security & Permissions Patterns (Backend)

When writing or modifying backend service code:

- **Always perform permission checks in the service layer**, not in the API router.
- Service methods that require auth should take `subject: User` as their first parameter.
- For feature-specific rules, check the rule first; if it fails, use `PermissionService` or raise `UserPermissionException`.
- For administrative rules, use `PermissionService.enforce(subject, action, resource)` from `backend.services.permission`.
- On authorization failure, **raise `UserPermissionException`** (from `backend.services.exceptions`), not a generic HTTP or runtime error.

Reference patterns and examples in `docs/auth.md` and the existing services in `backend/services/`.

## Code Style

**Backend (Python):**
- Use Black for formatting (configured in the dev container and `backend/requirements.txt`).
- Follow the service pattern above (auth in services, not routes).
- New service methods must have corresponding tests with full coverage in `backend/test/services/`.

**Frontend (TypeScript/HTML):**
- ESLint + Prettier (with Tailwind plugin) are the source of truth.
- Follow existing Angular patterns: components + services, no one-off styles or frameworks.
- Keep templates readable; avoid deeply nested logic in HTML.

## Branching & Commits (COMP 423)

- Base branch for coursework: `stage` (not `main`).
- Branch from an Issue: `NN-descriptive-branch-name` (NN = GitHub issue number).
- Use Conventional Commits (checked by commitlint) for commit messages.
- PRs should describe: what changed, major changes, testing done, and future considerations.

## Scope & Do-Not-Touch Areas

Agents should **not** do the following unless explicitly asked in the task:

- Do **not** commit directly to `main` or `stage`; always work in a feature branch and assume a PR review step.
- Do **not** edit Alembic migration files under `backend/migrations/versions/` unless the task is clearly about schema migrations.
- Do **not** change production/deployment configs (e.g. `alembic.ini`, `.devcontainer`, CI configs) without explicit instructions.
- Do **not** alter authentication plumbing in `backend/api/authentication.py` unless the task is about auth itself.
- Do **not** introduce new backend frameworks or frontend state management libraries.

If a change seems risky or cross-cutting (auth, migrations, deployment), prefer to ask for clarification in the PR description.

## Where to Find More Detail

- Backend testing and coverage expectations: `docs/testing.md`
- Auth and permissions model: `docs/auth.md`
- Database design and reset scripts: `docs/database.md`
- Agent-focused refactoring notes: `docs/agent_refactoring_considerations.md`

For stack-specific details, see any `AGENTS.md` in subdirectories (for example, `backend/AGENTS.md` and `frontend/AGENTS.md` if present). Closer files override this root guidance.
