---
name: ta-application
description: Domain knowledge for developing the CSXL TA Application and Hiring feature. Covers ApplicationEntity, ApplicationReviewEntity, HiringAssignmentEntity, HiringLevelEntity, the section_application association table, ApplicationService, HiringService, the kanban review workflow, API endpoints, Angular frontend hiring components and services, and testing. Use when working on TA/GTA applications, application review, hiring assignments, hiring levels, coverage calculation, or the instructor hiring kanban board.
---

# TA Application & Hiring Feature — CSXL

## Architecture

```
FastAPI API layer  →  Service layer  →  SQLAlchemy Entity layer  →  PostgreSQL
```

- Entities: `backend/entities/application_entity.py`, `backend/entities/academics/hiring/`, `backend/entities/section_application_table.py`
- Models: `backend/models/application.py`, `backend/models/academics/hiring/`
- Services: `backend/services/application.py`, `backend/services/academics/hiring.py`
- API: `backend/api/application.py`, `backend/api/academics/hiring.py`
- Frontend: `frontend/src/app/hiring/`, `frontend/src/app/applications/`

---

## Data Models / Entities

### `ApplicationEntity` — `backend/entities/application_entity.py` — table `application`
| Field | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `user_id` | FK → `user.id` | Applicant |
| `term_id` | FK → `academics__term.id` | |
| `type` | String(50) | `"new_uta"` or `"gta"` |
| `academic_hours`, `gpa`, `comp_gpa` | Integer/Float | UTA fields |
| `extracurriculars`, `expected_graduation`, `program_pursued` | String | |
| `comp_227` | Enum(`Comp227`) | credit vs. monetary compensation |
| `intro_video_url`, `prior_experience`, `service_experience` | String | |
| `ta_experience`, `best_moment`, `desired_improvement` | String | returning UTA fields |
| `advisor` | String | GTA-only field |

Relations:
- `user` → `UserEntity`, `term` → `TermEntity`
- `reviews` → `ApplicationReviewEntity` (one-to-many, cascade `all,delete`)
- `preferred_sections` → `SectionEntity` (many-to-many via `section_application_table`, ordered by `preference` column)

### `section_application` Association Table — `backend/entities/section_application_table.py`
```python
Table("section_application", ...,
    Column("preference", Integer),          # 0 = first choice, 1 = second, ...
    Column("section_id", ForeignKey("academics__section.id"), primary_key=True),
    Column("application_id", ForeignKey("application.id"), primary_key=True),
)
```
Plain `Table` object — no entity class. On each application create/update, the service **deletes all existing rows** for the `application_id` and re-inserts them in ranked order.

### `ApplicationReviewEntity` — `academics__hiring__application_review`
| Field | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `application_id` | FK → `application.id` | |
| `course_site_id` | FK → `course_site.id` | |
| `status` | Enum `ApplicationReviewStatus` | `NOT_PROCESSED`, `NOT_PREFERRED`, `PREFERRED` |
| `preference` | Integer | Sort order within a status column |
| `notes` | String | Instructor's review notes |

Composite index on `(course_site_id, status, preference)` for fast kanban queries.

### `HiringAssignmentEntity` — `academics__hiring__assignment`
| Field | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `term_id` | FK → `academics__term.id` | |
| `course_site_id` | FK → `course_site.id` | |
| `user_id` | FK → `user.id` | Person being hired |
| `application_review_id` | FK → review (nullable) | null = manual hire |
| `hiring_level_id` | FK → `academics__hiring__level.id` | |
| `status` | Enum `HiringAssignmentStatus` | `DRAFT`, `COMMIT`, `FINAL` |
| `position_number`, `epar` | String (nullable) | HR paperwork |
| `i9` | Boolean (nullable) | I-9 submitted? |
| `notes` | String | |
| `created`, `modified` | DateTime | |

### `HiringLevelEntity` — `academics__hiring__level`
| Field | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `title` | String | e.g. `"UTA Full Time"` |
| `salary` | Float | Per semester |
| `load` | Float | Used in coverage formula |
| `classification` | Enum `HiringLevelClassification` | `IOR`, `PHD`, `MS`, `UG` |
| `is_active` | Boolean | Whether shown for new assignments |

