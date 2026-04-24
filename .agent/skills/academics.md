---
name: academics
description: Domain knowledge for developing the CSXL Academics feature. Covers Term, Course, Section, SectionMember, CourseSite, and Hiring entities, Pydantic models, services, API endpoints, Angular frontend components and services, the RosterRole permission model, and testing conventions. Use when working on terms, courses, sections, rosters, section members, course sites, hiring, or the My Courses dashboard.
---

# Academics Feature — CSXL

## Architecture

Follows the project-wide 4-layer pattern:
```
FastAPI API layer  →  Service layer  →  SQLAlchemy Entity layer  →  PostgreSQL
```
- Entities: `backend/entities/academics/`
- Models: `backend/models/academics/`
- Services: `backend/services/academics/`
- API: `backend/api/academics/`
- Frontend: `frontend/src/app/academics/`

---

## Key Files

| Layer | Files |
|---|---|
| Entities | `term_entity.py`, `course_entity.py`, `section_entity.py`, `section_member_entity.py`, `section_room_entity.py`, `hiring/hiring_level_entity.py`, `hiring/hiring_assignment_entity.py`, `hiring/application_review_entity.py` |
| Models | `academics/term.py`, `course.py`, `section.py`, `section_member.py`, `section_details.py`, `my_courses.py`, `hiring/application_review.py`, `hiring/hiring_assignment.py`, `hiring/hiring_level.py` |
| Services | `academics/term.py`, `course.py`, `section.py`, `section_member.py`, `course_site.py`, `hiring.py` |
| API | `academics/term.py`, `course.py`, `section.py`, `section_member.py`, `my_courses.py`, `academics/hiring.py`, `application.py` |
| Tests | `backend/test/services/academics/` |

---

## Data Models

### `TermEntity` — `academics__term`
| Field | Type | Notes |
|---|---|---|
| `id` | `String(6)` PK | e.g. `"F24"`, `"S25"` |
| `name` | String | e.g. `"Fall 2024"` |
| `start` / `end` | DateTime | term date range |
| `applications_open` / `applications_close` | DateTime (nullable) | TA application window |

Relations (one-to-many): `course_sections`, `course_sites`, `applications`, `hiring_assignments`

### `CourseEntity` — `academics__course`
| Field | Type | Notes |
|---|---|---|
| `id` | `String(9)` PK | e.g. `"COMP110"` |
| `subject_code` | String | e.g. `"COMP"` |
| `number` | String | e.g. `"110"` |
| `title`, `description`, `credit_hours` | String/Int | `-1` = variable credit |

Relations: `sections` → `SectionEntity`

### `SectionEntity` — `academics__section`
| Field | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `course_id` | FK → `academics__course` | |
| `term_id` | FK → `academics__term` | |
| `number` | String | e.g. `"003"` |
| `meeting_pattern` | String | e.g. `"MWF 4:40PM – 5:30PM"` |
| `override_title` / `override_description` | String | special topics override |
| `course_site_id` | FK → `course_site` (nullable) | links to OH/hiring site |
| `enrolled` / `total_seats` | Integer | scraped from UNC Reports |

Relations: `rooms` (→ `SectionRoomEntity`), `members` (→ `SectionMemberEntity`), `staff` (viewonly non-students), `preferred_applicants` (many-to-many via `section_application_table`)

### `SectionMemberEntity` — `academics__user_section`
| Field | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `section_id` | FK → section | |
| `user_id` | FK → user | |
| `member_role` | Enum `RosterRole` | `STUDENT`, `UTA`, `GTA`, `INSTRUCTOR` |

This is the central permission table — used by office hours, hiring, and course site access.

### `SectionRoomEntity` — `academics__section_room`
Join table: `section_id`, `room_id`, `assignment_type` (`LECTURE_ROOM` or `OFFICE_HOURS`)

---

## Pydantic Models

| Model | Notes |
|---|---|
| `Term` | Inherits `TimeRange`; adds `id`, `name`, `applications_open`, `applications_close` |
| `Course` | `id`, `subject_code`, `number`, `title`, `description`, `credit_hours` |
| `Section` | Full section data; `lecture_room: Room | None`, `office_hour_rooms: list[Room]`, `staff: list[SectionMember]` |
| `SectionDetails(Section)` | Adds `course`, `term`, `course_site`, `members` |
| `CatalogSection` | Public-facing catalog view (no student data) |
| `EditedSection(Section)` | Extends with `instructors: list[PublicUser]` for admin CRUD |
| `SectionMember` | `id`, `section_id`, `user_id`, `member_role` |
| `TermOverview` | My Courses dashboard — one term with `sites` and `teaching_no_site` |
| `CourseSiteOverview` | Full course site with `gtas`, `utas` lists |
| `CourseMemberOverview` | Roster row with `pid`, `email`, `role`, `section_number` |

