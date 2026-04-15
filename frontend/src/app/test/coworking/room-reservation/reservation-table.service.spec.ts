import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';
import { ReservationTableService } from '../../../coworking/room-reservation/reservation-table.service';
import { ProfileService } from '../../../profile/profile.service';
import { of } from 'rxjs';

const profileServiceMock = {
  profile$: of(null)
};

describe('ReservationTableService', () => {
  let service: ReservationTableService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ReservationTableService,
        { provide: ProfileService, useValue: profileServiceMock }
      ]
    });

    service = TestBed.inject(ReservationTableService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setSelectedDate()', () => {
    it('emits the new date through selectedDate$', () => {
      let result: string | undefined;
      service.selectedDate$.subscribe((val) => (result = val));

      service.setSelectedDate('2026-04-14');

      expect(result).toBe('2026-04-14');
    });
  });

  describe('getReservationsForRoomsByDate()', () => {
    it('calls the correct endpoint with date as ISO string param', () => {
      const date = new Date('2026-04-14T00:00:00.000Z');
      service.getReservationsForRoomsByDate(date).subscribe();

      const req = httpMock.expectOne(
        (r) =>
          r.url === '/api/coworking/room-reservation/' &&
          r.params.get('date') === date.toISOString()
      );
      expect(req.request.method).toBe('GET');
      req.flush({});
    });
  });

  describe('setMaxDate()', () => {
    it('returns a date 7 days from today', () => {
      const today = new Date();
      const expected = new Date();
      expected.setDate(today.getDate() + 7);

      const result = service.setMaxDate();

      expect(result.toDateString()).toBe(expected.toDateString());
    });
  });

  describe('setMinDate()', () => {
    it('returns today if before 6pm', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-04-14T10:00:00'));

      const result = service.setMinDate();

      expect(result.toDateString()).toBe(
        new Date('2026-04-14T10:00:00').toDateString()
      );
      jest.useRealTimers();
    });

    it('returns tomorrow if at or after 6pm', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-04-14T18:00:00'));

      const result = service.setMinDate();

      const tomorrow = new Date('2026-04-14T18:00:00');
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.toDateString()).toBe(tomorrow.toDateString());
      jest.useRealTimers();
    });
  });

  describe('generateTimeSlots()', () => {
    it('generates the correct number of slots', () => {
      const start = new Date('2026-04-14T09:00:00');
      const end = new Date('2026-04-14T11:00:00');

      const slots = service.generateTimeSlots(start, end, 4);

      expect(slots.length).toBe(4);
    });

    it('formats slots as AM/PM ranges', () => {
      const start = new Date('2026-04-14T09:00:00');
      const end = new Date('2026-04-14T09:30:00');

      const slots = service.generateTimeSlots(start, end, 1);

      expect(slots[0]).toContain('9:00AM');
      expect(slots[0]).toContain('9:30AM');
    });
  });

  describe('_findSelectedRoom()', () => {
    it('returns null when no room has a RESERVING cell', () => {
      const map = {
        'room-101': [0, 0, 0],
        'room-102': [0, 1, 0]
      };

      expect(service._findSelectedRoom(map)).toBeNull();
    });

    it('returns the room with a RESERVING cell', () => {
      const map = {
        'room-101': [0, 0, 0],
        'room-102': [0, 2, 0] // 2 = RESERVING
      };

      const result = service._findSelectedRoom(map);
      expect(result?.room).toBe('room-102');
    });
  });
});
