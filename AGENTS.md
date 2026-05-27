# AGENTS.md

## Project

Frontend for deinweg — digital ecosystem for a Saturday school.

Stack:

- Vite
- React
- TypeScript
- React Router
- No styling framework unless DESIGN.md explicitly allows it

## Main rule

Build the frontend according to:

- ./DESIGN.md in the project root
- https://wiki.i-lab.ink/ru/project/ts
- https://wiki.i-lab.ink/ru/project/backend/enrollment-api-plan-draft

Use DESIGN.md as the only source for styles, colors, spacing, typography, layout rules, buttons, cards, forms, states, and responsive behavior.

Do not invent visual styles outside DESIGN.md.

## Documentation access

Wiki may require API access.

Do not hardcode API tokens in source code.

Use environment variables only:

VITE_API_BASE_URL=
WIKI_API_TOKEN=
````

## Language

The UI must support i18n:

* Ukrainian is default
* German is supported
* Language switcher must keep the current page

Do not hardcode user-facing text directly inside components.
Put translations into separate files.

## Theme

Support:

* Light theme
* Dark theme

Persist selected theme in `localStorage`.

## File structure

Every component must be in a separate file.

Recommended structure:

```txt
src/
  app/
    App.tsx
    router.tsx
    providers/
  shared/
    api/
    config/
    i18n/
    types/
    ui/
  features/
    enrollment/
    auth/
    admin/
    parent/
    teacher/
    student/
  pages/
  widgets/

## TypeScript rules

Use TypeScript everywhere.

Do not use any unless absolutely necessary.

Prefer explicit types:

type EnrollmentRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_relink";

API request and response DTOs must be typed.

## API

Use a centralized API client.

Base URL must come from:

import.meta.env.VITE_API_BASE_URL

JWT auth flow:

* POST /api/v1/auth/jwt/create/
* POST /api/v1/auth/jwt/refresh/

Password setup:

* POST /api/v1/auth/password-setup/request/
* POST /api/v1/auth/password-setup/confirm/

Enrollment public flow:

* POST /api/v1/enrollment-requests/
* GET /api/v1/enrollment-requests/status/{request_id}/

Admin enrollment moderation:

* GET /api/v1/admin/enrollment-requests/
* GET /api/v1/admin/enrollment-requests/{id}/
* PATCH /api/v1/admin/enrollment-requests/{id}/
* POST /api/v1/admin/enrollment-requests/{id}/approve/
* POST /api/v1/admin/enrollment-requests/{id}/reject/
* POST /api/v1/admin/enrollment-requests/{id}/request-relink/

## Roles

Implement routing and layouts for:

* guest
* parent
* teacher
* assistant
* admin
* student

Access rules:

* admin/* only for staff/admin
* teacher/* only for teacher or assistant
* parent/* only for linked children
* student/* only for own student profile

## Required frontend areas

### Guest

* News
* About school
* Contacts
* Donation block
* Enrollment request form

### Parent cabinet

* Children selector
* Child profile
* Lessons
* Attendance
* Teacher feedback
* Payment status
* Email subscription toggle
* Withdraw child action with confirmation modal

### Teacher / assistant cabinet

* Lesson list
* Attendance journal
* Curriculum plans
* Parent feedback
* Substitute access module
* Teacher profile

### Admin panel

* Enrollment moderation
* Students directory
* Parents directory
* Classes management
* Lessons management
* Staff management
* CMS/news management

## Forms

Use controlled forms.

Every form must have:

* loading state
* success state
* error state
* validation
* disabled submit while pending

Enrollment form must collect:

* parent email
* parent first name
* parent last name
* phone
* preferred locale
* student first name
* student last name
* student birth date
* student email

## UX rules

* Mobile-first
* Must work on phones, tablets, and desktop
* No broken empty states
* Every list must have loading, error, empty, and success states
* Dangerous actions require confirmation modal

## Components

Each component must be in its own file.

Bad:

// Do not put many components in one file
function Page() {}
function Card() {}
function Modal() {}

Good:EnrollmentPage.tsx
EnrollmentForm.tsx
EnrollmentStatusBadge.tsx
EnrollmentSuccess.tsx

## Styling

Use only styles derived from ./DESIGN.md.

Before creating or changing UI, read DESIGN.md.

Do not use Tailwind, Bootstrap, MUI, Chakra, shadcn, or custom design tokens unless DESIGN.md explicitly allows it.

## Output expectation

When implementing, provide complete files, not fragments.

Do not skip imports.

Do not invent backend fields not present in documentation unless marked as TODO.

Mark uncertain API details as:

// TODO: confirm with backend