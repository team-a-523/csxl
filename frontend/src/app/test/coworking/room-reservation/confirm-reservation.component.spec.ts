/**
 * Confirm draft after selecting hallway room slots — load draft, abandon → cancel, or confirm.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { ConfirmReservationComponent } from '../../../coworking/room-reservation/confirm-reservation/confirm-reservation.component';
import { RoomReservationService } from '../../../coworking/room-reservation/room-reservation.service';
import { Reservation } from '../../../coworking/coworking.models';

const MOCK_RESERVATION: Reservation = {
  id: 7,
  start: new Date('2024-06-01T10:00:00.000Z'),
  end: new Date('2024-06-01T11:00:00.000Z'),
  users: [],
  seats: [],
  walkin: false,
  created_at: new Date('2024-06-01T09:00:00.000Z'),
  updated_at: new Date('2024-06-01T09:00:00.000Z'),
  room: null,
  state: 'DRAFT'
};

describe('ConfirmReservationComponent', () => {
  let fixture: ComponentFixture<ConfirmReservationComponent>;
  let component: ConfirmReservationComponent;

  const routerMock = { navigateByUrl: jest.fn() };
  const snackBarMock = { open: jest.fn() };

  const roomReservationServiceMock = {
    getReservationObservable: jest.fn(),
    cancel: jest.fn(() => of(undefined))
  };

  function setupRoute(id: string) {
    TestBed.configureTestingModule({
      declarations: [ConfirmReservationComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: RoomReservationService,
          useValue: roomReservationServiceMock
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id } } }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(ConfirmReservationComponent);
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    roomReservationServiceMock.getReservationObservable.mockReturnValue(
      of(MOCK_RESERVATION)
    );
  });

  it('should create', () => {
    setupRoute('7');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('parses reservation id from the route', () => {
    setupRoute('42');
    expect(component.id).toBe(42);
  });

  it('loads the draft reservation on init', () => {
    setupRoute('7');
    fixture.detectChanges();

    expect(roomReservationServiceMock.getReservationObservable).toHaveBeenCalledWith(
      7
    );
    expect(component.reservation).toEqual(MOCK_RESERVATION);
  });

  it('ngOnDestroy cancels the draft when not confirmed', () => {
    setupRoute('7');
    fixture.detectChanges();

    component.ngOnDestroy();

    expect(roomReservationServiceMock.cancel).toHaveBeenCalledWith(
      MOCK_RESERVATION
    );
  });

  it('ngOnDestroy does not cancel after user confirms', () => {
    setupRoute('7');
    fixture.detectChanges();
    component.setConfirmation(true);

    component.ngOnDestroy();

    expect(roomReservationServiceMock.cancel).not.toHaveBeenCalled();
  });

  it('shows snackbar and navigates away when load fails', fakeAsync(() => {
    roomReservationServiceMock.getReservationObservable.mockReturnValue(
      throwError(() => new Error('network'))
    );
    setupRoute('7');
    fixture.detectChanges();

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Error while fetching draft reservation.',
      '',
      { duration: 8000 }
    );

    tick(3000);
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
      '/coworking/new-reservation'
    );
  }));
});
