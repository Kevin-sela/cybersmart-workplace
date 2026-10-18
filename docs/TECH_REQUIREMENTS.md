# CyberSmart Workplace: Technical Requirements (Tools and Environment)

**Status:** Draft v0.1 · **Date:** 18 October 2026 · **Scope:** the tools, versions, packages and setup needed to build, test and run the project.

> All tools below are **proposed**. They can change to suit the team's skills and the lecturer's requirements. Versions marked "minimum" are the lowest supported; **pin exact versions** in lockfiles (`requirements.txt` / `package-lock.json`) and confirm the current stable release when the project starts.

---

## 1. Tool summary

| Area | Tool | Minimum version | Purpose |
|---|---|---|---|
| Frontend framework | **Next.js** (React) | current stable | Pages, routing, server rendering for a fast landing page |
| Frontend language | **TypeScript** | 5.x | Typed UI code |
| Runtime | **Node.js** | active LTS | Run and build the frontend |
| Frontend libraries | TanStack Query, React Hook Form, Zod, Radix UI, Recharts, react-markdown, DOMPurify | see 2.1 | Data fetching, forms, accessible UI, charts, safe content |
| Backend framework | **FastAPI** | current stable | REST API, validation, OpenAPI docs |
| Backend language | **Python** | 3.11+ | API, services, tests |
| Validation | **Pydantic** | v2 | Request/response schemas |
| ASGI server | **Uvicorn** | current stable | Runs FastAPI |
| ORM | **SQLAlchemy** | 2.x | Repository layer database access |
| Migrations | **Alembic** | current stable | Versioned schema changes |
| Database | **PostgreSQL** | 15+ (schema tested on 16) | Relational data store |
| Backend tests | **pytest**, **httpx** | current stable | Unit and API tests |
| Frontend tests | **Vitest** or **Jest**, **Playwright** | current stable | Component and end-to-end tests |
| Version control | **Git** + GitHub | current | Source control and review |
| Containers (optional) | **Docker** + Compose | current | Consistent local database |

---

## 2. Frontend

**Tools:** Node.js (active LTS), npm, Next.js, React, TypeScript.

**Why:** typed components, file-based routes that match the planned URLs (`/`, `/courses`, `/learn/:courseId/:lessonId`, `/quiz/:quizId`, `/dashboard`), and server rendering so the landing page loads quickly on slow connections.

**Packages (proposed):**

| Package | Use |
|---|---|
| `next`, `react`, `react-dom` | App framework |
| `typescript`, `@types/react`, `@types/node` | Typing |
| `eslint`, `eslint-config-next` | Linting |
| `prettier` | Formatting |
| `vitest` (or `jest`) + `@testing-library/react` | Component tests |
| `@playwright/test` | End-to-end tests on desktop and mobile widths |
| `@axe-core/playwright` | Automated accessibility checks |

### 2.1 Frontend libraries

Each library has one clear job. Keep the list small: add a library only when it saves real work or protects accessibility or security.

**Data and API**

| Library | Use | Notes |
|---|---|---|
| `@tanstack/react-query` | Fetching, caching, retries, loading and error states | Gives the loading/empty/error/retry behaviour required by the API principles |
| `openapi-typescript` | Generate TypeScript types from FastAPI's OpenAPI spec | Keeps frontend and backend contracts in sync |
| `openapi-fetch` (or a small `fetch` wrapper) | Typed API client | All calls go through the central API config |
| `zod` | Runtime validation of forms and API responses | Pairs with React Hook Form |

**Forms**

| Library | Use | Notes |
|---|---|---|
| `react-hook-form` | Sign-in, register, forum post, group checklist, survey | Accessible, low re-render cost |
| `@hookform/resolvers` | Connects Zod to React Hook Form | |

**UI and accessibility**

| Library | Use | Notes |
|---|---|---|
| `@radix-ui/react-*` (Dialog, Tabs, Progress, Accordion, RadioGroup, Tooltip) | Accessible, unstyled UI primitives | Keyboard support and ARIA handled correctly; use for quiz answers, tabs, dialogs |
| `tailwindcss` (optional) or CSS Modules | Styling | Choose one approach for the whole team |
| `clsx` | Conditional class names | |
| `lucide-react` | Icons | Mark decorative icons `aria-hidden` and label icon-only buttons |
| `next/font` (built in) | Self-hosted fonts | Avoids extra network requests |

**Charts and content**