---

## Pydantic Models

### Application models (`backend/models/application.py`)
- **`Application`** — full model; `preferred_sections: list[CatalogSectionIdentity]`, `assignments: list[ReleasedHiringAssignment]`
- **`ApplicationOverview`** — read-only; adds `applicant_name: str`; excludes `user_id`
- **`ApplicationUnderReview`** — like `ApplicationOverview` + `applicant: PublicUser` (used inside `ApplicationReviewOverview`)
- **`ReleasedHiringAssignment`** — shown to an applicant once hired: `course`, `instructors`, `level_title`

### Review models (`backend/models/academics/hiring/application_review.py`)
- **`ApplicationReviewStatus`** (Enum) — `NOT_PREFERRED`, `NOT_PROCESSED`, `PREFERRED`
- **`ApplicationReview`** — `id`, `application_id`, `course_site_id`, `status`, `preference`, `notes`
- **`ApplicationReviewOverview(ApplicationReview)`** — adds `application: ApplicationUnderReview`, `applicant_id`, `applicant_course_ranking`
- **`HiringStatus`** — kanban state: `not_preferred`, `not_processed`, `preferred` (each a list of `ApplicationReviewOverview`)
- **`ApplicationReviewCsvRow`** — flat model for CSV export

### Assignment models (`backend/models/academics/hiring/hiring_assignment.py`)
- **`HiringAssignmentStatus`** (Enum) — `DRAFT`, `COMMIT`, `FINAL`
- **`HiringAssignmentDraft`** — write model with `level: HiringLevel`, `position_number`, `epar`, `i9`, `notes`
- **`HiringAssignmentOverview`** — read model with `user: PublicUser`, `level: HiringLevel`
- **`HiringAssignmentSummaryOverview`** — extends overview with `course`, `instructors`, `application_review_id`, `course_site_id`
- **`HiringCourseSiteOverview`** — per-site summary: `sections`, `instructors`, `total_enrollment`, `total_cost`, `coverage`, `assignments`
- **`HiringAdminOverview`** — `sites: list[HiringCourseSiteOverview]`
- **`HiringAdminCourseOverview`** — per-course drill-down: `assignments`, `reviews` (PREFERRED), `instructor_preferences`
- **`ConflictCheck`** — `application_id`, `assignments`, `priorities: list[ApplicationPriority]`

---

## Services

### `ApplicationService` (`backend/services/application.py`)
| Method | Permission | Description |
|---|---|---|
| `get_application(term_id, subject)` | None (self-only) | Returns own application; fetches FINAL assignments to show placement |
| `create(subject, application)` | Self-only or `applications.create` | Creates application + `section_application` rows |
| `update(subject, application)` | Self-only | Updates all fields; **deletes + re-inserts** section preferences |
| `delete(application_id, subject)` | `applications.delete` | Cascades to reviews |
| `eligible_sections()` | None | Returns sections for the term where `now()` is within `applications_open/close` |

