/**
 * "Reserve a Room" landing page — hours remaining, date selector, room grid.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { NewReservationPageComponent } from '../../../coworking/room-reservation/new-reservation-page/new-reservation-page.component';
import { RoomReservationService } from '../../../coworking/room-reservation/room-reservation.service';

describe('NewReservationPageComponent', () => {
  let fixture: ComponentFixture<NewReservationPageComponent>;
  let component: NewReservationPageComponent;

  const routerMock = { navigateByUrl: jest.fn() };
  const snackBarMock = { open: jest.fn() };

  const roomReservationServiceMock = {
    getNumHoursStudyRoomReservations: jest.fn(() => of('8'))
  };

  beforeEach(() => {
    jest.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [NewReservationPageComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: RoomReservationService,
          useValue: roomReservationServiceMock
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(NewReservationPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('loads remaining study room hours on init', () => {
    fixture.detectChanges();

    expect(
      roomReservationServiceMock.getNumHoursStudyRoomReservations
    ).toHaveBeenCalled();
    let emitted: string | undefined;
    component.numHoursStudyRoomReservations$.subscribe((v) => (emitted = v));
    expect(emitted).toBe('8');
  });

  it('navigateToNewReservation routes to the new reservation page', () => {
    component.navigateToNewReservation();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
      '/coworking/new-reservation'
    );
  });
});