| Library | Use | Notes |
|---|---|---|
| `recharts` | Dashboard quiz-score and skills charts | Provide a text or table alternative for each chart |
| `react-markdown` + `remark-gfm` | Render lesson text written in Markdown | Text-first lessons |
| `isomorphic-dompurify` | Sanitise forum and user-generated HTML | Required for any user content shown as rich text |
| `date-fns` | Date and time formatting | Small, tree-shakeable |

**State**

| Library | Use | Notes |
|---|---|---|
| React state and context | Local UI state | Default choice |
| `zustand` (optional) | Small shared client state (for example auth session, quiz draft) | Add only if context becomes awkward |

**Testing libraries**

| Library | Use |
|---|---|
| `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` | Component tests that mirror user behaviour |
| `vitest` (or `jest`) | Test runner |
| `msw` | Mock the API in tests |
| `vitest-axe` (or `jest-axe`) | Accessibility assertions in component tests |
| `@playwright/test`, `@axe-core/playwright` | End-to-end and accessibility checks |

**Install (example):**

```bash
cd frontend
npm install @tanstack/react-query zod react-hook-form @hookform/resolvers \
  @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-progress \
  @radix-ui/react-radio-group clsx lucide-react recharts \
  react-markdown remark-gfm isomorphic-dompurify date-fns openapi-fetch

npm install -D openapi-typescript msw vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  vitest-axe @playwright/test @axe-core/playwright
```

**Generate API types from the running backend:**

```bash
npx openapi-typescript http://localhost:8000/openapi.json -o src/services/api-types.ts
```

**Library rules:**

- Pin exact versions in `package-lock.json` and run `npm audit` before demonstration.
- Prefer accessible primitives (Radix) over hand-built dropdowns, dialogs and tabs.
- Never render user-generated content without sanitising it.
- Every chart must have a text or table alternative; never rely on colour alone.
- Watch bundle size: import only what you use, and load charts on the dashboard route only.

**Requirements:**

- One central API configuration module reads `NEXT_PUBLIC_API_BASE_URL`; no hard-coded API URLs.
- Every data view shows loading, success, empty and error states, with retry guidance for network failures.
- The landing page renders without the API.
- Plain CSS or CSS Modules are enough; add a utility framework only if the team agrees.

**Commands:**

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run typecheck  # tsc --noEmit
npm test
npm run build
```

---

## 3. Backend

**Tools:** Python 3.11+, FastAPI, Pydantic v2, Uvicorn, SQLAlchemy 2.x, Alembic.

**Why:** typed request/response contracts, automatic API docs at `/docs`, and a clear layered design (API, service, repository).

**Packages (proposed):**

| Package | Use |
|---|---|
| `fastapi`, `uvicorn[standard]` | API and server |
| `pydantic`, `pydantic-settings` | Schemas and environment-based settings |
| `sqlalchemy`, `alembic`, `psycopg[binary]` | Database access and migrations (PostgreSQL driver) |
| `argon2-cffi` (or `bcrypt`) | Password hashing |
| `pyjwt` | Access and refresh tokens |
| `slowapi` (or equivalent) | Rate limiting on auth and posting |
| `pytest`, `pytest-cov`, `httpx` | Testing |
| `ruff` | Linting and formatting |
| `mypy` | Static type checks |
| `pip-audit` | Dependency vulnerability scan |

**Layering rules:**

- **API layer** (`app/api/v1`): validate input, check roles, return typed responses. No business logic.
- **Service layer** (`app/services`): business rules such as quiz scoring and progress.
- **Repository layer** (`app/repositories`): the only code that touches the database.

**Commands:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate           # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head                # apply migrations
uvicorn app.main:app --reload       # http://localhost:8000  (docs at /docs)
pytest --cov=app
ruff check . && mypy app
pip-audit
```

---

## 4. Database

**Tool:** PostgreSQL 15+. The delivered `database/schema.sql` was run successfully on PostgreSQL 16.

**Extensions required:** `pgcrypto` (UUID generation), `citext` (case-insensitive email). Both ship with `postgresql-contrib`.

**Files:**

| File | Purpose |
|---|---|
| `database/schema.sql` | 25 tables, enums, constraints, indexes, triggers, 3 reporting views |
| `database/seed.sql` | Course shell, four modules, objectives O1–O7, empty final quiz |
| `database/erd.png`, `erd.svg` | Entity-relationship diagram |

**Choose one schema path (do not run both):**

1. **Quick start (prototype):** run `schema.sql` then `seed.sql` directly.
2. **Migration-based (recommended for the API project):** create an Alembic baseline from `schema.sql`, then apply later changes as migrations.

**Commands:**

