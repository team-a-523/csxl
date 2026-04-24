# Office Hours Tests

## CalledTicketCardWidget

The `CalledTicketCardWidget` displays a ticket that has been called by a TA or
instructor. It has an expandable view, a close button that emits the ticket back
to the parent, and reacts to input changes via `ngOnChanges`.

### Setup
The component takes a `ticket` input and a `calledByUser` input. A mock ticket
is provided directly on the component instance before `detectChanges()` runs.
`NO_ERRORS_SCHEMA` suppresses child component errors.

### Tests

**should create**
Sanity check that the component instantiates without errors.

**expanded defaults to false**
Confirms the `expanded` signal starts as `false` before any user interaction.

**toggleExpanded flips the signal from false to true**
Calls `toggleExpanded()` once and asserts the signal becomes `true`.

**toggleExpanded flips the signal back to false**
Calls `toggleExpanded()` twice and asserts the signal returns to `false`,
confirming it actually toggles rather than just setting to `true`.

**closeButtonEvent emits the ticket via closeButtonPressed**
Spies on the `closeButtonPressed` event emitter and asserts that calling
`closeButtonEvent()` emits the current ticket object.

**ngOnChanges**

- *sets expanded to true when calledByUser becomes true* — Simulates an input
change where `calledByUser` transitions from `false` to `true` and asserts the
expanded signal becomes `true`. This handles the case where the TA called this
specific student's ticket.

- *does NOT set expanded when calledByUser becomes false* — Simulates the reverse
transition and confirms expanded stays `false`, so the card doesn't expand when
the student's ticket is no longer active.

- *does nothing when calledByUser change is not present* — Passes an empty changes
object and asserts expanded stays `false`, confirming `ngOnChanges` safely ignores
unrelated input changes.

---

## CloseTicketDialog

The `CloseTicketDialog` is a Material dialog that lets a TA close a student ticket,
optionally flagging concerns and leaving notes. It receives the ticket ID via
`MAT_DIALOG_DATA` injection.

### Setup
All dependencies are mocked — `MyCoursesService`, `MatDialogRef`, `MatSnackBar`,
and `Router`. `MAT_DIALOG_DATA` is injected as `42` to simulate a ticket ID.
`ReactiveFormsModule` is imported for real form control behavior. The template
is overridden to empty.

### Tests

**should create**
Sanity check that the dialog instantiates without errors.

**ticketId is injected as 42**
Confirms the dialog correctly reads the ticket ID from `MAT_DIALOG_DATA`.

**hasConcerns defaults to false**
Confirms the form control initializes to `false`.

**notes defaults to empty string**
Confirms the notes form control initializes to an empty string.

**close()**

- *calls dialogRef.close()* — Asserts the dialog dismisses itself when `close()`
is called.

**submit()**

- *calls closeTicket with ticketId and form values* — Sets form values then calls
`submit()` and asserts the service is called with the correct ticket ID, concern
flag, and notes string.

- *calls close() on success* — Asserts the dialog closes after a successful
service response.

- *defaults hasConcerns to false when null* — Sets `hasConcerns` to `null` and
asserts the service is called with `false` instead, protecting against null being
passed to the backend.

- *defaults notes to empty string when null* — Sets `notes` to `null` and asserts
the service receives an empty string instead.

- *shows snackBar on error* — Makes the service throw and asserts the snackbar
opens with the error message and a 2 second duration.

- *does NOT call dialogRef.close() on error* — Asserts the dialog stays open when
the service call fails, so the user can retry.

---

## OfficeHourEventCardWidget

The `OfficeHourEventCardWidget` displays a summary card for an office hours event
and fetches the current user's role for that event on initialization.

### Setup
The component takes an `event` input which is set directly before `detectChanges()`.
`MyCoursesService` is mocked to return a role of `'UTA'`.

### Tests

**should create**
Sanity check that the component instantiates without errors.

