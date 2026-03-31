/**
 * RoomReservationService — remaining study-room hours + reservation API (extends ReservationService).
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { RoomReservationService } from '../../../coworking/room-reservation/room-reservation.service';
import { BASE_RESERVATION_JSON } from './coworking-test-helpers';

describe('RoomReservationService (CSXL hallway)', () => {
  let service: RoomReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RoomReservationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RoomReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNumHoursStudyRoomReservations', () => {
    it('GETs remaining hours from user-reservations endpoint', (done) => {
      service.getNumHoursStudyRoomReservations().subscribe((hours) => {
        expect(hours).toBe('12.5');
        done();
      });

      const req = httpMock.expectOne('/api/coworking/user-reservations/');
      expect(req.request.method).toBe('GET');
      req.flush('12.5');
    });
  });

  describe('inherited ReservationService behavior', () => {
    it('getReservation updates the shared reservation signal', () => {
      service.getReservation(99);

      const req = httpMock.expectOne('/api/coworking/reservation/99');
      req.flush(BASE_RESERVATION_JSON);

      expect(service.reservation()?.id).toBe(1);
    });
  });
});
