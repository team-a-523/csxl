# Applications Tests

## Overview

The applications tests cover the TA application form flow — from service logic
through the widget level. The feature is self-contained: `ApplicationsService`,
`AcademicsService`, `Router`, and `MatSnackBar` are all mocked with `jest.fn()`.
`NO_ERRORS_SCHEMA` suppresses Angular Material child component errors throughout.
HTTP tests use `HttpTestingController` to intercept requests without real network
traffic.

---

## ApplicationsModule

**`applications.module.spec.ts`**

Instantiates `ApplicationsModule` via `TestBed` and then reads the Angular
compiler metadata (`ɵmod.declarations`) to assert that both
`ApplicationFormComponent` and `ApplicationFormFieldWidget` are declared in the
module. This is a structural regression test that would catch accidental removal
from the declarations array.

---

## ApplicationsRoutingModule

**`applications-routing.module.spec.ts`**

Uses `provideRouter([])` alongside the real `ApplicationsRoutingModule` import,
then injects `Router` and walks `router.config` to find the route registered for
`ApplicationFormComponent`. Asserts the path and title match the static `Route`
definition on the component class.

---

## applications.model

**`applications.model.spec.ts`**

Structural tests for `CatalogSectionIdentity`, `ApplicationSectionChoice`, and
`Application`. Each test constructs a typed object and asserts specific fields —
for example, that `id` can be `null` on `CatalogSectionIdentity`, that
`preferred_sections` is an array on `Application`, and that `assignments` defaults
to an empty array. No logic is exercised; this is purely a shape-stability test.

---

## ApplicationsService

**`applications.service.spec.ts`**

The service calls `getEligibleSections()` automatically in its constructor, which
means every `beforeEach` must flush that initial HTTP request before the test body
runs — otherwise `httpController.verify()` would fail in `afterEach`. The comment
block at the top of the file explains this pattern explicitly.

### Setup

`ApplicationsService` is provided as the real class alongside
`provideHttpClient` + `provideHttpClientTesting`. After injecting the service,
`beforeEach` immediately flushes the pending constructor request to
`/api/applications/ta/eligible-sections`.

### Tests

**Construction / getEligibleSections**

- Confirms `eligibleSections()` signal is populated after the constructor flush.
- Calling `getEligibleSections()` again updates the signal with a new response
  containing two sections.

**getApplication**

- Sends a GET to `/api/applications/ta/user/:termId`.
- Emits the returned `Application` object.
- Emits `null` when the backend returns `null` (no existing application found).
- Confirms the `termId` appears in the request URL.

**createApplication**

- Sends a POST to `/api/applications/ta` with the application body.
- Returns the created application with a server-assigned `id`.

**updateApplication**

- Sends a PUT to `/api/applications/ta` with the updated body.
- Returns the updated application.

**getForm — UTA path**

- Returns a non-empty `FormGroup` and field list for `'new_uta'` type.
- Text fields (`SHORT_TEXT`) default to `''`; number fields default to `0`.
- `COURSE_PREFERENCE` fields appear in the field list but are intentionally absent
  from the `FormGroup` — they are handled separately via the `selectedSections`
  signal rather than as a form control.
- Required fields fail validation when empty and pass when filled.

**getForm — GTA path**

- Returns a non-empty form for `'gta'` type.
- Includes `program_pursued` and `advisor` controls specific to the GTA form.
- Same `COURSE_PREFERENCE` exclusion behavior as the UTA path.
- Unknown type string returns an empty form group and empty field list.

---

## ApplicationFormComponent

**`form/application-form.component.spec.ts`**

The most complex test file in the applications suite. A `buildMockFormGroup`
helper creates a minimal but complete `FormGroup` that matches what `getForm`
would return for `'new_uta'`, allowing `formGroup.setValue(...)` to work without
errors in submit tests.

### Setup

`ActivatedRoute` is provided with `params: { term: 'F2025', type: 'new_uta' }`
and a profile in `data`. `getApplication` defaults to returning `of(null)` and
`getForm` defaults to returning the mock form group.

### Construction tests

- Confirms `getForm` is called with `'new_uta'` on init.
- Confirms `getApplication` is called with `'F2025'` on init.
- Confirms `getTerm` is called with `'F2025'` on init.

### Default application state (no existing application)

- `application.id` is `null`.
- `application.user_id` matches the profile id from route data.
- `application.term_id` matches the route param.
- `preferred_sections` and `assignments` are empty arrays.
- `selectedSections()` signal is empty.

### Existing application patching

- When `getApplication` returns an existing application, `application.id` is set
  to the returned id and `selectedSections()` is populated from
  `preferred_sections`.
- Form group values are patched from the existing application's fields.

### onSubmit — create path

- Calls `createApplication` when `application.id` is `null`.
- Does not call `updateApplication`.
- Navigates to `/my-courses/` on success.
- Shows `'Thank you for submitting your application!'` in the snackbar.

### onSubmit — update path

- Calls `updateApplication` when `application.id` is set.
- Does not call `createApplication`.

### onSubmit — error path

- Shows `'Error: Application not submitted.'` when the service throws.
- Does not submit when any form control has errors (invalid form guard).

### selectedSections merging

- Manually sets the `selectedSections` signal before calling `onSubmit` and
  asserts the submitted payload's `preferred_sections` matches the signal value.

### showApplicationAssignmentCard

- Confirms the property exists and is a boolean type.

---

## ApplicationFormFieldWidget

**`widgets/application-form-field.widget.spec.ts`**

Tests the course-preference autocomplete widget that lets students select and
deselect sections for their application.

### Setup

`ApplicationsService` is mocked with a writable `signal([SECTION_A, SECTION_B])`
exposed as `eligibleSections`. `FormGroupDirective` is provided directly as an
instance with a real `FormGroup` bound to it — this is required because the widget
uses `[formControlName]` binding which looks up its parent form group via the
`ControlContainer` injection token. The `field` input is set to a `SHORT_TEXT`
field before `detectChanges()` runs.

### Tests

**Construction**

- Confirms the component creates and exposes the `FormFieldType` enum for template
  binding.
- `currentSectionInput()` signal defaults to empty string.

**selectedSection**

- Adds the chosen section to `selectedSections()` signal.
- Clears `currentSectionInput()` after selection.
- Calls `deselect()` on the autocomplete option to visually deselect it in the
  dropdown.
- Handles multiple sequential selections — both sections end up in the signal.

**removeSection**

- Removes the specified section from the signal by reference equality.
- Leaves the signal unchanged when the section is not present (no-op).
- Results in an empty array when the last section is removed.
- Returns a new array reference rather than mutating in place — this matters for
  Angular's change detection with signals.

---

## application-form.spec.ts (placeholder)

**`form/application-form.spec.ts`**

A single placeholder test (`expect(true).toBe(true)`) that keeps the legacy file
path valid. Real component behavior is fully covered in
`application-form.component.spec.ts`.
