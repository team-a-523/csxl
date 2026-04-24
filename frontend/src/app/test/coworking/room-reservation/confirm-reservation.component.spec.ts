import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { ConfirmReservationComponent } from '../../../coworking/room-reservation/confirm-reservation/confirm-reservation.component';
import { RoomReservationService } from '../../../coworking/room-reservation/room-reservation.service';
import { Reservation } from '../../../coworking/coworking.models';

const MOCK_RESERVATION: Reservation = {
    id: 1,
    start: new Date(),
    end: new Date(),
    users: [],
    seats: [],
    walkin: false,
    created_at: new Date(),
    updated_at: new Date(),
    room: { id: 'room-101', nickname: 'Room 101' },
    state: 'draft'
  };

describe('ConfirmReservationComponent', () => {
  let component: ConfirmReservationComponent;
  let fixture: ComponentFixture<ConfirmReservationComponent>;

  const roomReservationServiceMock = {
    getReservationObservable: jest.fn((id: number) => of(MOCK_RESERVATION)),
    cancel: jest.fn((reservation: Reservation) => of(MOCK_RESERVATION))
  };

  const snackBarMock = {
    open: jest.fn()
  };

  const routerMock = {
    navigateByUrl: jest.fn()
  };

  const activatedRouteMock = {
    snapshot: {
      params: { id: '42' }
    }
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    roomReservationServiceMock.getReservationObservable.mockReturnValue(of(MOCK_RESERVATION));
    roomReservationServiceMock.cancel.mockReturnValue(of(MOCK_RESERVATION));

    TestBed.configureTestingModule({
      declarations: [ConfirmReservationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RoomReservationService, useValue: roomReservationServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideTemplate(ConfirmReservationComponent, '');
    fixture = TestBed.createComponent(ConfirmReservationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('parses id from route params as a number', () => {
    expect(component.id).toBe(42);
  });

  it('reservation defaults to null', () => {
    expect(component.reservation).toBeNull();
  });

  it('isConfirmed defaults to false', () => {
    expect(component.isConfirmed).toBe(false);
  });

  describe('ngOnInit()', () => {
    it('calls getReservationObservable with the route id', () => {
      fixture.detectChanges();
      expect(roomReservationServiceMock.getReservationObservable).toHaveBeenCalledWith(42);
    });

    it('sets reservation on success', () => {
      fixture.detectChanges();
      expect(component.reservation).toEqual(MOCK_RESERVATION);
    });

    it('opens snackbar on error', fakeAsync(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      roomReservationServiceMock.getReservationObservable.mockReturnValue(
        throwError(() => ({ message: 'fetch failed' }))
      );

      // re-run init with error
      component.ngOnInit();
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Error while fetching draft reservation.',
        '',
        { duration: 8000 }
      );
    }));

    it('redirects to /coworking/new-reservation after 3 seconds on error', fakeAsync(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      roomReservationServiceMock.getReservationObservable.mockReturnValue(
        throwError(() => ({ message: 'fetch failed' }))
      );

      component.ngOnInit();
      tick(3000);

      expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
        '/coworking/new-reservation'
      );
    }));
  });

  describe('setConfirmation()', () => {
    it('sets isConfirmed to true', () => {
      component.setConfirmation(true);
      expect(component.isConfirmed).toBe(true);
    });

    it('sets isConfirmed to false', () => {
      component.setConfirmation(false);
      expect(component.isConfirmed).toBe(false);
    });
  });

  describe('ngOnDestroy()', () => {
    it('calls cancel() if not confirmed', () => {
      component.isConfirmed = false;
      component.reservation = MOCK_RESERVATION;
      component.ngOnDestroy();
      expect(roomReservationServiceMock.cancel).toHaveBeenCalledWith(MOCK_RESERVATION);
    });

    it('does NOT call cancel() if confirmed', () => {
      component.isConfirmed = true;
      component.ngOnDestroy();
      expect(roomReservationServiceMock.cancel).not.toHaveBeenCalled();
    });
  });
});