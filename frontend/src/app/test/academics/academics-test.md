# Academics Tests

## Overview

The academics tests cover the admin-facing CRUD interface for managing courses,
sections, rooms, and terms on the CSXL platform. All dependencies — services,
router, snackbar, and activated route — are mocked. `NO_ERRORS_SCHEMA` suppresses
child component errors throughout. HTTP tests use `HttpTestingController` to
intercept requests without any real network traffic.

### Structure

The academics tests are organized to mirror the source directory under
`src/app/academics`. There are two parallel groups of spec files:

- **`academics-admin/` subfolder** — One spec per component or service class,
  written closer to the implementation details (e.g., directly setting `courseId`
  and calling `onSubmit()`).
- **Top-level `academics/` folder** — A second wave of tests for the same list
  and editor components, written with more behavioral intent (e.g., asserting what
  happens when `getCourses` returns an empty list or throws).

Both groups test the same underlying components; the two styles complement each
other by covering slightly different angles of the same behavior.

---

## AcademicsModule

**`academics.module.spec.ts`**

Smoke-tests that `AcademicsModule` can be instantiated and that its class name and
constructor are exposed as expected. These tests exist purely to confirm the module
class itself is importable without errors.

---

## academics.models

**`academics.models.spec.ts`**

Exercises the TypeScript model interfaces directly — `Term`, `Course`, `Room`,
`Section`, `EditedSection`, `SectionMember`, `SectionMemberPartial`, and
`RosterRole`. These are structural tests: they construct fixture objects typed
against each interface and assert that specific fields hold the expected values.
The main purpose is to catch any breaking changes to the model shapes early, before
component or service tests surface them.

---

## AcademicsRoutingModule

**`academics-routing.module.spec.ts`**

Confirms the routing module registers the expected routes. Uses `provideRouter([])`
alongside the real `AcademicsRoutingModule` import, then injects `Router` and walks
`router.config` to assert that:

- The `admin` route is registered with `AcademicsAdminComponent` and has exactly 4
  child routes.
- The course editor route path and title match the static `Route` definition on
  `CourseEditorComponent`.

---

## academics.resolver

**`academics.resolver.spec.ts`**

Tests all nine resolvers exported from `academics.resolver.ts`:
`coursesResolver`, `courseResolver`, `termsResolver`, `currentTermResolver`,
`termResolver`, `sectionResolver`, `sectionsResolver`, `roomsResolver`, and
`roomResolver`.

### Setup

`AcademicsService` is fully mocked. A `makeRoute` helper builds
`ActivatedRouteSnapshot` objects with a given id in `paramMap`. A `resolveValue`
helper normalizes resolver return types (plain object, `Observable`, or `Promise`)
into a single `Promise` that tests can `await`.

### Tests per resolver

Each resolver is tested for three scenarios:

- **Happy path** — Service mock returns data; assert the resolved value equals the
  mock.
- **`id = 'new'` short-circuit** — When the route id is `'new'`, the resolver
  returns a blank default object without calling the service at all.
- **Error path** — Service mock throws; assert the resolver catches the error and
  resolves to `undefined` rather than propagating.

The `sectionsResolver` is a special case — it calls a hardcoded
`getSectionsByTerm24F` method rather than accepting a dynamic id, so its test
mocks that specific method name.

---

## AcademicsService

**`academics.service.spec.ts`**

Full HTTP-layer tests for every public method on `AcademicsService`. Uses
`provideHttpClient` + `provideHttpClientTesting` and `HttpTestingController` to
intercept requests and assert method, URL, and body without any real network calls.
`httpController.verify()` runs in `afterEach` to catch unexpected requests.

Each service method gets two tests:

- **Success** — Flush a mock response and assert the emitted value matches.
- **Error** — Flush an HTTP error status and assert the observable re-emits that
  error status code.

Methods covered: `getTerms`, `getCurrentTerm`, `getTerm`, `createTerm`,
`updateTerm`, `deleteTerm`, `getCourses`, `getCourse`, `createCourse`,
`updateCourse`, `deleteCourse`, `getSectionsByTerm`, `getSectionsByTerm24F`,
`getSection`, `createSection`, `updateSection`, `deleteSection`, `getRooms`,
`getRoom`, `createRoom`, `updateRoom`, `deleteRoom`.

Notable URL pattern: rooms are fetched via `/api/room` but deleted via
`/api/academics/room/:id`, reflecting a split between the general room API and the
academics-specific deletion endpoint.

---

## Rx State Classes

**`rx-academics-admin.spec.ts`**

Tests the four reactive list classes — `RxTermList`, `RxCourseList`,
`RxSectionList`, and `RxRoomList` — which wrap a plain array in an RxJS state
container. Each class is tested with four operations:

- `should create` — Instantiates and confirms truthy.
- `push*` — Appends a second item; asserts length is 2.
- `update*` — Replaces the first item with an updated version; asserts the
  mutated field reflects the new value.
- `remove*` — Removes the first item; asserts the list is empty.

These tests access internal state via `(list as any).value` since the value is
not publicly exposed.

---

## AcademicsAdminComponent

**`academics-admin.component.spec.ts`**

Three tests:

- **should create** — Confirms the component instantiates.
- **exposes admin navigation links** — Asserts `component.links` has exactly 4
  entries with labels `['Sections', 'Courses', 'Rooms', 'Terms']`.