> `Section` exposes `staff` (instructors + TAs only) in the public API — students are excluded for privacy.

---

## Services

### `TermService` (`backend/services/academics/term.py`)
| Method | Permission | Description |
|---|---|---|
| `all()` | None | All terms ordered by start |
| `get_by_id(id)` | None | Single term |
| `get_by_date(date)` | None | Active or next upcoming term |
| `create(subject, term)` | `academics.term.create` | |
| `update(subject, term)` | `academics.term.update` | |
| `delete(subject, id)` | `academics.term.delete` | |

### `CourseService` (`backend/services/academics/course.py`)
Same CRUD pattern as `TermService` with `academics.course.*` permissions.

### `SectionService` (`backend/services/academics/section.py`)
| Method | Permission | Description |
|---|---|---|
| `get_by_term(term_id)` | None | Catalog sections for a term |
| `get_by_id(id)` | None | Single section |
| `get(subject_code, course_number, section_number)` | None | Human-readable lookup |
| `create(subject, section)` | `academics.section.create` | Assigns room + instructors |
| `update(subject, section)` | `academics.section.update` | Reassigns room + instructors |
| `delete(subject, id)` | `academics.section.delete` | |
| `update_enrollment_totals(subject)` | None enforced | Scrapes UNC Reports (BeautifulSoup) |

### `SectionMemberService` (`backend/services/academics/section_member.py`)
| Method | Description |
|---|---|
| `add_section_member(subject, section_id, user_id, role)` | Requires `academics.section_member.create` |
| `import_users_from_csv(subject, section_id, csv_data)` | Parses Canvas CSV; add/update/remove memberships; requires `INSTRUCTOR` role in section |

### `CourseSiteService` (`backend/services/academics/course_site.py`)
| Method | Description |
|---|---|
| `get_user_course_sites(user)` | All terms/course-sites the user belongs to |
| `get_course_site_roster(user, site_id, pagination)` | Paginated deduplicated roster |
| `get_current_office_hour_events(user, site_id)` | Active OH events |
| `get_future_office_hour_events(user, site_id, pagination)` | Upcoming OH events |
| `get_past_office_hour_events(user, site_id, pagination)` | Past OH events |
| `create(user, new_site)` | Requires `INSTRUCTOR` in all linked sections |
| `update(user, updated_site)` | Requires `INSTRUCTOR` in old + new sections |
| `get(user, site_id)` | Returns `UpdatedCourseSite`; requires `INSTRUCTOR` |

---

## API Endpoints

### Term — `/api/academics/term`
`GET /`, `GET /current`, `GET /{id}`, `POST /`, `PUT /`, `DELETE /{id}`

### Course — `/api/academics/course`
`GET /`, `GET /{id}`, `POST /`, `PUT /`, `DELETE /{id}`

### Section — `/api/academics/section`
`GET /update-enrollments`, `GET /{id}`, `GET /term/{term_id}`, `GET /{subject}/{number}/{section}`, `POST /`, `PUT /`, `DELETE /{id}`

### Section Member — `/api/academics/section-member`
`GET /{id}`, `POST /` (bulk by OH sections), `POST /instructor/{section_id}/{user_id}`, `POST /import-from-canvas/{section_id}`

### My Courses — `/api/my-courses`
| Route | Returns |
|---|---|
| `GET /` | `list[TermOverview]` |
| `GET /{site_id}` | `UpdatedCourseSite` |
| `GET /{site_id}/roster` | `Paginated[CourseMemberOverview]` |
| `GET /{site_id}/roster/csv` | `StreamingResponse` |
| `POST /new` | `CourseSite` |
| `PUT /` | `CourseSite` |
| `GET /{site_id}/oh-events/current` | `list[OfficeHoursOverview]` |
| `GET /{site_id}/oh-events/future` | `Paginated[OfficeHoursOverview]` |
| `GET /{site_id}/oh-events/history` | `Paginated[OfficeHoursOverview]` |
| `GET /{site_id}/statistics` | `OfficeHoursTicketStatistics` |
| `GET /{site_id}/statistics/ticket-history` | `Paginated[OfficeHourTicketOverview]` |
| `GET /{site_id}/statistics/csv` | `StreamingResponse` |

---

## Frontend Components

All under `frontend/src/app/academics/`. Routing in `academics-routing.module.ts`.

