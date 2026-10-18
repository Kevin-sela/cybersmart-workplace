# AGENTS.md — Contributor and Coding-Agent Rules

## Before making changes
1. Read `README.md` and the relevant documents in `docs/`.
2. Inspect the existing code before creating or replacing files.
3. Confirm the task scope and list the files expected to change.

## General rules
- Keep backend and frontend in this single repository, but do not mix their source code.
- Prefer small, understandable changes over broad rewrites.
- Do not invent requirements, client facts, credentials, test results or deployment URLs.
- Do not place secrets, real learner data or confidential client information in the repository.
- Keep `.env` files out of version control; provide `.env.example` with safe placeholders.
- Explain important design choices in plain language.

## Backend rules
- Use typed Pydantic schemas for API inputs and outputs.
- Keep HTTP routing, business logic and database access in separate layers.
- Validate input and enforce authorization on the server.
- Add tests for new business logic and important API failure cases.
- Return safe error messages; never expose stack traces or secrets to clients.

## Frontend rules
- Use TypeScript and reusable components.
- Keep API calls in `services/` or feature-specific service modules.
- Include loading, empty, success and error states.
- Ensure keyboard navigation, visible focus, responsive layout and readable contrast.
- Do not use colour as the only indicator of quiz correctness or progress.

## Testing and completion
- Run relevant tests and type/lint checks when available.
- Do not claim tests passed unless they were actually run.
- Summarize what changed, tests run, results and remaining limitations.
- Update documentation when behaviour or architecture changes.
