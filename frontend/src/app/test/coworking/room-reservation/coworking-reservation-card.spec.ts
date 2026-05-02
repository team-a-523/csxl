import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';

import { CoworkingReservationCard } from '../../../coworking/widgets/coworking-reservation-card/coworking-reservation-card';
import { RoomReservationService } from '../../../coworking/room-reservation/room-reservation.service';
import { Reservation } from '../../../coworking/coworking.models';
import { CoworkingService } from '../../../coworking/coworking.service';

const MOCK_RESERVATION: Reservation = {
  id: 1,
  start: new Date('2026-04-14T10:30:15'),
  end: new Date('2026-04-14T11:30:15'),
  users: [],
  seats: [],
  walkin: false,
  created_at: new Date('2026-04-14T10:00:00'),
  updated_at: new Date('2026-04-14T10:00:00'),
  room: { id: 'SN156', nickname: 'Room 156' },
  state: 'CONFIRMED'
};

describe('CoworkingReservationCard', () => {
  let component: CoworkingReservationCard;
  let fixture: ComponentFixture<CoworkingReservationCard>;

  const roomReservationServiceMock = {
    cancel: jest.fn(() => of(MOCK_RESERVATION)),
    confirm: jest.fn(() => of(MOCK_RESERVATION)),
    checkout: jest.fn(() => of(MOCK_RESERVATION)),
    checkin: jest.fn(() => of(MOCK_RESERVATION))
  };

  const routerMock = {
    navigateByUrl: jest.fn()
  };

  const snackBarMock = {
    open: jest.fn()
  };

  const coworkingServiceMock = {
    isCancelExpanded: new BehaviorSubject<boolean>(false),
    toggleCancelExpansion: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      declarations: [CoworkingReservationCard],
      providers: [
        { provide: RoomReservationService, useValue: roomReservationServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: CoworkingService, useValue: coworkingServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideTemplate(CoworkingReservationCard, '');
    fixture = TestBed.createComponent(CoworkingReservationCard);
    component = fixture.componentInstance;
    component.reservation = MOCK_RESERVATION;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formatReservationCountdown()', () => {
    it('formats the time until a future room reservation', () => {
      const now = new Date('2026-04-14T09:00:00');

      expect(component.formatReservationCountdown(MOCK_RESERVATION, now)).toBe(
        '1h 30m 15s'
      );
    });

    it('includes days when the reservation is more than 24 hours away', () => {
      const reservation = {
        ...MOCK_RESERVATION,
        start: new Date('2026-04-16T12:05:09')
      };
      const now = new Date('2026-04-14T10:00:00');

      expect(component.formatReservationCountdown(reservation, now)).toBe(
        '2d 02h 05m 09s'
      );
    });

    it('returns null when the reservation is not a future room reservation', () => {
      const now = new Date('2026-04-14T10:30:15');

      expect(component.formatReservationCountdown(MOCK_RESERVATION, now)).toBeNull();
      expect(
        component.formatReservationCountdown(
          { ...MOCK_RESERVATION, room: null },
          new Date('2026-04-14T09:00:00')
        )
      ).toBeNull();
      expect(
        component.formatReservationCountdown(
          { ...MOCK_RESERVATION, state: 'DRAFT' },
          new Date('2026-04-14T09:00:00')
        )
      ).toBeNull();
    });
  });
});