### `HiringService` (`backend/services/academics/hiring.py`)
| Method | Permission | Description |
|---|---|---|
| `get_status(subject, course_site_id)` | Instructor of site OR `hiring.get_status` | Loads/creates review records; groups by status |
| `update_status(subject, course_site_id, hiring_status)` | Same | Bulk-updates status/preference/notes via `SQLAlchemy update()` |
| `create_missing_course_sites_for_term(subject, term_id)` | `hiring.create_missing_course_sites_for_term` | Groups sections by `(course_id, instructors)`, creates `CourseSiteEntity` for any missing |
| `get_phd_applicants(subject, term_id)` | `hiring.get_phd_applicants` | PhD/ABD/MS applicants with student + instructor preferences |
| `get_hiring_admin_overview(subject, term_id)` | `hiring.admin` | All course sites for a term with enrollment, cost, coverage, assignments |
| `get_hiring_admin_course_overview(subject, course_site_id)` | `hiring.admin` | PREFERRED reviews + assignments for one site |
| `create_hiring_assignment(subject, assignment)` | `hiring.admin` | Creates assignment |
| `update_hiring_assignment(subject, assignment)` | `hiring.admin` | Updates level, status, epar, i9, notes |
| `delete_hiring_assignment(subject, assignment_id)` | `hiring.admin` | Deletes assignment |
| `get_hiring_levels(subject)` / `create_hiring_level` / `update_hiring_level` | `hiring.admin` | Level CRUD |
| `get_hiring_summary_overview(subject, term_id, pagination)` | `hiring.summary` | Paginated COMMIT+FINAL assignments; supports name search |
| `get_hiring_summary_for_csv(subject, term_id)` | `hiring.summary` | All COMMIT+FINAL as CSV rows |
| `get_course_site_hiring_status_csv(subject, course_site_id)` | Instructor OR `hiring.get_status` | All reviews as CSV |
| `get_hiring_assignments_for_course_site(subject, course_site_id, pagination)` | Instructor OR `hiring.get_assignments` | FINAL-only assignments, paginated |
| `conflict_check(subject, application_id)` | `hiring.conflict_check` | Cross-references applicant preferences vs. instructor PREFERRED reviews |
| `iter_applicants_for_term_csv(subject, term_id)` | `hiring.admin` | Streaming generator — full-term applicant CSV |

**Coverage formula** (`_calculate_coverage`):
```python
# Returns negative if course is over-covered, positive if under-covered
coverage = (enrollment / 60.0) - sum(
    level.load if level.classification in (PHD, MS) else level.load * 0.25
    for each assignment
)
```

---

## API Endpoints

### Application API — `backend/api/application.py` — `/api/applications/ta`
| Method | Route | Returns |
|---|---|---|
| `GET` | `/user/{term_id}` | `Application \| None` |
| `POST` | `/` | `Application` |
| `PUT` | `/` | `Application` |
| `DELETE` | `/` | None |
| `GET` | `/eligible-sections` | `list[CatalogSectionIdentity]` |

### Hiring API — `backend/api/academics/hiring.py` — `/api/hiring`
| Method | Route | Returns |
|---|---|---|
| `GET` | `/admin/{term_id}` | `HiringAdminOverview` |
| `GET` | `/admin/{term_id}/csv` | `StreamingResponse` |
| `GET` | `/admin/course/{course_site_id}` | `HiringAdminCourseOverview` |
| `POST/PUT/DELETE` | `/assignment` / `/assignment/{id}` | `HiringAssignmentOverview` |
| `GET/POST/PUT` | `/level` | `list[HiringLevel]` / `HiringLevel` |
| `POST` | `/create_sites` | `bool` |
| `GET/PUT` | `/{course_site_id}` | `HiringStatus` |
| `GET` | `/{course_site_id}/csv` | `StreamingResponse` |
| `GET` | `/summary/{term_id}` | `Paginated[HiringAssignmentSummaryOverview]` |
| `GET` | `/summary/{term_id}/csv` | `StreamingResponse` |
| `GET` | `/summary/{term_id}/phd_applicants` | `StreamingResponse` |
| `GET` | `/assignments/{course_site_id}` | `Paginated[HiringAssignmentOverview]` |
| `GET` | `/assignments/{course_site_id}/csv` | `StreamingResponse` |
| `GET` | `/conflict_check/{application_id}` | `ConflictCheck` |

> **Route ordering matters:** `/admin/{term_id}`, `/summary/{term_id}`, `/conflict_check/{application_id}` must be registered before `/{course_site_id}` to avoid FastAPI path ambiguity.

---

## Frontend Components

### Hiring Module (`frontend/src/app/hiring/`)
| Component | Route | Description |
|---|---|---|
| `HiringAdminComponent` | `/hiring/admin` | Admin table — all course sites for a term with enrollment, cost, coverage; create/delete assignments inline |
| `HiringSummaryComponent` | `/hiring/summary` | Paginated COMMIT+FINAL assignments; inline editing of `i9`, `epar`, `position_number`; CSV export + name search |
| `LevelsAdminComponent` | `/hiring/levels` | Hiring levels list |
| `LevelEditorComponent` | `/hiring/levels/:id/edit` | Create/edit a hiring level |
| `HiringPageComponent` | `/hiring/:courseSiteId` | Shell with "Preferences" and "Assignments" tabs |
| `HiringPreferencesComponent` | `/hiring/:courseSiteId/preferences` | **Kanban board** — drag-and-drop across three columns; "Pass on Non-First-Choice" bulk action; CSV download |
| `HiringAssignmentsComponent` | `/hiring/:courseSiteId/assignments` | FINAL assignments for one course site (instructor view) |

