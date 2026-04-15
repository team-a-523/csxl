import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { NewReservationPageComponent } from '../../../coworking/room-reservation/new-reservation-page/new-reservation-page.component';
import { RoomReservationService } from '../../../coworking/room-reservation/room-reservation.service';

describe('NewReservationPageComponent', () => {
  let component: NewReservationPageComponent;
  let fixture: ComponentFixture<NewReservationPageComponent>;

  const roomReservationServiceMock = {
    getNumHoursStudyRoomReservations: jest.fn(() => of('4.5'))
  };

  const routerMock = {
    navigateByUrl: jest.fn()
  };

  const snackBarMock = {
    open: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    roomReservationServiceMock.getNumHoursStudyRoomReservations.mockReturnValue(of('4.5'));

    TestBed.configureTestingModule({
      declarations: [NewReservationPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RoomReservationService, useValue: roomReservationServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideTemplate(NewReservationPageComponent, '');
    fixture = TestBed.createComponent(NewReservationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit()', () => {
    it('calls getNumHoursStudyRoomReservations on init', () => {
      expect(roomReservationServiceMock.getNumHoursStudyRoomReservations).toHaveBeenCalled();
    });

    it('sets numHoursStudyRoomReservations$ to the observable from the service', () => {
      let result: string | undefined;

      component.numHoursStudyRoomReservations$.subscribe((val) => {
        result = val;
      });

      expect(result).toBe('4.5');
    });
  });

  describe('navigateToNewReservation()', () => {
    it('navigates to /coworking/new-reservation', () => {
      component.navigateToNewReservation();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/coworking/new-reservation');
    });
  });

  describe('getNumHoursStudyRoomReservations()', () => {
    it('updates numHoursStudyRoomReservations$ with a new value', () => {
      roomReservationServiceMock.getNumHoursStudyRoomReservations.mockReturnValue(of('2.0'));

      component.getNumHoursStudyRoomReservations();

      let result: string | undefined;
      component.numHoursStudyRoomReservations$.subscribe((val) => {
        result = val;
      });

      expect(result).toBe('2.0');
    });
  });
});