/**
 * Card UI for confirm/detail/detail routes — cancel, confirm, check-in/out for room reservations.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, of } from 'rxjs';

import { CoworkingReservationCard } from '../../../../coworking/widgets/coworking-reservation-card/coworking-reservation-card';
import { RoomReservationService } from '../../../../coworking/room-reservation/room-reservation.service';
import { CoworkingService } from '../../../../coworking/coworking.service';
import { Reservation } from '../../../../coworking/coworking.models';

describe('CoworkingReservationCard (hallway room reservation card)', () => {
  let fixture: ComponentFixture<CoworkingReservationCard>;
  let component: CoworkingReservationCard;

  const routerMock = { navigateByUrl: jest.fn() };
  const snackBarMock = { open: jest.fn() };

  const roomReservationServiceMock = {
    cancel: jest.fn(() => of(undefined)),
    confirm: jest.fn(() => of(undefined)),
    checkout: jest.fn(() => of(undefined)),
    checkin: jest.fn(() => of(undefined))
  };

  /** Cancel-expand UI is shared with main coworking shell; stubbed here for room-only tests. */
  const coworkingServiceMock = {
    isCancelExpanded: new BehaviorSubject(false),
    toggleCancelExpansion: jest.fn()
  };

  const reservation: Reservation = {
    id: 1,
    start: new Date('2024-06-01T10:00:00'),
    end: new Date('2024-06-01T12:00:00'),
    users: [],
    seats: [],
    walkin: false,
    created_at: new Date(),
    updated_at: new Date(),
    room: null,
    state: 'CONFIRMED'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    TestBed.configureTestingModule({
      declarations: [CoworkingReservationCard],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: RoomReservationService,
          useValue: roomReservationServiceMock
        },
        { provide: CoworkingService, useValue: coworkingServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(CoworkingReservationCard);
    component = fixture.componentInstance;
    component.reservation = reservation;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('checkinDeadline matches min of start+10m and end', () => {
    const start = new Date('2024-06-01T10:00:00');
    const end = new Date('2024-06-01T12:00:00');
    const d = component.checkinDeadline(start, end);
    expect(d.getTime()).toBe(
      Math.min(start.getTime() + 10 * 60 * 1000, end.getTime())
    );
  });

  it('checkCheckinAllowed is true when now is within reservation window', () => {
    const now = new Date();
    component.reservation = {
      ...reservation,
      start: new Date(now.getTime() - 60_000),
      end: new Date(now.getTime() + 60 * 60_000)
    };
    expect(component.checkCheckinAllowed()).toBe(true);
  });

  it('toggleCancelExpansion delegates to CoworkingService', () => {
    component.toggleCancelExpansion();
    expect(coworkingServiceMock.toggleCancelExpansion).toHaveBeenCalled();
  });

  it('cancel calls RoomReservationService', () => {
    component.cancel();
    expect(roomReservationServiceMock.cancel).toHaveBeenCalledWith(
      component.reservation
    );
  });

  it('confirm emits isConfirmed and calls confirm', () => {
    const emitSpy = jest.spyOn(component.isConfirmed, 'emit');
    component.confirm();
    expect(emitSpy).toHaveBeenCalledWith(true);
    expect(roomReservationServiceMock.confirm).toHaveBeenCalled();
  });

  it('refreshCoworkingHome emits and navigates to coworking', () => {
    const reloadSpy = jest.spyOn(component.reloadCoworkingHome, 'emit');
    component.refreshCoworkingHome();
    expect(reloadSpy).toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/coworking');
  });
});