**editRoute defaults to empty string**
Confirms the edit route is empty before any data is loaded.

**ngOnInit calls getOfficeHoursRole and sets role$**
Triggers `detectChanges()` to fire `ngOnInit`, ticks to flush the observable,
then subscribes to `role$` and asserts it emits `'UTA'`. Also confirms the
service was called with the event's ID.

**role$ emits empty string before ngOnInit**
Subscribes to `role$` before `detectChanges()` runs and asserts the initial
value is an empty string.

---

## OfficeHoursEditorComponent

The `OfficeHoursEditorComponent` handles both creating and editing office hours
events, including support for recurring patterns. It is tested in two separate
`describe` blocks — one for new office hours (`id = -1`) and one for existing
(`id = 7`).

### Setup
A `buildTestBed` helper function is used to avoid repeating setup code. It accepts
an `OfficeHours` object and configures the module with mocked `MyCoursesService`,
`Router`, `MatSnackBar`, and `ActivatedRoute`. Two room fixtures are provided —
`VIRTUAL_ROOM` and `ROOM_1`.

### Tests (new office hours)

**should create**
Sanity check that the component instantiates without errors.

**isNew() returns true for id = -1**
Confirms the component correctly identifies a new office hours object by its
sentinel ID of `-1`.

**action() returns "Created" for new**
Confirms the action label used in success messages is `'Created'` for new events.

**filteredRooms defaults to all rooms**
Confirms both rooms are available in the filtered list before any search input.

**virtualRoom is identified from rooms**
Confirms the component correctly picks out the virtual room from the provided
room list.

**toggleDay flips the day boolean**
Calls `toggleDay()` for Monday twice and asserts it toggles correctly both ways.

**maintainOriginalOrder returns 0**
Confirms the keyvalue pipe order function returns `0` to preserve insertion order.

**numberToType maps correctly**
Asserts all known type numbers map to their correct string labels and unknown
values return an empty string.

**numberToMode maps correctly**
Asserts all known mode numbers map to their correct string labels and unknown
values return an empty string.

**dateRangeValidator**

- *returns null when start < end* — Valid date range produces no error.
- *returns error when start >= end* — Invalid range returns `{ dateRangeInvalid: true }`.

**genericDateRangeValidator**

- *returns null when valid* — Valid range for any two fields produces no error.
- *returns dateRangeInvalid for non-recur_end* — Invalid range between two
non-recurrence fields returns `{ dateRangeInvalid: true }`.
- *returns recurEndDateInvalid for recur_end label* — Invalid range involving
`recur_end` returns `{ recurEndDateInvalid: true }` instead, so the template
can display the correct error message.

**modeChanged**

- *mode=0 sets room_id to empty string* — In-person mode clears the room field.
- *mode=1 sets room_id to virtual room id* — Virtual mode auto-fills the room
field with the virtual room's ID.

**filterRooms**

- *filters rooms by input value* — Typing `'SN'` filters the list to only `ROOM_1`.
- *returns all rooms when input is empty* — Clearing the input restores all rooms.

**onReset**
Modifies the description field then calls `onReset()` and asserts the form
returns to its original values.

**onSubmit (new + non-recurring)**
Sets valid form values, calls `onSubmit()`, and asserts `createOfficeHours` is
called and the router navigates to the office hours page for the course.

**onSubmit (new + recurring)**
Sets `recurs: true` and asserts `createRecurringOfficeHours` is called instead.

**onSubmit error**
Makes the service throw and asserts the snackbar shows the error message.

**onSubmit does nothing when form is invalid**
Manually marks a field as invalid and asserts the service is never called.

### Tests (existing office hours)

**isNew() returns false for existing id**
Confirms `isNew()` returns `false` for an event with a real ID.

**action() returns "Updated" for existing**
Confirms the action label is `'Updated'` for edits.

**disables recurs and recur_end controls for existing OH**
Confirms both recurrence fields are disabled by default when editing an existing
event, since changing recurrence requires an explicit opt-in.

