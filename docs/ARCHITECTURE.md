# Architecture

## High-level structure
The repository keeps backend and frontend together under one project root while maintaining clear separation of responsibilities.

```text
CyberSmart-Workplace/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/
│       ├── features/
│       ├── hooks/
│       ├── pages/
│       ├── services/
│       └── styles/
├── docs/
│   ├── PRD.md
│   ├── DESIGN.md
│   └── ARCHITECTURE.md
├── report/
└── AGENTS.md
```

## Proposed technology choices
- Frontend: React + TypeScript with Next.js for a responsive web UI.
- Backend: FastAPI with Pydantic request/response schemas.
- Database: PostgreSQL for users, course structure, attempts, progress and survey responses.
- Testing: pytest for API tests and a frontend test runner selected during implementation.
- Deployment: a single web origin where practical, or explicit environment-based API configuration.

These are proposed choices and can be revised to match the team's skills and the lecturer's requirements.

## Main components
- **Frontend:** renders lessons, discussions, tasks, quiz and progress.
- **API layer:** validates requests and applies authentication/authorization.
- **Service layer:** handles course progress, quiz scoring and feedback.
- **Repository/data layer:** reads and writes application records.
- **Database:** stores course content metadata, progress and assessment attempts.
- **Instructor functions:** view aggregated completion and quiz outcomes.

## Main request flow

1. **Learner opens the landing page.** The frontend displays the CyberSmart Workplace introduction, course benefits, cybersecurity learning topics, and a clear **Start Learning** button.

2. **Learner navigates to the courses page.** The frontend displays available courses and allows the learner to select a course.

3. **Learner opens a course page.** The frontend displays the course description, learning objectives, modules, lessons, and available quizzes.

4. **Frontend calls the API.** When dynamic course content or learner data is required, the frontend sends an HTTP request using the configured API base URL.

5. **FastAPI validates the request.** The relevant API endpoint validates the incoming request and invokes the appropriate service layer.

6. **The service executes business logic.** The service handles the requested operation and communicates with the repository layer when data access is required.

7. **The repository reads or writes data.** The repository interacts with the database to retrieve or persist course content, lesson information, quiz attempts, learner progress, and other relevant records.

8. **The API returns a typed response.** FastAPI returns a structured response that follows the defined response schema and appropriate HTTP status codes.

9. **The frontend displays the result.** The frontend renders the requested content, updates the learner interface, or displays meaningful feedback when an error occurs.

10. **Learner continues learning.** The learner can navigate between lessons, complete quizzes, view results, and track progress through the learning dashboard.

### Landing page requirements

The landing page is the public entry point of CyberSmart Workplace and must be included in the frontend implementation.

It should contain:

- **Hero section:** A clear introduction to the platform, a cybersecurity-focused headline, supporting text, and a prominent Start Learning button.
- **Course introduction:** An overview of the cybersecurity awareness course and its learning objectives.
- **Learning topics:** An introduction to phishing awareness, password security, social engineering, safe browsing, and workplace data protection.
- **Learning process:** A brief explanation of how learners study lessons, practise cybersecurity scenarios, complete quizzes, and track their progress.
- **Call to action:** A clear route for learners to browse courses and begin learning.
- **Footer:** Relevant navigation links, contact information where applicable, and accessibility-related information.

The landing page should use a responsive layout, maintain consistent typography and spacing, support accessible navigation, and provide a clear user journey from the public homepage to the course content.

### Frontend routes

| Route | Purpose |
|---|---|
| `/` | Public landing page |
| `/courses` | Browse available courses |
| `/courses/:courseId` | View course details and modules |
| `/learn/:courseId/:lessonId` | Access an individual lesson |
| `/quiz/:quizId` | Complete a quiz |
| `/dashboard` | View learning progress and results |

### API interaction principles

- The frontend must use a central configuration for the API base URL rather than hardcoding URLs throughout the application.
- API requests and responses should follow the defined schemas.
- Business logic must remain in the service layer rather than being implemented directly in API route handlers or repository classes.
- Database access must be handled through the repository layer.
- The frontend must display loading states, successful results, empty states, and meaningful error messages.
- The landing page should remain accessible even when dynamic course data cannot be retrieved, provided its static content can be rendered independently.
- Authentication requirements should be applied to protected learner features where necessary without unnecessarily blocking access to the public landing page.
## Security and privacy
- Store secrets in environment variables, never in source control.
- Validate and authorize instructor-only endpoints on the server.
- Collect only data needed for course delivery and evaluation.
- Use synthetic data in the prototype and avoid confidential workplace information.
- Apply input validation, safe error responses, HTTPS in deployment and dependency updates.
- Define retention and deletion rules before production use.

## Reliability and low-bandwidth support
- Provide text-first resources and downloadable alternatives.
- Compress media and avoid loading large assets on the landing page.
- Show retry guidance for network failures.
- Keep frontend errors useful without exposing stack traces or secrets.

## Quality gates
- Backend unit/API tests pass.
- Frontend lint/type checks pass.
- Main learner flow is manually tested on desktop and mobile widths.
- Quiz feedback, keyboard navigation and contrast are checked before demonstration.
