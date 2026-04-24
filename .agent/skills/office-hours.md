---
name: office-hours
description: Domain knowledge for developing the CSXL Office Hours feature. Covers entities, Pydantic models, services, API endpoints, Angular frontend components, recurrence logic, and testing conventions. Use when working on office hours events, tickets, queue management, recurrence patterns, statistics, or related course-site features.
---

# Office Hours Feature — CSXL

## Architecture (4-layer pattern)

```
FastAPI API layer  →  Service layer  →  SQLAlchemy Entity layer  →  PostgreSQL
```

- **Entities** (`backend/entities/office_hours/`) — ORM table definitions. Provide `from_model()`, `from_new_model()`, `to_model()`, and `to_details_model()`.
- **Models** (`backend/models/office_hours/`) — Pydantic. Pattern: `New<X>` (no id) → `<X>` (has id) → `<X>Details` (with relationships).
- **Services** (`backend/services/office_hours/`) — all business logic and permission checks.
- **API** (`backend/api/office_hours/`) — thin routers; unpack params, call service, return. Use `registered_user` dependency for auth.

---

## Key Files

| Layer | File(s) |
|---|---|
| Entities | `backend/entities/office_hours/course_site_entity.py`, `office_hours_entity.py`, `office_hours_recurrence_pattern_entity.py`, `ticket_entity.py`, `user_created_tickets_table.py` |
| Models | `backend/models/office_hours/course_site.py`, `office_hours.py`, `office_hours_recurrence_pattern.py`, `ticket.py`, `ticket_state.py`, `ticket_type.py`, `event_type.py`, `office_hours_statistics.py` |
| Services | `backend/services/office_hours/office_hours.py`, `ticket.py`, `office_hours_recurrence.py`, `office_hours_statistics.py` |
| API | `backend/api/office_hours/office_hours.py`, `ticket.py`; OH-related also in `backend/api/academics/my_courses.py` |
| Frontend | `frontend/src/app/my-courses/course/office-hours/` |
| Tests | `backend/test/services/office_hours/` |

---

## Data Models

### `CourseSite` (top-level container)
Groups sections for a term. Fields: `id`, `title`, `term_id`, `minimum_ticket_cooldown` (minutes), `max_tickets_per_day`. Has one-to-many → `OfficeHoursEntity`, `SectionEntity`.

### `OfficeHours` (single event occurrence)
Fields: `id`, `type` (`OfficeHoursEventType`: `OFFICE_HOURS`, `TUTORING`, `REVIEW_SESSION`), `mode` (`IN_PERSON`, `VIRTUAL_STUDENT_LINK`, `VIRTUAL_OUR_LINK`), `description`, `location_description`, `start_time`, `end_time`, `course_site_id`, `room_id`, `recurrence_pattern_id` (nullable).

### `OfficeHoursRecurrencePattern`
Fields: `id`, `start_date`, `end_date`, `recur_monday`…`recur_sunday` (7 booleans). One-to-many → `OfficeHoursEntity`.

### `OfficeHoursTicket`
Fields: `id`, `description`, `type` (`TicketType`: `CONCEPTUAL_HELP`, `ASSIGNMENT_HELP`), `state` (`TicketState`: `QUEUED` → `CALLED` → `CLOSED` | `CANCELED`), `created_at`, `called_at`, `closed_at`, `have_concerns`, `caller_notes`, `office_hours_id`, `caller_id` (FK → `SectionMemberEntity`, nullable). Creators linked via `office_hours__user_created_ticket` association table (many-to-many to `SectionMemberEntity`).

---

## Services

### `OfficeHoursService`
- `get_office_hour_queue(user, oh_id)` → `OfficeHourQueueOverview` (staff only)
- `get_office_hour_get_help_overview(user, oh_id)` → `OfficeHourGetHelpOverview` (students only)
- `get_oh_event_role(user, oh_id)` → `RosterRole`
- `create(user, site_id, event)` / `update(...)` / `delete(...)` / `get(...)`
- `_check_site_admin_permissions(user, site_id)` — requires `UTA`, `GTA`, or `Instructor` role
- `_check_site_student_permissions(user, site_id)` — requires enrolled `Student` role

### `OfficeHourTicketService`
- `create_ticket(user, ticket)` — enforces: user is a student, no existing QUEUED ticket, `max_tickets_per_day`, `minimum_ticket_cooldown`
- `call_ticket(user, ticket_id)` — QUEUED → CALLED; staff only
- `cancel_ticket(user, ticket_id)` — student (own ticket) or staff
- `close_ticket(user, ticket_id, payload)` — CALLED → CLOSED; staff only; payload: `{ have_concerns: bool, caller_notes: str }`

### `OfficeHoursRecurrenceService`
- `create_recurring(user, site_id, event, recurrence_pattern)` — creates pattern entity + one `OfficeHoursEntity` per matching weekday between `start_date` and `end_date`
- `update_recurring(...)` — deletes future events in pattern then recreates
- `delete_recurring(user, site_id, event_id)` — deletes the given event + all future events in same recurrence (past preserved)

### `OfficeHoursStatisticsService`
- `get_statistics(user, site_id, ...)` → aggregate stats (total tickets, avg wait, avg duration, by type)
- `get_paginated_tickets(...)` → filterable by student, staff, date range
- `get_ticket_csv(...)` → `OfficeHoursTicketCsvRow` list for export

