# Room Reservation Tests

## RoomReservationService

The `RoomReservationService` is responsible for making HTTP requests to the backend
for room reservation data. Since it only has one method, the tests are focused on
ensuring the correct endpoint is called and the response is passed through correctly.

### Setup

The test module uses `provideHttpClient()` and `provideHttpClientTesting()` instead
of the deprecated `HttpClientTestingModule`. The `HttpTestingController` is injected
to intercept and mock HTTP calls, and `httpMock.verify()` runs after each test to
ensure no unexpected requests were made.

### Tests

**should be created**
Sanity check that the service instantiates without errors.

**getNumHoursStudyRoomReservations()**

- _calls the correct endpoint_ — Calls the method and asserts that exactly one GET
  request was made to `/api/coworking/user-reservations/`. Uses `flush()` to complete
  the observable with a fake response.

- _returns the value from the API_ — Captures the emitted value from the observable
  and asserts it matches the flushed response, confirming the service passes the value
  through without modifying it.

---

## RoomReservationService (cancel + getReservationObservable)

These methods are inherited from `ReservationService` but are used directly by
`ConfirmReservationComponent`, so they are mocked in that component's tests rather
than tested here.

---

## ConfirmReservationComponent

The `ConfirmReservationComponent` handles the confirmation step of the room
reservation flow. It fetches a draft reservation on init, displays it to the user,
and cancels it automatically if the user leaves without confirming.

### Setup

The component relies on `RoomReservationService`, `MatSnackBar`, `Router`, and
`ActivatedRoute`. All four are mocked. The `ActivatedRoute` mock specifically
provides a snapshot with `params: { id: '42' }` to simulate a route param being
passed in. `NO_ERRORS_SCHEMA` suppresses errors from child components like
`coworking-reservation-card` that are not relevant to these tests. The template
is overridden to empty so Angular does not attempt to render it.

### Tests

**should create**
Sanity check that the component instantiates without errors.

**parses id from route params as a number**
The constructor does `parseInt(this.route.snapshot.params['id'])`, so this test
confirms the string `'42'` from the route is correctly parsed into the number `42`
and stored on `component.id`.

**reservation defaults to null**
Confirms the initial state of `reservation` before `ngOnInit` runs is `null`.

**isConfirmed defaults to false**
Confirms the initial state of `isConfirmed` before any user interaction is `false`.

**ngOnInit()**

- _calls getReservationObservable with the route id_ — Asserts that `ngOnInit`
  calls the service with the correct numeric id parsed from the route.

- _sets reservation on success_ — Asserts that when the service returns successfully,
  `component.reservation` is set to the returned reservation object.

- _opens snackbar on error_ — When `getReservationObservable` throws, asserts that
  the snackbar is opened with the correct error message and duration of 8 seconds.
  Uses `fakeAsync` and `tick()` to flush the observable synchronously.

- _redirects to /coworking/new-reservation after 3 seconds on error_ — The component
  uses `timer(3000)` before navigating away on error. This test uses `tick(3000)` to
  fast-forward time and assert that `navigateByUrl` is called with the correct route
  after the delay.

**setConfirmation()**

- _sets isConfirmed to true_ — Passes `true` to `setConfirmation()` and asserts
  the flag updates correctly.

- _sets isConfirmed to false_ — Passes `false` to `setConfirmation()` and asserts
  the flag updates correctly.

**ngOnDestroy()**

- _calls cancel() if not confirmed_ — When `isConfirmed` is `false` and the component
  is destroyed, asserts that `cancel()` is called with the current reservation. This
  protects against orphaned draft reservations if the user navigates away.

- _does NOT call cancel() if confirmed_ — When `isConfirmed` is `true`, asserts that
  `cancel()` is never called, since the reservation was intentionally confirmed and
  should not be cancelled.

## NewReservationPageComponent

The `NewReservationPageComponent` is the main page for creating a new room
reservation. It displays the reservation table, a date selector, and the
remaining hours the user has available. It has minimal logic of its own —
it mostly delegates to `RoomReservationService` and the router.

### Setup

The component depends on `RoomReservationService`, `Router`, and `MatSnackBar`.
All three are mocked. `NO_ERRORS_SCHEMA` suppresses errors from child components
like `date-selector` and `room-reservation-table` that are not relevant to these
tests. The template is overridden to empty.

### Tests

**should create**
Sanity check that the component instantiates without errors.

**ngOnInit()**

- _calls getNumHoursStudyRoomReservations on init_ — Asserts that `ngOnInit`
  calls the service method to fetch remaining hours on startup.

- _sets numHoursStudyRoomReservations$ to the observable from the service_ —
  Subscribes to the observable set on the component and asserts it emits the
  value returned by the service mock.

**navigateToNewReservation()**

- _navigates to /coworking/new-reservation_ — Calls the method and asserts
  `router.navigateByUrl` is called with the correct route. This method exists
  to allow other parts of the component to programmatically reset to the new
  reservation page.

**getNumHoursStudyRoomReservations()**

- _updates numHoursStudyRoomReservations$ with a new value_ — Overrides the
  mock to return a different value, calls the method directly, then subscribes
  and asserts the observable reflects the updated value. This confirms the method
  can be called independently to refresh the displayed hours.

---

## ReservationTableService

The `ReservationTableService` manages the state of the reservation table UI —
tracking selected cells, handling cell selection and deselection logic, making
HTTP requests for room availability, and generating time slot labels. It has
a mix of HTTP methods and pure logic methods, so tests are split accordingly.

### Setup

The service depends on `HttpClient` and `ProfileService`. `ProfileService` is
mocked with a `profile$` observable that emits `null`. The `HttpTestingController`
is used to intercept HTTP calls, and `httpMock.verify()` runs after each test.

### Tests

**should be created**
Sanity check that the service instantiates without errors.

**setSelectedDate()**

- _emits the new date through selectedDate$_ — Subscribes to `selectedDate$`
  then calls `setSelectedDate()` with a date string and asserts the observable
  emits the new value. This confirms the `BehaviorSubject` is wired correctly.

**getReservationsForRoomsByDate()**

- _calls the correct endpoint with date as ISO string param_ — Calls the method
  with a `Date` object and asserts the HTTP request goes to
  `/api/coworking/room-reservation/`
