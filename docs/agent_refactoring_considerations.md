# Refactoring Considerations for Agent Compatibility

This document outlines changes and patterns that improve how AI agents (Copilot, Claude Code, Cursor, etc.) can work effectively on the CSXL codebase. Use it when planning refactors or adding new features.

## 1. Documentation & Discoverability

| Priority | Consideration | Why |
|----------|---------------|-----|
| High | Keep `AGENTS.md` under ~150 lines, actionable only | Agents have limited context; long files reduce effectiveness |
| High | Prefer stable concepts over file paths | Paths change; patterns (e.g. "service methods take `subject` first") stay |
| Medium | Add `AGENTS.md` in `frontend/` and `backend/` if conventions diverge | Nested AGENTS.md lets agents read the nearest file |
| Medium | Use Cursor rules (`.cursor/rules/*.mdc`) for file-type specifics | e.g. `**/*.tsx` rules for Angular, `**/*.py` for FastAPI |

## 2. Code Structure for Agent Comprehension

| Priority | Consideration | Why |
|----------|---------------|-----|
| High | One clear responsibility per file/module | Agents reason about smaller scopes better |
| High | Explicit, consistent naming (e.g. `*_service.py`, `*-service.ts`) | Predictable patterns help agents infer structure |
| Medium | Avoid "god" functions; split by concern | Large functions are harder for agents to edit safely |
| Medium | Keep imports and dependencies explicit | Hidden/cyclic dependencies confuse agents |

## 3. Linting & Tests (Non-Functional Requirements)

| Requirement | Current State | Refactor Ideas |
|-------------|---------------|----------------|
| Lint all incoming code before marking complete | Frontend: `npm run lint`; Backend: Black (format) | Add pre-commit or CI step that runs both; document in AGENTS.md |
| Run tests and verify pass before finalizing | `pytest` for backend; frontend tests exist | Add unified `make test` or `npm run test:all`; consider CI gating |
| Code style consistency | Black, ESLint, Prettier | Ensure configs are committed and consistent across dev container |

## 4. Consistent Patterns Agents Can Learn

- **Authorization:** Service methods: `subject: User` first; check admin permissions before `UserPermissionException`
- **Errors:** Use `ResourceNotFoundException`, `UserPermissionException`, etc. from `backend.services.exceptions`
- **Testing:** `backend/test/` mirrors `backend/` structure; fixtures in `*_data.py` or `conftest.py`
- **Commits:** Conventional Commits (commitlint)

Standardizing these and documenting them in AGENTS.md makes agent-generated code more likely to match project conventions.

## 5. Dev Container & Environment

| Priority | Consideration | Why |
|----------|---------------|-----|
| High | Dev container is the canonical environment | Reduces "works on my machine" issues for agents and humans |
| Medium | Document required env vars in one place | Agents need to know what `backend/.env` must contain |
| Perhaps | Standardize dev container config across team repos | COMP 423 teams may fork; shared config = consistent agent behavior |

## 6. CI/CD Integration

- Run lint (frontend + backend formatting) on every PR
- Run `pytest` on every PR
- Consider frontend tests in CI when automated
- Add a check that AGENTS.md exists and is under size limit

## 7. What to Avoid

- Over-documenting: agents infer from code; document only what's non-obvious
- File-path-heavy docs: paths change; capability descriptions (e.g. "service layer") stay
- Inconsistent patterns: one-off styles in new code confuse agents
- Skipping tests or lint "temporarily": agents learn from what runs; if it's skipped, they may skip too