---

## API Endpoints

### `/api/office-hours`
| Method | Path | Action |
|---|---|---|
| GET | `/{id}/queue` | Queue overview (staff) |
| GET | `/{id}/role` | User's role for event |
| GET | `/{id}/get-help` | Help overview (student) |
| GET | `/{site_id}/{oh_id}` | Get single OH event |
| POST | `/{site_id}` | Create single OH event |
| POST | `/{site_id}/recurring` | Create recurring OH events |
| PUT | `/{site_id}` | Update single OH event |
| PUT | `/{site_id}/recurring` | Update this + future events |
| DELETE | `/{site_id}/{oh_id}` | Delete single OH event |
| DELETE | `/{site_id}/{oh_id}/recurring` | Delete this + future events |

### `/api/office-hours/ticket`
| Method | Path | Action |
|---|---|---|
| POST | `/` | Create ticket |
| PUT | `/{id}/call` | Call ticket (QUEUED → CALLED) |
| PUT | `/{id}/cancel` | Cancel ticket |
| PUT | `/{id}/close` | Close ticket (CALLED → CLOSED) |

### `/api/my-courses/{course_site_id}/...`
`oh-events/current`, `oh-events/future`, `oh-events/history`, `statistics`, `statistics/ticket-history`, `statistics/filter-data`, `statistics/csv`

---

## Frontend Components

All under `frontend/src/app/my-courses/course/office-hours/`:

| Component | Route | Roles | Notes |
|---|---|---|---|
| `office-hours-page` | `office-hours` | all | Lists current/future/past events |
| `office-hours-queue` | `office-hours/:id/queue` | UTA, GTA, Instructor | Polls every 10s; plays chime + tab flash on new ticket |
| `office-hours-get-help` | `office-hours/:id/get-help` | Student | Polls every 10s; reactive form with conceptual vs assignment modes |
| `office-hours-editor` | `office-hours/:id/edit` | UTA, GTA, Instructor | Create/edit; `:id = 'new'` for creation; day-of-week toggles for recurrence |

**Widgets:** `office-hour-event-card`, `queued-ticket-card`, `called-ticket-card`, `close-ticket-dialog`, `office-hours-statistics-card`

**Guards/Resolver:**
- `officeHourPageGuard(roles)` — calls `GET /role`, redirects if unauthorized
- `courseSitePageGuard(roles)` — uses cached course site overview (synchronous)
- `officeHoursResolver` — pre-fetches `OfficeHours` or returns blank default before editor mounts

**Signage:** `frontend/src/app/signage/widgets/office-hours/` — groups events by room into rotating columns (max 8 per column)

---

## Recurrence Pattern

1. Client sends `NewOfficeHours` (template event) + `NewOfficeHoursRecurrencePattern` (start/end date + weekday booleans).
2. Service creates the pattern entity, then iterates day-by-day over the date range, creating one `OfficeHoursEntity` per matching weekday.
3. Original event duration (end − start) is preserved across occurrences.
4. **Update** = delete future occurrences → recreate. Past occurrences are untouched.
5. **Delete** = find all events with same `recurrence_pattern_id` and `start_time >= today` → delete.

---

## Permission Model

Roles come from `SectionMemberEntity` (academics module). Role hierarchy: `Student` < `UTA` < `GTA` < `Instructor`.

- **Queue / call / close / update / delete** → requires `UTA`, `GTA`, or `Instructor` on the course site
- **Create ticket / get-help view** → requires enrolled `Student`
- **Statistics / CSV** → requires `UTA`, `GTA`, or `Instructor`

---

## Testing

Test files in `backend/test/services/office_hours/`:
- `fixtures.py` — pytest fixtures that instantiate all four services against a live test DB session
- `office_hours_data.py` — fake data (two course sites: COMP 110, COMP 301; events; queued/called tickets; recurrence patterns)
- `office_hours_test.py`, `ticket_test.py`, `office_hours_recurrence_test.py`, `office_hours_statistics_test.py`

Tests use `fake_data_fixture` imports from neighboring modules (term, course, section, room, office hours data) to control insertion order.

---

## Common Development Tasks

### Adding a field to `OfficeHoursEntity`
1. Add column to `backend/entities/office_hours/office_hours_entity.py`
2. Add field to `backend/models/office_hours/office_hours.py` (and `NewOfficeHours` if user-supplied)
3. Update `from_model()` / `from_new_model()` / `to_model()` in the entity
4. Create an Alembic migration: `alembic revision --autogenerate -m "description"`
5. Update frontend model in `frontend/src/app/my-courses/...` if exposed to UI

### Adding a new ticket state
1. Extend `TicketState` enum in `backend/models/office_hours/ticket_state.py`
2. Add a service method in `backend/services/office_hours/ticket.py` with appropriate permission check
3. Add an API endpoint in `backend/api/office_hours/ticket.py`
4. Update frontend service call in `MyCoursesService`

### Adding a new OH event endpoint
1. Add route to `backend/api/office_hours/office_hours.py`
2. Implement business logic in `backend/services/office_hours/office_hours.py`
3. Wire service into the router via `Depends()`