**Dialogs** (`hiring/dialogs/`):
- `ApplicationDialog` — full applicant view; auto-saves notes (debounced 200ms)
- `CreateAssignmentDialog` / `EditAssignmentDialog` — hire form
- `QuickCreateAssignmentDialog` — create from a kanban card

### Applications Module (`frontend/src/app/applications/`)
- `ApplicationFormComponent` — route `/apply/:term/:type`
  - Dynamically renders UTA or GTA form based on route params
  - Loads existing application if one exists (create vs. update)
  - After `FINAL` assignment is released, shows `ReleasedHiringAssignment` card

---

## Frontend Services

### `HiringService` (`frontend/src/app/hiring/hiring.service.ts`)
On construction, immediately loads and caches hiring levels in a signal.

| Method | Call |
|---|---|
| `getStatus(courseSiteId)` | `GET /api/hiring/:id` |
| `updateStatus(courseSiteId, status)` | `PUT /api/hiring/:id` |
| `getHiringAdminOverview(termId)` | `GET /api/hiring/admin/:termId` |
| `getHiringAdminCourseOverview(courseId)` | `GET /api/hiring/admin/course/:id` |
| `getHiringLevels()` | `GET /api/hiring/level` (cached in signal) |
| `createHiringAssignment(assignment)` | `POST /api/hiring/assignment` |
| `updateHiringAssignment(assignment)` | `PUT /api/hiring/assignment` |
| `deleteHiringAssignment(id)` | `DELETE /api/hiring/assignment/:id` |
| `downloadHiringSummaryCsv(termId)` | `GET /api/hiring/summary/:termId/csv` → blob via `file-saver` |
| `conflictCheck(applicationId)` | `GET /api/hiring/conflict_check/:id` |

### `ApplicationsService` (`frontend/src/app/applications/applications.service.ts`)
| Method | Call |
|---|---|
| `getApplication(termId)` | `GET /api/applications/ta/user/:termId` |
| `createApplication(application)` | `POST /api/applications/ta` |
| `updateApplication(application)` | `PUT /api/applications/ta` |
| `getEligibleSections()` | `GET /api/applications/ta/eligible-sections` |

---

## Kanban Review Workflow

The 3-phase process for hiring a TA:

### Phase 1 — Student Applies
- Window gated by `TermEntity.applications_open` / `applications_close`
- Student submits via `/apply/:term/new_uta` or `/apply/:term/gta`
- Preferred sections stored in `section_application_table` (preference 0 = top choice)
- Students can update their application at any time while the window is open

### Phase 2 — Instructor Reviews (Kanban)
- Navigate to `/hiring/:courseSiteId/preferences`
- On load, `HiringService.get_status()` auto-creates `ApplicationReviewEntity` rows (status `NOT_PROCESSED`) for all applicants who listed any section in this course site
- `applicant_course_ranking` = the applicant's ranking for this **course site** (not just section) — 1 = top choice
- Drag cards between **Not Preferred / Not Processed / Preferred**; each column maintains ordered preference integers
- "Pass on Non-First-Choice" bulk action: moves applicants where `applicant_course_ranking > 1` from Not Processed → Not Preferred
- Notes are auto-saved (debounced 200ms in `ApplicationDialog`)

### Phase 3 — Admin Creates Assignments
- Admin navigates to `/hiring/admin`; views enrollment, cost, coverage across all course sites
- Creates `HiringAssignmentDraft` (links user + hiring level + optionally `application_review_id`)
- Assignment lifecycle: `DRAFT` → `COMMIT` → `FINAL`
- `/hiring/summary` page: onboarding admin fills in `i9`, `epar`, `position_number` for COMMIT+FINAL assignments
- Once `FINAL`: applicant sees `ReleasedHiringAssignment` on their application form

