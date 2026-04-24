---
name: room-reservation
description: Domain knowledge for developing the CSXL Room Reservation and Coworking feature. Covers Reservation, Room, Seat, and OperatingHours entities and models, ReservationService, PolicyService, the availability matrix algorithm, reservation state machine, API endpoints, Angular frontend components and services (RoomReservationService, ReservationTableService), and testing conventions. Use when working on room reservations, seat availability, coworking status, operating hours, ambassador check-in, or the reservation table UI.
---

# Room Reservation / Coworking Feature — CSXL

## Architecture

```
FastAPI API layer  →  Service layer  →  SQLAlchemy Entity layer  →  PostgreSQL
```

- Entities: `backend/entities/coworking/`, `backend/entities/room_entity.py`
- Models: `backend/models/coworking/`, `backend/models/room.py`, `backend/models/room_details.py`
- Services: `backend/services/coworking/`
- API: `backend/api/coworking/`
- Frontend: `frontend/src/app/coworking/`

---

## Data Models / Entities

### `RoomEntity` — `backend/entities/room_entity.py` — table `room`
| Field | Type | Notes |
|---|---|---|
| `id` | String PK | e.g. `"SN135"` |
| `capacity` | Integer | |
| `building` / `room` | String | |
| `nickname` | String | |
| `reservable` | Boolean | `True` → appears in the booking table |

Relations: `seats` → `SeatEntity`, `course_sections` → `SectionRoomEntity`

**Pydantic hierarchy:**
```
RoomPartial: { id: str }
Room(RoomPartial): { nickname: str }
RoomDetails(Room): { building, room, capacity, reservable, seats: list[Seat] }
```
> Frontend only sends `RoomPartial` (just `id`) when drafting a room reservation.

### `SeatEntity` — `coworking__seat`
| Field | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `title`, `shorthand` | String | |
| `reservable` | Boolean | `True` = pre-bookable; `False` = walk-in only |
| `has_monitor`, `sit_stand` | Boolean | |
| `x`, `y` | Integer | floor map coordinates |
| `room_id` | FK → `room.id` | |

```
SeatIdentity: { id: int }
Seat(SeatIdentity): { title, shorthand, reservable, has_monitor, sit_stand, x, y }
SeatAvailability(Seat, AvailabilityList): { availability: list[TimeRange] }
```

### `ReservationEntity` — `coworking__reservation`
Index on `(start, end, state)`.

| Field | Type | Notes |
|---|---|---|
| `id` | Integer PK | |
| `start` / `end` | DateTime | |
| `state` | String | maps to `ReservationState` enum |
| `walkin` | Boolean | |
| `room_id` | FK → `room.id` (nullable) | null = seat reservation |
| `created_at`, `updated_at` | DateTime | auto-managed |

Relations: `users` (many-to-many via `coworking__reservation_user`), `seats` (many-to-many via `coworking__reservation_seat`), `room` → `RoomEntity`

**`ReservationState` enum:** `DRAFT`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`

**Key Pydantic models:**
- `ReservationRequest(TimeRange)` — `users: list[UserIdentity]`, `seats: list[SeatIdentity]`, `room: RoomPartial | None`
- `Reservation` — full model with `state`, `users`, `seats`, `room`, `walkin`, timestamps
- `ReservationDetails(Reservation)` — adds `errors`, `extendable`, `extendable_at`, `extendable_until`
- `ReservationMapDetails` — `reserved_date_map: dict[str, list[int]]`, plus `capacity_map`, `room_type_map`, `operating_hours_start`, `operating_hours_end`, `number_of_time_slots`

### `OperatingHoursEntity` — `coworking__operating_hours`
| Field | Type |
|---|---|
| `id` | Integer PK |
| `start` / `end` | DateTime (indexed) |

Managed by ambassadors/admins. Defines when the XL is open. Used to bound the availability matrix.

---

## Reservation State Machine

```
DRAFT ──────► CONFIRMED ──────► CHECKED_IN ──────► CHECKED_OUT
  │               │
  └──►CANCELLED◄──┘