**toggleUpdateRecurrencePattern**

- *enables recurs/recur_end when checked=true* — Toggling on enables both fields
and sets `updateRecurrencePattern` to `true`.
- *disables recurs/recur_end when checked=false* — Toggling off re-disables both
fields.

**onSubmit (existing + non-recurring)**
Sets valid form values and asserts `updateOfficeHours` is called and the router
navigates correctly.

**onSubmit (existing + updateRecurrencePattern)**
Enables recurrence update, sets valid values, and asserts
`updateRecurringOfficeHours` is called instead.

---

## OfficeHoursGetHelpComponent

The `OfficeHoursGetHelpComponent` is the student-facing view for joining an office
hours queue. It polls the backend every 10 seconds, plays a notification sound
when the student is called, and handles ticket creation and cancellation.

### Setup
The component uses `MyCoursesService`, `MatSnackBar`, and `ActivatedRoute`. All
are mocked. `HTMLMediaElement.play` is stubbed with `jest.spyOn` since JSDOM does
not support audio. The `timer` subscription is stubbed before each test so
`ngOnDestroy` does not throw if `ngOnInit` was never called.

### Tests

**basic properties**

- *should create* — Calls `ngOnInit()`, ticks, and confirms the component exists.
- *should set ohEventId from route params* — Confirms the event ID is read from
the route as `5`.

**ngOnInit / ngOnDestroy**

- *starts polling timer immediately* — Ticks 0ms after init and asserts the
service was called once.
- *polls again at 10s intervals* — Ticks 10 seconds and asserts the service was
called a second time.
- *ngOnDestroy unsubscribes timer* — Destroys the component and confirms advancing
time no longer triggers additional polls.

**pollData**
Overrides the mock to return a specific queue position, calls `ngOnInit`, and
asserts the `data` signal is updated to the new value.

**handleNotification**

- *notifies when ticket transitions from Queued to Called* — Sets previous state
to `Queued`, calls `handleNotification` with `Called`, and asserts audio plays.
- *does NOT notify when ticket is still Queued* — No state change means no sound.
- *does NOT notify when old state was not Queued* — Already-called tickets don't
re-trigger the notification.
- *does NOT notify when no ticket in new data* — No ticket means no notification.
- *resets title and unsubscribes flash timer when not notifying* — Confirms the
title is reset and the flash timer subscription is cleaned up.
- *flashes title when notifying* — Confirms `setTitle` is called when a
notification fires.

**isFormValid**

- *type=0 with description returns true* — Conceptual question with text is valid.
- *type=0 with empty description returns false* — Missing description is invalid.
- *type=1 with all fields filled returns true* — Assignment question with all
sections filled is valid.
- *type=1 with missing assignmentSection returns false* — Missing any required
section makes the form invalid.
- *Virtual - Student Link mode requires link* — Virtual mode without a link is
invalid.
- *Virtual - Student Link mode with link provided returns true* — Virtual mode
with a link is valid.

**cancelTicket**

- *calls cancelTicket service, calls pollData, shows snackBar* — Full success
path: service called, queue refreshed, confirmation shown.
- *shows snackBar on error* — Service failure shows error in snackbar.

**submitTicketForm**

- *type=0 builds conceptual description* — Asserts the description contains the
`**Conceptual Question**` header and the user's text.
- *type=1 builds structured assignment description* — Asserts all four sections
(`**Assignment Part**`, `**Goal**`, `**Concepts**`, `**Tried**`) appear in the
formatted description.
- *appends link for Virtual - Student Link mode* — Link is included in description
when mode requires it.
- *does NOT append link for non-virtual mode* — Link is excluded for in-person
mode even if the field has a value.
- *calls pollData on success* — Queue is refreshed after ticket creation.
- *shows snackBar on error* — Service failure shows the error message in a snackbar.

---