---

## Permission Summary

| Action | Who |
|---|---|
| Submit/update own application | Any registered user (self-scoped) |
| Delete application | `applications.delete` |
| View kanban for a course site | Instructor of that site OR `hiring.get_status` |
| Update kanban | Same as above |
| View FINAL assignments for a course site | Instructor OR `hiring.get_assignments` |
| Create/update/delete assignments | `hiring.admin` |
| View admin overview (all sites for a term) | `hiring.admin` |
| View hiring summary / onboarding | `hiring.summary` |
| Conflict check | `hiring.conflict_check` |
| Create missing course sites | `hiring.create_missing_course_sites_for_term` |
| View PhD applicants | `hiring.get_phd_applicants` |

**Instructor check (no explicit permission required):** `HiringService._is_instructor()` queries `SectionMemberEntity` for `user_id == subject.id` AND `section` is in the course site AND `member_role == INSTRUCTOR`.

---

## Cross-Feature Connections

- **`TermEntity.applications_open/close`** — gates the application window; `ApplicationService.eligible_sections()` queries this
- **`SectionEntity`** — what students rank; `preferred_applicants` (many-to-many back-ref) links sections to applications
- **`CourseSiteEntity`** — the unit of review + hiring; all `ApplicationReviewEntity` and `HiringAssignmentEntity` are keyed to `course_site_id`
- **`SectionMemberEntity`** — determines who is an `INSTRUCTOR` for the hiring permission bypass
- **`HiringAssignmentEntity.term_id`** — enables the summary page to list all assignments for a term without going through course sites
- **`HiringService.create_missing_course_sites_for_term`** — the bridge between academics and hiring: groups sections by `(course_id, instructor list)` and creates `CourseSiteEntity` records so instructors can access the kanban

---

## Testing

**File:** `backend/test/services/academics/hiring/hiring_test.py`
**Data:** `backend/test/services/academics/hiring/hiring_data.py`

Fixture load order: `core_data` → `term_data` → `course_data` → `section_data` → `room_data` → `office_hours_data` → `hiring_data`

Test data: 5 applications (UTA + GTA), 7 `section_application` rows, 3 pre-existing reviews, 1 hiring level, 1 hiring assignment.

| Key Tests | What They Verify |
|---|---|
| `test_get_status` | Correct kanban bucketing; auto-creates missing reviews |
| `test_update_status` | Moves persist; preference ordering maintained |
| `test_get_hiring_admin_overview` | Returns 2 course sites with correct data |
| `test_create/update/delete_hiring_assignment` | CRUD + permission checks |
| `test_create/update_hiring_level` | Level CRUD + permissions |
| `test_get_status_site_not_instructor` | Raises `UserPermissionException` |
| `test_create_missing_course_sites_for_term` | Increases site count in admin overview |
| `test_get_phd_applicants` | Non-empty; all have PhD-track programs |

---

## Common Development Tasks

### Adding a field to the UTA application
1. Add nullable column to `ApplicationEntity` in `backend/entities/application_entity.py`
2. Add field to `Application` model in `backend/models/application.py`
3. Update `ApplicationService.create()` and `update()` to handle the new field
4. Run `alembic revision --autogenerate -m "description"`
5. Add form field in `ApplicationFormComponent` and update `ApplicationsService.getForm('uta')`

### Adding a new hiring assignment status
1. Extend `HiringAssignmentStatus` enum in `backend/models/academics/hiring/hiring_assignment.py`
2. Update `HiringService` methods that filter by status (e.g. `get_hiring_summary_overview` filters for `COMMIT | FINAL`)
3. Update frontend `HiringSummaryComponent` and `HiringAssignmentsComponent` if it affects their displays

### Running the kanban setup for a new term
1. Admin calls `POST /api/hiring/create_sites` → `HiringService.create_missing_course_sites_for_term()` — groups sections by course + instructor and creates `CourseSiteEntity` records
2. Instructors can now access `/hiring/:courseSiteId/preferences` to review applicants
3. On first load, missing `ApplicationReviewEntity` rows are auto-created for all applicants who listed sections in that site