Time-based auto-transitions (by _state_transition_reservation_entities_by_time):
  DRAFT → CANCELLED       after 5 minutes (draft timeout)
  CONFIRMED → CANCELLED   if start + 10 min < now and not checked in
  CHECKED_IN → CHECKED_OUT  if end ≤ now

Extra valid transition (room reservations only):
  CONFIRMED → CHECKED_IN
```

---

## Services

### `ReservationService` (`backend/services/coworking/reservation.py`)
Main service. Depends on `Session`, `PermissionService`, `PolicyService`, `OperatingHoursService`, `SeatService`.

#### Key public methods:
| Method | Description |
|---|---|
| `get_reservation(subject, id)` | Fetches one reservation; must be a party to it or have `coworking.reservation.read` |
| `get_current_reservations_for_user(subject, focus, state)` | Upcoming reservations for a user; triggers time-based state transitions |
| `get_total_time_user_reservations(user)` | Remaining weekly study room hours as string (6h limit) |
| `get_map_reserved_times_by_date(date, subject)` | **Core availability matrix** — see section below |
| `seat_availability(seats, bounds)` | Available windows per seat, constrained by operating hours + existing reservations |
| `draft_reservation(subject, request)` | Creates DRAFT; enforces policies (duration cap, overlap, weekly limit, double-booking) |
| `change_reservation(subject, delta)` | State transitions only; seat/time/party changes raise `NotImplementedError` |
| `list_all_active_and_upcoming_for_xl(subject)` | Ambassador: all seat reservations; requires `coworking.reservation.read` on `user/*` |
| `list_all_active_and_upcoming_for_rooms(subject)` | Ambassador: all room reservations |
| `staff_checkin_reservation(subject, reservation)` | CONFIRMED → CHECKED_IN; requires `coworking.reservation.manage` on `user/*` |

### `PolicyService` (`backend/services/coworking/policy.py`)
Pure Python — no DB. Central place for tunable constants.

| Method | Value |
|---|---|
| `walkin_window(subject)` | 10 minutes |
| `walkin_initial_duration(subject)` | 2 hours |
| `reservation_window(subject)` | 1 week |
| `maximum_initial_reservation_duration(subject)` | 2 hours |
| `reservation_draft_timeout()` | 5 minutes |
| `reservation_checkin_timeout()` | 10 minutes |
| `room_reservation_weekly_limit()` | 6 hours |
| `office_hours(date)` | `dict[room_id → list[tuple[time, time]]]` — per-room per-weekday blocks marked as UNAVAILABLE |

### `OperatingHoursService` (`backend/services/coworking/operating_hours.py`)
| Method | Permission |
|---|---|
| `schedule(time_range)` | None |
| `create(subject, time_range)` | `coworking.operating_hours.create` |
| `delete(subject, oh)` | `coworking.operating_hours.delete` |

### `StatusService` (`backend/services/coworking/status.py`)
`get_coworking_status(subject)` → `Status` — one-shot response with the user's reservations, seat availability, and upcoming operating hours (used by the coworking home page).

---

## Availability Matrix — `get_map_reserved_times_by_date`

Returns `ReservationMapDetails.reserved_date_map`: `dict[room_id → list[int]]`.

### Integer values (also in `RoomState(int, Enum)`)
| Value | Enum | Color | Meaning |
|---|---|---|---|
| `0` | `AVAILABLE` | Green | Open for booking |
| `1` | `RESERVED` | Red | Reserved by someone else |
| `2` | `SELECTED` | Orange | Frontend-only selection state |
| `3` | `UNAVAILABLE` | Gray | Past, no operating hours, office-hours block, or user already has a reservation |
| `4` | `SUBJECT_RESERVED` | Blue | The requesting user's own existing reservation |

### Time slot index formula
```python
index = 2 * (slot_hour - oh_start_hour) + (slot_minute - oh_start_minute) // 30
```
Each index = one 30-minute slot. Operating hours start is rounded **up** to nearest half-hour (or current time, whichever is later); end is rounded **down**.

### Algorithm (simplified)
1. Query all reservable rooms.
2. Fetch operating hours for the date; if none, return a 16-slot all-`3` table.
3. For each room: init all slots to `0`, then fill with `1` (others) or `4` (subject's own) from confirmed reservations.
4. `_transform_date_map_for_unavailable`: any column with a `4` in any room → flip all `0`s in that column to `3` (prevents double-booking across rooms).
5. `_transform_date_map_for_officehours`: mark `PolicyService.office_hours` windows as `3`.

### Room type classification (in `room_type_map`)
- capacity = 2 → `"Pairing Room"`
- capacity < 6 → `"Small Group"`
- capacity ≥ 6 → `"Large Group"`

---

## API Endpoints

### `/api/coworking` (reservation router)
| Method | Route | Returns | Description |
|---|---|---|---|
| `POST` | `/reservation` | `Reservation` | Draft new seat or room reservation |
| `GET` | `/reservation/{id}` | `Reservation` | Fetch reservation |
| `PUT` | `/reservation/{id}` | `Reservation` | State change (confirm, cancel, checkout, etc.) |
| `DELETE` | `/reservation/{id}` | `Reservation` | Cancel reservation |
| `GET` | `/room-reservation/` | `ReservationMapDetails` | Availability matrix for `?date=<ISO>` |
| `GET` | `/user-reservations/` | `str` | Remaining weekly study room hours |

### `/api/coworking/ambassador`
| Method | Route | Description |
|---|---|---|
| `GET` | `/xl` | All active/upcoming seat reservations |
| `GET` | `/rooms` | All active/upcoming room reservations |
| `PUT` | `/checkin` | Ambassador checks in a reservation |
| `POST` | `/reservation` | Ambassador creates walk-in (draft + confirm + check-in atomically) |

### `/api/coworking/operating_hours`
`GET /` (schedule for next week by default), `POST /`, `DELETE /{id}`

### `/api/coworking/status`
`GET /` → `Status` (all-in-one user status)

---

## Frontend Components

All under `frontend/src/app/coworking/`. Registered in `coworking-routing.module.ts`.

| Component | Route | Description |
|---|---|---|
| `CoworkingPageComponent` | `/coworking` | Home hub — shows open status, active reservation, upcoming rooms. Polls `/api/coworking/status` every 10s. |
| `NewReservationPageComponent` | `/coworking/new-reservation` | Wraps the `RoomReservationWidgetComponent` table. Loads remaining weekly hours on init. |
| `ConfirmReservationComponent` | `/coworking/confirm-reservation/:id` | Shows draft reservation details. On `ngOnDestroy`, cancels if not confirmed. |
| `ReservationComponent` | `/coworking/reservation/:id` | Seat reservation detail page. |
| `AmbassadorXLComponent` | `/coworking/ambassador/xl` | Seat check-in dashboard. |
| `AmbassadorRoomComponent` | `/coworking/ambassador/room` | Room reservation dashboard; polls every 5s. Shows CONFIRMED (upcoming) and CHECKED_IN (active) tables. |

### Key Widgets
| Widget | Description |
|---|---|
| `RoomReservationWidgetComponent` | The booking grid — fetches `ReservationMapDetails`, renders colored cells, manages selection, triggers draft reservation. Max 4 adjacent cells (2 hours). |
| `DateSelector` | Material datepicker; min = today (or tomorrow if past 6 PM), max = today + 7 days. Emits via `ReservationTableService.setSelectedDate()`. |

---

## Frontend Services

### `CoworkingService` (`coworking.service.ts`)
- `pollStatus()` → `GET /api/coworking/status`, updates `statusSignal`
- `draftReservation(seatSelection)` → `POST /api/coworking/reservation` for seat

### `ReservationService` (`reservation/reservation.service.ts`)
- `getReservation(id)`, `cancel(r)`, `confirm(r)`, `checkout(r)`, `checkin(r)` → all `PUT /api/coworking/reservation/:id` with the appropriate state string

### `RoomReservationService` (`room-reservation/room-reservation.service.ts`)
Extends `ReservationService`. Adds:
- `getNumHoursStudyRoomReservations()` → `GET /api/coworking/user-reservations/`

### `ReservationTableService` (`room-reservation/reservation-table.service.ts`)
Stateful service driving the availability table. Key members:
```typescript
static readonly MAX_RESERVATION_CELL_LENGTH = 4; // 4 slots × 30 min = 2 hours
static readonly CellEnum = { AVAILABLE: 0, BOOKED: 1, RESERVING: 2, UNAVAILABLE: 3, SUBJECT_RESERVATION: 4 };
```

| Method | Description |
|---|---|
| `setSelectedDate(date)` | Pushes new date to `selectedDateSubject` |
| `getReservationsForRoomsByDate(date)` | `GET /api/coworking/room-reservation/?date=<ISO>` |
| `selectCell(key, index, tableWidget)` | Selects a slot; enforces adjacency + 4-slot cap; resets if violated |
| `deselectCell(key, index, tableWidget)` | Removes slot; re-validates adjacency |
| `draftReservation(reservationsMap, opStart)` | Builds `ReservationRequest` from selected slots; calls `makeDraftReservation` |
| `makeDraftReservation(request)` | `POST /api/coworking/reservation` |

**Cell colors:**
- `0` → `#03691e` (green) — available, enabled
- `1` → `#B3261E` (red) — booked, disabled
- `2` → `orange` — selected, enabled
- `3` → `#4d4d4d` (gray) — unavailable, disabled
- `4` → `#3479be` (blue) — your reservation, disabled

### `AmbassadorRoomService`
`fetchReservations()`, `checkIn(r)`, `checkOut(r)`, `cancel(r)` — manages the ambassador room dashboard via `/api/coworking/ambassador/rooms`.

---

## Operating Hours — Two Mechanisms

| Mechanism | Source | Used For |
|---|---|---|
| Database (`coworking__operating_hours`) | Managed by ambassadors via API | Bounds the availability matrix; if no entry exists for a date, all slots are gray |
| `PolicyService.office_hours` | Hardcoded Python dict by room + weekday | Marks specific room/time slots as UNAVAILABLE (e.g. TA office hours in SN141 Mon–Thu) |

**If no operating hours exist for a date**, `get_map_reserved_times_by_date` returns a 16-slot (10 AM–6 PM) all-`3` map.

---

## Testing

Tests live in `backend/test/services/coworking/` and `backend/test/models/coworking/`.

| File | Key Coverage |
|---|---|
| `reservation/draft_test.py` | Seat/room draft — policies, overlap, weekly limit, permissions |
| `reservation/change_test.py` | Valid/invalid state transitions; NotImplemented for time/seat changes |
| `reservation/get_map_current_reservations_test.py` | Matrix algorithm helpers + full `get_map_reserved_times_by_date` |
| `reservation/state_transition_test.py` | Time-based auto-transitions (draft/checkin timeout, checkout) |
| `operating_hours_test.py` | CRUD + overlap prevention |
| `models/coworking/availability_list_test.py` | `AvailabilityList` operations |
| `models/coworking/time_range_test.py` | `TimeRange` helpers + timezone handling |

**Test data** (`reservation/reservation_data.py`):
- `reservation_1` — CHECKED_IN seat (active)
- `reservation_4` — CONFIRMED future seat
- `reservation_5` — DRAFT future seat
- `reservation_6` — CONFIRMED future room
- `reservation_7` — CONFIRMED current room

---

## Common Development Tasks

### Adding a new time limit policy
1. Add a method to `backend/services/coworking/policy.py`
2. Call it from the relevant enforcement point in `ReservationService.draft_reservation()` or `change_reservation()`
3. Add a test in `draft_test.py` or `change_test.py`

### Adding a room to the office-hours block schedule
1. Update the hardcoded dict in `PolicyService.office_hours(date)` in `backend/services/coworking/policy.py`
2. Update tests in `reservation/get_map_current_reservations_test.py`

### Adding a new reservation state
1. Extend `ReservationState` enum in `backend/models/coworking/reservation.py`
2. Add the valid transition in `ReservationService._change_state()`
3. Update `ReservationService._state_transition_reservation_entities_by_time()` if time-based
4. Update `ReservationEntity` column if needed + migration
5. Add frontend state handling in `ReservationService` (frontend) and update ambassador/coworking components