- **keeps profile stream from service** — Subscribes to `component.profile$` and
  asserts it emits the mock profile's `onyen`.

`ProfileService` is mocked with `{ profile$: of(MOCK_PROFILE) }`.

---

## AdminCourseComponent

Two spec files cover this component from different angles.

**`academics-admin/course/admin-course.component.spec.ts`** (implementation-focused)

- Confirms courses signal is populated from `getCourses` on construction.
- `createCourse` navigates to `['academics', 'course', 'edit', 'new']`.
- `updateCourse` navigates to `['academics', 'course', 'edit', 'COMP110']`.
- `deleteCourse` removes the course from the signal and shows a success snackbar.
- `deleteCourse` shows an error snackbar when the API throws.

**`admin-course.component.spec.ts`** (behavior-focused)

- Covers the same navigation and deletion paths with richer assertions.
- Additionally tests: empty list on construction, `getCourses` failure leaves signal
  empty, confirmation snackbar text and action label, `deleteCourse` not calling the
  service when confirmation is dismissed, and not removing the wrong course from the
  signal.
- Uses a nested `describe('deleteCourse()')` block to group the deletion scenarios.

---

## AdminTermComponent

Same two-file pattern as AdminCourseComponent.

**`academics-admin/term/admin-term.component.spec.ts`** (implementation-focused)

- Confirms signal has length 1 after construction.
- `createTerm` / `updateTerm` navigate to the term editor routes.
- `deleteTerm` removes the term and shows a success snackbar.
- `deleteTerm` preserves the list when the snackbar confirmation is never triggered
  (observable completes without emitting).

**`admin-term.component.spec.ts`** (behavior-focused)

- Covers empty list, error on `getTerms`, navigation, and the full confirmation
  flow including the "dismissed" path.

---

## AdminSectionComponent

**`academics-admin/section/admin-section.component.spec.ts`**

- Sets `displayTermId` from the current term in route data.
- `createSection` / `updateSection` navigate to the section editor.
- `resetSections` calls `getSectionsByTerm` with the matching term object.
- `deleteSection` removes the section from the signal and shows a success snackbar.

**`admin-section.component.spec.ts`** (behavior-focused)

- Tests the no-term case: when `currentTerm` is `undefined`, `getSectionsByTerm`
  is never called and the sections signal stays empty.
- Tests the confirmation flow for deletion, including the dismissed-confirmation
  path.

---

## AdminRoomComponent

**`academics-admin/room/admin-room.component.spec.ts`**

Same structure as the course and term component specs: confirms the rooms signal,
navigation to editor routes, successful deletion, and error snackbar on failure.
The error message is `'Delete failed because this room is being used elsewhere.'`,
distinguishing it from the course deletion message.

---

## CourseEditorComponent

**`academics-admin/course/course-editor/course-editor.component.spec.ts`**

A single `describe` block with the route providing an existing course (`id = 'COMP110'`):

- Form is pre-populated with the resolved course's `subject_code`.
- `onSubmit` when `courseId !== 'new'` calls `updateCourse`, navigates to
  `/academics/admin/course`, and shows `'Course Updated'`.
- `onSubmit` when `courseId === 'new'` generates a lowercase `id` from
  `subject_code + number`, calls `createCourse`, and shows `'Course Created'`.
- Error path shows `'Error: Course Not Created'`.

**`course-editor.component.spec.ts`** (behavior-focused)

Two nested `describe` blocks — `when creating a new course` and `when editing an
existing course` — each with their own `beforeEach` setting up the correct
`ActivatedRoute` mock. Additional tests cover form validation: when required fields
are blank, `onSubmit` must not call the service.

---

## SectionEditorComponent

**`academics-admin/section/section-editor/section-editor.component.spec.ts`**

Uses a fully populated `MOCK_SECTION` with staff and room. Tests:

- Form pre-populated with `number = '001'`.
- `onSubmit` for existing section calls `updateSection`.
- `onSubmit` for new section calls `createSection`.
- Error on update shows `'Error: Section Not Updated'`.

**`section-editor.component.spec.ts`** (behavior-focused)

Three nested `describe` blocks: new section, existing section, and override flag
behavior. The override flag tests confirm that:

- The `override` control defaults to `false` when override fields are empty.
- It defaults to `true` when `override_title` or `override_description` are
  populated on the resolved section.
- Setting `override.setValue(false)` clears both override text fields.

A `fillValidForm` helper sets `term`, `course`, `room`, and `sectionForm` fields
so tests can call `onSubmit` without worrying about invalid-form early returns.

---

## RoomEditorComponent

**`academics-admin/room/room-editor/room-editor.component.spec.ts`**

Follows the standard three-scenario structure: form pre-populated from resolved
data, update path, create path, and error snackbar. `DatePipe` is provided as a
real instance because the editor uses it for date formatting.

---

## TermEditorComponent

**`academics-admin/term/term-editor/term-editor.component.spec.ts`**

Same structure as `RoomEditorComponent`. One noteworthy quirk: the error snackbar
message is `'Error: Course Not Updated'` rather than `'Error: Term Not Updated'` —
this appears to be a copy-paste issue in the source component that the test
faithfully documents.