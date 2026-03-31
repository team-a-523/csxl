/**
 * ReservationService — shared API for hallway room reservation state (GET/PUT).
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ReservationService } from '../../../coworking/reservation/reservation.service';
import { ReservationJSON } from '../../../coworking/coworking.models';

const MOCK_JSON: ReservationJSON = {
  id: 42,
  start: '2024-06-01T10:00:00.000Z',
  end: '2024-06-01T11:00:00.000Z',
  users: [],
  seats: [],
  walkin: false,
  created_at: '2024-06-01T09:00:00.000Z',
  updated_at: '2024-06-01T09:00:00.000Z',
  room: null,
  state: 'DRAFT'
};

describe('ReservationService (room reservation API)', () => {
  let service: ReservationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReservationService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ReservationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getReservation', () => {
    it('GETs the reservation and updates the readonly signal', () => {
      service.getReservation(42);

      const req = httpMock.expectOne('/api/coworking/reservation/42');
      expect(req.request.method).toBe('GET');
      req.flush(MOCK_JSON);

      const r = service.reservation();
      expect(r).toBeDefined();
      expect(r!.id).toBe(42);
      expect(r!.state).toBe('DRAFT');
      expect(r!.start).toEqual(new Date(MOCK_JSON.start));
    });
  });

  describe('getReservationObservable', () => {
    it('GETs the reservation and emits parsed Reservation', (done) => {
      service.getReservationObservable(7).subscribe((r) => {
        expect(r.id).toBe(7);
        expect(r.state).toBe('CONFIRMED');
        done();
      });

      const req = httpMock.expectOne('/api/coworking/reservation/7');
      req.flush({ ...MOCK_JSON, id: 7, state: 'CONFIRMED' });
    });
  });

  describe('state transitions (PUT)', () => {
    const parsed = () => service.reservation()!;

    beforeEach(() => {
      service.getReservation(1);
      httpMock.expectOne('/api/coworking/reservation/1').flush(MOCK_JSON);
    });

    it('cancel sends CANCELLED and refreshes signal', () => {
      service.cancel(parsed()).subscribe();

      const req = httpMock.expectOne('/api/coworking/reservation/42');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ id: 42, state: 'CANCELLED' });
      req.flush({ ...MOCK_JSON, state: 'CANCELLED' });

      expect(service.reservation()!.state).toBe('CANCELLED');
    });

    it('confirm sends CONFIRMED and refreshes signal', () => {
      service.confirm(parsed()).subscribe();

      const req = httpMock.expectOne('/api/coworking/reservation/42');
      expect(req.request.body).toEqual({ id: 42, state: 'CONFIRMED' });
      req.flush({ ...MOCK_JSON, state: 'CONFIRMED' });

      expect(service.reservation()!.state).toBe('CONFIRMED');
    });

    it('checkout sends CHECKED_OUT and refreshes signal', () => {
      service.checkout(parsed()).subscribe();

      const req = httpMock.expectOne('/api/coworking/reservation/42');
      expect(req.request.body).toEqual({ id: 42, state: 'CHECKED_OUT' });
      req.flush({ ...MOCK_JSON, state: 'CHECKED_OUT' });

      expect(service.reservation()!.state).toBe('CHECKED_OUT');
    });

    it('checkin sends CHECKED_IN and refreshes signal', () => {
      service.checkin(parsed()).subscribe();

      const req = httpMock.expectOne('/api/coworking/reservation/42');
      expect(req.request.body).toEqual({ id: 42, state: 'CHECKED_IN' });
      req.flush({ ...MOCK_JSON, state: 'CHECKED_IN' });

      expect(service.reservation()!.state).toBe('CHECKED_IN');
    });
  });
});
