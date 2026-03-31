/**
 * Reservation detail route — loads a single hallway room reservation by id.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ReservationComponent } from '../../../coworking/reservation/reservation.component';
import { ReservationService } from '../../../coworking/reservation/reservation.service';
import { ReservationJSON } from '../../../coworking/coworking.models';

const MOCK_JSON: ReservationJSON = {
  id: 99,
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

describe('ReservationComponent (room reservation /coworking/reservation/:id)', () => {
  let fixture: ComponentFixture<ReservationComponent>;
  let component: ReservationComponent;
  let httpMock: HttpTestingController;

  const routerMock = {
    navigate: jest.fn()
  };

  function setupRoute(idParam: string) {
    TestBed.configureTestingModule({
      declarations: [ReservationComponent],
      providers: [
        ReservationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: { id: idParam } }
          }
        },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ReservationComponent);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    setupRoute('99');
    httpMock.expectOne('/api/coworking/reservation/99').flush(MOCK_JSON);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('requests reservation by id from the route on construction', () => {
    setupRoute('123');
    const req = httpMock.expectOne('/api/coworking/reservation/123');
    req.flush({ ...MOCK_JSON, id: 123 });
    fixture.detectChanges();

    expect(component.reservationService.reservation()?.id).toBe(123);
  });

  it('renders coworking-reservation-card when reservation is loaded', () => {
    setupRoute('99');
    httpMock.expectOne('/api/coworking/reservation/99').flush(MOCK_JSON);
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('coworking-reservation-card');
    expect(el).toBeTruthy();
  });
});