```bash
createdb cybersmart
psql -d cybersmart -v ON_ERROR_STOP=1 -f database/schema.sql
psql -d cybersmart -v ON_ERROR_STOP=1 -f database/seed.sql
psql -d cybersmart -c "SELECT * FROM v_course_completion;"
```

**Optional Docker Compose for a local database:**

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: cybersmart
      POSTGRES_USER: cybersmart
      POSTGRES_PASSWORD: change-me-locally
    ports: ["5432:5432"]
    volumes:
      - dbdata:/var/lib/postgresql/data
volumes:
  dbdata:
```

---

## 5. Configuration (environment variables)

Never commit secrets. Provide a `.env.example` with fake values and keep real `.env` files out of Git.

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | Token signing secret (long, random) |
| `JWT_ALGORITHM` | Backend | e.g. `HS256` |
| `ACCESS_TOKEN_MINUTES` | Backend | Access token lifetime |
| `REFRESH_TOKEN_DAYS` | Backend | Refresh token lifetime |
| `CORS_ORIGINS` | Backend | Allowed frontend origins |
| `ENVIRONMENT` | Both | `development`, `test` or `production` |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend | Central API base URL |

`.env.example`:

```dotenv
DATABASE_URL=postgresql+psycopg://cybersmart:change-me-locally@localhost:5432/cybersmart
JWT_SECRET=replace-with-a-long-random-value
JWT_ALGORITHM=HS256
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=7
CORS_ORIGINS=http://localhost:3000
ENVIRONMENT=development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 6. Quality, testing and security tools

| Purpose | Tool | When to run |
|---|---|---|
| Backend unit and API tests | `pytest`, `httpx` | Every change |
| Backend lint and types | `ruff`, `mypy` | Every change |
| Frontend lint and types | `eslint`, `tsc --noEmit` | Every change |
| Frontend component tests | Vitest/Jest + Testing Library | Every change |
| End-to-end flow | Playwright (desktop and mobile viewport) | Before demonstration |
| Accessibility (automated) | `axe-core` via Playwright, Lighthouse | Before demonstration |
| Accessibility (manual) | Keyboard-only walkthrough, contrast check, screen reader spot check | Before demonstration |
| Dependency audit | `pip-audit`, `npm audit` | Before demonstration |
| Pre-commit hooks (optional) | `pre-commit` running ruff, prettier, eslint | Each commit |
| CI (optional) | GitHub Actions | Each push |

**Quality gates (must pass before demonstration):**

- Backend unit and API tests pass.
- Frontend lint and type checks pass.
- Main learner flow is manually tested on desktop and mobile widths.
- Quiz feedback, keyboard navigation and contrast are checked.
- `schema.sql` and `seed.sql` run cleanly on an empty database.

---

## 7. Design and documentation tools

| Purpose | Tool |
|---|---|
| UI mockups | The two dashboard designs (light sidebar layout and dark hero layout) |
| ER diagram | Graphviz (`dot`), generated from the live database |
| Docs | Markdown in `docs/`; Word and PDF for the report |
| API reference | FastAPI's built-in OpenAPI docs at `/docs` |

---

## 8. Repository layout

```text
CyberSmart-Workplace/
├── backend/
│   ├── app/{api/v1, core, db, models, repositories, schemas, services}
│   └── tests/
├── frontend/src/{components, features, hooks, pages, services, styles}
├── database/            schema.sql, seed.sql, erd.png, erd.svg
├── docs/                PRD.md, DESIGN.md, ARCHITECTURE.md, TECH_REQUIREMENTS.md
├── report/
└── AGENTS.md
```

---

## 9. Security requirements for tools

- Store secrets in environment variables or a secrets manager; never in source control.
- Hash passwords with Argon2id or bcrypt; never log passwords or tokens.
- Use HTTPS in deployment and restrict CORS to known origins.
- Use parameterised queries through SQLAlchemy; validate all input with Pydantic.
- Run `pip-audit` and `npm audit` and update dependencies before demonstration.
- Use synthetic data only in the prototype; do not use real workplace or learner data.

---

## 10. Open decisions

| Decision | Options | Owner |
|---|---|---|
| Frontend framework | Next.js (React) as planned, or a plain React single-page app | Team and lecturer |
| Schema path | Run `schema.sql` directly, or Alembic baseline | Backend lead |
| Hosting | Single origin where practical, or separate frontend and API hosts | Technology lead |
| Auth storage | Bearer tokens in memory, or secure HttpOnly cookies | Technology lead |
| E2E and CI scope | Playwright and GitHub Actions now, or manual testing only | Evaluation lead |
