/**
 * ReservationTableService — CSXL hallway room grid: availability, selection, draft POST.
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { ReservationTableService } from '../../../coworking/room-reservation/reservation-table.service';
import { ProfileService } from '../../../profile/profile.service';
import { RoomReservationWidgetComponent } from '../../../coworking/widgets/room-reservation-table/room-reservation-table.widget';
import { TableCell } from '../../../coworking/coworking.models';
import { MOCK_PROFILE } from './coworking-test-helpers';
import { BASE_RESERVATION_JSON } from './coworking-test-helpers';

const CE = ReservationTableService.CellEnum;
const THIRTY_MIN = 30 * 60 * 1000;

describe('ReservationTableService (hallway room grid)', () => {
  let service: ReservationTableService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReservationTableService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProfileService, useValue: { profile$: of(MOCK_PROFILE) } }
      ]
    });
    service = TestBed.inject(ReservationTableService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    (service as unknown as { profileSubscription: { unsubscribe: () => void } })
      .profileSubscription.unsubscribe();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getReservationsForRoomsByDate', () => {
    it('GETs /api/coworking/room-reservation/ with ISO date query param', () => {
      const d = new Date('2024-03-15T12:00:00.000Z');
      service.getReservationsForRoomsByDate(d).subscribe();

      const req = httpMock.expectOne((r) =>
        r.url.includes('/api/coworking/room-reservation/')
      );
      expect(req.request.params.get('date')).toBe(d.toISOString());
      req.flush({
        reserved_date_map: {},
        capacity_map: {},
        room_type_map: {},
        operating_hours_start: '2024-03-15T08:00:00.000Z',
        operating_hours_end: '2024-03-15T18:00:00.000Z',
        number_of_time_slots: 4
      });
    });
  });

  describe('draftReservation', () => {
    it('throws when no room row has RESERVING cells', () => {
      expect(() =>
        service.draftReservation({ a: [CE.AVAILABLE, CE.AVAILABLE] }, new Date())
      ).toThrow('No room selected');
    });

    it('POSTs draft with room id and 30-minute slot range from selection', (done) => {
      const operationStart = new Date('2024-06-01T08:00:00.000Z');
      const reservationsMap = {
        hallStudy1: [
          CE.AVAILABLE,
          CE.RESERVING,
          CE.RESERVING,
          CE.AVAILABLE
        ]
      };

      service.draftReservation(reservationsMap, operationStart).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne('/api/coworking/reservation');
      expect(req.request.method).toBe('POST');
      const body = req.request.body;
      expect(body.users).toEqual([MOCK_PROFILE]);
      expect(body.seats).toEqual([]);
      expect(body.room).toEqual({ id: 'hallStudy1' });
      const minIdx = 1;
      const maxIdx = 2;
      expect(body.start.getTime()).toBe(
        operationStart.getTime() + minIdx * THIRTY_MIN
      );
      expect(body.end.getTime()).toBe(
        operationStart.getTime() + (maxIdx + 1) * THIRTY_MIN
      );
      req.flush({ ...BASE_RESERVATION_JSON, id: 5 });
    });
  });

  describe('makeDraftReservation', () => {
    it('POSTs JSON body to /api/coworking/reservation', () => {
      const body = {
        users: [MOCK_PROFILE],
        seats: [],
        room: { id: 'r1' },
        start: new Date(),
        end: new Date()
      };
      service.makeDraftReservation(body as any).subscribe();

      const req = httpMock.expectOne('/api/coworking/reservation');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('generateTimeSlots', () => {
    it('creates one label per 30-minute step before operating hours end', () => {
      const start = new Date('2024-01-01T09:00:00');
      const end = new Date('2024-01-01T10:30:00');
      const slots = service.generateTimeSlots(start, end, 99);
      expect(slots.length).toBe(3);
      expect(slots[0]).toContain('to');
    });
  });

  describe('setSelectedDate', () => {
    it('emits on selectedDate$', (done) => {
      service.selectedDate$.subscribe((d) => {
        if (d === '3/15/2024') {
          done();
        }
      });
      service.setSelectedDate('3/15/2024');
    });
  });

  describe('setMinDate / setMaxDate', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('setMinDate rolls to next calendar day after operating hours end (18:00)', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-01T19:30:00'));
      const d = service.setMinDate();
      expect(d.getDate()).toBe(2);
      expect(d.getMonth()).toBe(5);
    });

    it('setMaxDate is seven days from today', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-01T10:00:00'));
      const d = service.setMaxDate();
      expect(d.getDate()).toBe(8);
    });
  });

  describe('cell selection (adjacent slots in hallway grid)', () => {
    let widget: Pick<
      RoomReservationWidgetComponent,
      | 'reservationsMap'
      | 'selectedCells'
      | 'setSlotReserving'
      | 'setSlotAvailable'
    >;

    beforeEach(() => {
      widget = {
        reservationsMap: { roomA: [0, 0, 0, 0] },
        selectedCells: [] as TableCell[],
        setSlotReserving(k: string, i: number) {
          this.reservationsMap[k][i] = CE.RESERVING;
        },
        setSlotAvailable(k: string, i: number) {
          this.reservationsMap[k][i] = CE.AVAILABLE;
        }
      };
    });

    it('selectCell adds adjacent slot in same room row', () => {
      service.selectCell('roomA', 0, widget as RoomReservationWidgetComponent);
      service.selectCell('roomA', 1, widget as RoomReservationWidgetComponent);
      expect(widget.selectedCells.length).toBe(2);
      expect(widget.reservationsMap['roomA'][0]).toBe(CE.RESERVING);
    });

    it('deselectCell removes slot and clears RESERVING state', () => {
      service.selectCell('roomA', 0, widget as RoomReservationWidgetComponent);
      service.deselectCell('roomA', 0, widget as RoomReservationWidgetComponent);
      expect(widget.selectedCells.length).toBe(0);
      expect(widget.reservationsMap['roomA'][0]).toBe(CE.AVAILABLE);
    });
  });

  describe('MAX_RESERVATION_CELL_LENGTH', () => {
    it('caps consecutive selection length at 4 slots', () => {
      expect(ReservationTableService.MAX_RESERVATION_CELL_LENGTH).toBe(4);
    });
  });
});
