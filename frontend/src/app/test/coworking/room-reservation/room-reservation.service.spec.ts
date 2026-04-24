// room-reservation.service.spec.ts

import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RoomReservationService } from '../../../coworking/room-reservation/room-reservation.service';

describe('RoomReservationService', () => {
  let service: RoomReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RoomReservationService
      ]
    });

    service = TestBed.inject(RoomReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // ensures no unexpected HTTP calls were made
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getNumHoursStudyRoomReservations()', () => {
    it('calls the correct endpoint', () => {
      service.getNumHoursStudyRoomReservations().subscribe();

      const req = httpMock.expectOne('/api/coworking/user-reservations/');
      expect(req.request.method).toBe('GET');
      req.flush('4.5');
    });

    it('returns the value from the API', () => {
      let result: string | undefined;

      service.getNumHoursStudyRoomReservations().subscribe((val) => {
        result = val;
      });

      const req = httpMock.expectOne('/api/coworking/user-reservations/');
      req.flush('3.0');

      expect(result).toBe('3.0');
    });
  });
});