| Component | Route | Description |
|---|---|---|
| `AdminTermComponent` | `/academics/admin/term` | Term CRUD table; guard: `permissionGuard('academics.term', '*')` |
| `AdminCourseComponent` | `/academics/admin/course` | Course CRUD table |
| `AdminSectionComponent` | `/academics/admin/section` | Section CRUD table with term filter dropdown |
| `AdminRoomComponent` | `/academics/admin/room` | Room CRUD table |
| `TermEditorComponent` | `/academics/term/edit/:id` | Term create/edit form |
| `CourseEditorComponent` | `/academics/course/edit/:id` | Auto-builds `id` as `subject_code.toLowerCase() + number` |
| `SectionEditorComponent` | `/academics/section/edit/:id` | Most complex editor: term, course, room, instructors pickers |
| `RoomEditorComponent` | `/academics/room/edit/:id` | Room create/edit form |

**`NavigationAdminGearService`** — call `showAdminGear(permissionAction, permissionResource, tooltip, targetUrl)` on component init to conditionally show the gear icon in the nav bar for admin pages.

### `AcademicsService` (frontend, `academics.service.ts`)
Provided in root. Methods map 1:1 to API routes — `getTerms()`, `createTerm(term)`, `updateTerm(term)`, `deleteTerm(term)`, `getCourses()`, `createCourse(course)`, `updateCourse(course)`, `deleteCourse(course)`, `getSectionsByTerm(term)`, `getSection(id)`, `createSection(section)`, `updateSection(section)`, `deleteSection(section)`, `getRooms()`, `createRoom(room)`, `updateRoom(room)`, `deleteRoom(room)`.

> Note: room CRUD calls `/api/room` (not `/api/academics/room`).

---

## Permission Model

| Permission Action | Resource | Who Needs It |
|---|---|---|
| `academics.term.create/update/delete` | `term` / `term/{id}` | Site admin |
| `academics.course.create/update/delete` | `course` / `course/{id}` | Site admin |
| `academics.section.create/update/delete` | `section` / `section/{id}` | Site admin |
| `academics.section_member.create` | `section/{id}` | Admin or delegated |
| `room.create/update/delete` | `room` / `room/{id}` | Site admin |

**`RosterRole` hierarchy:** `STUDENT` < `UTA` < `GTA` < `INSTRUCTOR`

Course-site-level access is controlled by `SectionMemberEntity` membership — no explicit permission needed for instructors to access their own site's data.

---

## Cross-Feature Connections

- **Office Hours**: `SectionEntity.course_site_id` links to `CourseSiteEntity`. `CourseSiteService` returns OH event lists. `SectionMemberEntity` drives all OH permission checks.
- **Hiring / TA Application**: `TermEntity.applications_open/close` gates applications. `section_application_table` stores student section preferences. `HiringAssignmentEntity` links term + course site + user.
- **Coworking / Rooms**: `SectionRoomEntity` assigns rooms to sections. `AcademicsService` calls `/api/room` for shared room data.
- **Signage**: `CatalogSection` data is pulled by `SignageService` to display course/room info on campus screens.

---

## Testing

| File | Covers |
|---|---|
| `term_test.py` | `TermService` CRUD + permission checks |
| `course_test.py` | `CourseService` CRUD + permission checks |
| `section_test.py` | `SectionService` + room assignment + enrollment scrape |
| `section_member_test.py` | CSV import (add, idempotent, remove, bad format, non-instructor) |
| `course_site_test.py` | Roster, OH events, create/update/get with edge cases |
| `hiring/hiring_test.py` | `HiringService` full coverage (see TA Application skill) |
| `term_data.py`, `course_data.py`, `section_data.py` | Fake data fixtures |
| `fixtures.py` | pytest fixtures: `term_svc`, `course_svc`, `section_svc`, `section_member_svc`, `course_site_svc` |

---

## Common Development Tasks

### Adding a field to a section
1. Add column to `backend/entities/academics/section_entity.py`
2. Add field to `backend/models/academics/section.py` (and `EditedSection` if user-editable)
3. Update `from_model()`, `to_model()`, `to_details_model()` on entity
4. Run `alembic revision --autogenerate -m "description"`
5. Update `SectionEditorComponent` form and `AcademicsService` if it needs to be editable

### Adding a new member role (e.g., `VOLUNTEER`)
1. Extend `RosterRole` enum in `backend/models/academics/section_member.py`
2. Update the SQLAlchemy `Enum` in `SectionMemberEntity`
3. Create migration
4. Update any permission checks in `CourseSiteService` and office hours services that inspect role

### Importing a roster from Canvas CSV
- The CSV must be in Canvas export format (PID column required)
- `SectionMemberService.import_users_from_csv` handles 4 cases: new user, existing student no change, role update, removal (student not in new CSV)
- Caller must be `INSTRUCTOR` of the section