## OfficeHoursPageComponent

The `OfficeHoursPageComponent` is the main instructor/TA view for managing office
hours events. It displays upcoming and past events in paginated tables and handles
deletion of both single and recurring events.

### Setup
The component depends on `MyCoursesService`, `MatSnackBar`, `MatDialog`, and
`ActivatedRoute`. All are mocked. A `flushPaginators` helper intercepts any HTTP
requests made during component initialization and flushes them with empty page
data, preventing `afterEach` verify errors.

### Tests

**should create**
Sanity check that the component instantiates without errors.

**should set courseSiteId from route parent params**
Confirms the course site ID is correctly read from the parent route as `'42'`.

**should default viewState to Scheduled**
Confirms the initial view state is `Scheduled` before any tab interaction.

**ViewState enum has Scheduled, History, Data values**
Confirms all three expected view states are defined on the static enum.

**should call getCurrentOfficeHourEvents on init**
Confirms the service is called with the correct course site ID during initialization.

**should set currentOfficeHourEvents signal from service**
Overrides the mock to return a specific event and creates a new component instance,
then asserts the signal holds that event.

**should add actions column for Instructor role**
Confirms the actions column is present in the future events table when the user
is an Instructor.

**should NOT add actions column for Student role**
Overrides the term mock with a Student role and asserts the actions column is
absent, since students cannot manage events.

**should default pastOhDisplayedColumns to date and type**
Confirms the past events table shows only date and type columns by default.

**handleFutureOfficeHoursPageEvent**
Triggers a page change event and asserts an HTTP request goes to the future events
endpoint, then confirms the signal updates with the flushed page data.

**handlePastOfficeHoursPageEvent**
Same as above but for the history endpoint.

**deleteOfficeHours**

- *opens DeleteRecurringEventDialog for recurring event* — Asserts the correct
dialog is opened with the event and site ID when the event has a recurrence
pattern ID.
- *reloads future events after recurring dialog closes* — Uses a `Subject` to
control when the dialog closes and asserts the future events endpoint is hit
afterwards.
- *opens snackbar confirm for non-recurring event* — Asserts a confirmation
snackbar is shown instead of a dialog for single events.
- *calls deleteOfficeHours and reloads when confirmed* — Simulates the user
clicking Delete in the snackbar and asserts the service is called with the
correct site and event IDs, then the future events list reloads.
- *shows success snackbar after deletion* — Asserts a success message is shown
after the deletion completes.

---

## OfficeHoursQueueComponent

The `OfficeHoursQueueComponent` is the TA/instructor queue management view. It
polls for queue updates every 10 seconds, plays a notification sound when new
tickets arrive, and handles calling, cancelling, and closing tickets.

### Setup
The component depends on `MyCoursesService`, `MatSnackBar`, `MatDialog`, and
`ActivatedRoute`. All are mocked. `HTMLMediaElement.play` is stubbed since JSDOM
does not support audio. The `timer` subscription is stubbed before each test.
A `makeQueue` factory function builds `OfficeHourQueueOverview` objects with
sensible defaults to reduce repetition.

### Tests

**should create**
Sanity check that the component instantiates without errors.

**should set ohEventId from route params**
Confirms the event ID is read from the route as `7`.

**ngOnInit starts polling timer and fires immediately**
Ticks 0ms after init and asserts the queue service was called once.

**ngOnInit polls again after 10 seconds**
Ticks 10 seconds and asserts the service was called a second time.

**ngOnDestroy unsubscribes timer**
Destroys the component and confirms no further polls occur after destruction.

**pollQueue**
Overrides the mock with a queue containing a ticket, calls `pollQueue()`, and
asserts the `queue` signal is updated.

**handleNotification**

