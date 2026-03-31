/**
 * Room grid: load hallway availability by date, select slots, draft → confirm route.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of } from 'rxjs';

import { RoomReservationWidgetComponent } from '../../../../coworking/widgets/room-reservation-table/room-reservation-table.widget';
import { ReservationTableService } from '../../../../coworking/room-reservation/reservation-table.service';
import { RoomReservationService } from '../../../../coworking/room-reservation/room-reservation.service';
import { Reservation } from '../../../../coworking/coworking.models';

const MAP_DETAILS = {
  reserved_date_map: { room1: [0, 0, 0, 0] },
  capacity_map: { room1: 4 },
  room_type_map: { room1: 'Study' },
  operating_hours_start: '2024-06-01T08:00:00.000Z',
  operating_hours_end: '2024-06-01T10:00:00.000Z',
  number_of_time_slots: 4
};

describe('RoomReservationWidgetComponent (hallway table)', () => {
  let fixture: ComponentFixture<RoomReservationWidgetComponent>;
  let component: RoomReservationWidgetComponent;

  const routerMock = { navigateByUrl: jest.fn() };
  const snackBarMock = { open: jest.fn() };

  const selectedDate$ = new BehaviorSubject<string>('');
  const tableServiceMock = {
    setSelectedDate: jest.fn((d: string) => selectedDate$.next(d)),
    setMinDate: jest.fn(() => new Date('2024-06-01T08:00:00')),
    selectedDate$: selectedDate$.asObservable(),
    getReservationsForRoomsByDate: jest.fn(() => of(MAP_DETAILS)),
    generateTimeSlots: jest.fn(() => ['slot1', 'slot2']),
    deselectCell: jest.fn(),
    selectCell: jest.fn(),
    draftReservation: jest.fn(() => of({ id: 99 } as Reservation))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      declarations: [RoomReservationWidgetComponent],
      providers: [
        { provide: ReservationTableService, useValue: tableServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: RoomReservationService, useValue: {} },
        { provide: MatSnackBar, useValue: snackBarMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(RoomReservationWidgetComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.subscription.unsubscribe();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads reserved_date_map when date changes', () => {
    expect(tableServiceMock.getReservationsForRoomsByDate).toHaveBeenCalled();
    expect(component.reservationsMap).toEqual(MAP_DETAILS.reserved_date_map);
  });

  it('toggleCellColor delegates to select or deselect', () => {
    component.reservationsMap = { room1: [0, 0, 0] };
    component.reservationsMap['room1'][1] =
      ReservationTableService.CellEnum.RESERVING;
    component.toggleCellColor('room1', 1);
    expect(tableServiceMock.deselectCell).toHaveBeenCalled();

    component.reservationsMap['room1'][1] =
      ReservationTableService.CellEnum.AVAILABLE;
    component.toggleCellColor('room1', 1);
    expect(tableServiceMock.selectCell).toHaveBeenCalled();
  });

  it('draftReservation navigates to confirm-reservation/:id', () => {
    component.draftReservation();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
      '/coworking/confirm-reservation/99'
    );
  });

  it('setSlotReserving / setSlotAvailable update cell enums', () => {
    component.reservationsMap = { r: [0, 0, 0] };
    component.setSlotReserving('r', 1);
    expect(component.reservationsMap['r'][1]).toBe(
      ReservationTableService.CellEnum.RESERVING
    );
    component.setSlotAvailable('r', 1);
    expect(component.reservationsMap['r'][1]).toBe(
      ReservationTableService.CellEnum.AVAILABLE
    );
  });

});