- *notifies when queue has new ticket and no active ticket* — Empty old queue,
new queue with a ticket, no active ticket: sound plays.
- *notifies when old queue was undefined and new queue has tickets* — Undefined
previous state is treated as empty, notification fires.
- *notifies when new queue has ticket not in old queue* — A new ticket ID that
wasn't in the old queue triggers a notification.
- *does NOT notify when active ticket is already present* — If the TA already
has an active ticket, no sound plays for new queued tickets.
- *does NOT notify when queue is empty* — Empty new queue never triggers sound.
- *does NOT notify when all new tickets were already in old queue* — Same ticket
IDs mean no change, no notification.
- *resets title and unsubscribes flash timer when notify=false* — Title is reset
and flash timer cleaned up when no notification is needed.
- *flashes title when notifying* — `setTitle` is called when a notification fires.

**callTicket**

- *calls callTicket service and then pollQueue on success* — Service called with
correct ticket ID, then queue refreshes.
- *shows snackBar on error with error message* — Service failure with an error
message shows that message in the snackbar.
- *shows fallback snackBar message when no error.message* — If the error object
has no message, a generic fallback string is shown.

**cancelTicket**

- *calls cancelTicket service and pollQueue on success* — Service called and
queue refreshes after successful cancel.
- *shows snackBar on error* — Service failure shows error in snackbar.

**closeTicket**

- *opens CloseTicketDialog with ticket id* — Asserts the correct dialog is opened
with the ticket's ID as the dialog data.
- *calls pollQueue after dialog closes* — Uses a `Subject` to control dialog
close timing and asserts the queue refreshes afterwards.

---

## officeHourPageGuard

The `officeHourPageGuard` is a functional route guard that checks whether the
current user has one of a set of allowed roles for a specific office hours event.

### Setup
`MyCoursesService` is mocked with `getOfficeHoursRole`. A `buildRoute` helper
constructs a minimal `ActivatedRouteSnapshot` with a given event ID and parent
course site ID. Guards are run inside `TestBed.runInInjectionContext` since they
use Angular's `inject()` function.

### Tests

- *returns true when role is in allowed roles* — Mocks `getOfficeHoursRole` to
return `'UTA'` and asserts the guard emits `true` for an allowed roles list
containing UTA.
- *returns false when role is NOT in allowed roles* — Mocks a `'Student'` role
and asserts `false` is emitted.
- *returns false when service throws an error* — Makes the service throw and
asserts the guard safely emits `false` instead of crashing.

---

## courseSitePageGuard

The `courseSitePageGuard` is a functional route guard that checks whether the
user has an allowed role at the course site level, using a synchronous
`courseOverview` value rather than an observable.

### Setup
Same pattern as `officeHourPageGuard` but mocks `courseOverview` instead of
`getOfficeHoursRole`.

### Tests

- *returns Observable<true> when role is in allowed roles* — `courseOverview`
returns an Instructor role, guard emits `true`.
- *returns Observable<false> when role is NOT in allowed roles* — Student role
produces `false`.
- *returns Observable<false> when courseOverview is undefined* — Missing overview
safely returns `false` rather than throwing.

---

## officeHoursResolver

The `officeHoursResolver` is a functional route resolver that either returns a
default new `OfficeHours` object when the route param is `'new'`, or fetches an
existing one from the backend.

### Setup
`MyCoursesService` is mocked with `getOfficeHours`. A `buildRoute` helper
constructs a route snapshot with both `event_id` and `course_site_id` accessible
via `paramMap`. Resolvers are run inside `TestBed.runInInjectionContext`.

### Tests

- *returns a default new OfficeHours object when event_id is "new"* — Calls the
resolver with `'new'` and asserts the result matches the default shape with
`id: -1` and empty fields. No service call is made.
- *calls getOfficeHours when event_id is a number* — Passes `'7'` as the event ID,
asserts the service is called with the correct numeric IDs, and confirms the
emitted value matches the mock.
- *returns undefined when getOfficeHours throws an error* — Makes the service
throw and asserts the resolver emits `undefined` rather than propagating the
error, allowing the route to handle it gracefully.