/**
 * Facts block embedded in CoworkingReservationCard for room reservations.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ReservationFactsWidget } from '../../../../coworking/widgets/reservation-facts/reservation-facts.widget';
import { Reservation } from '../../../../coworking/coworking.models';

describe('ReservationFactsWidget', () => {
  let fixture: ComponentFixture<ReservationFactsWidget>;
  let component: ReservationFactsWidget;

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
    TestBed.configureTestingModule({
      declarations: [ReservationFactsWidget],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(ReservationFactsWidget);
    component = fixture.componentInstance;
    component.reservation = reservation;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('checkinDeadline is min of start+10m and end', () => {
    const start = new Date('2024-06-01T10:00:00');
    const end = new Date('2024-06-01T12:00:00');
    const deadline = component.checkinDeadline(start, end);
    expect(deadline.getTime()).toBe(
      Math.min(
        start.getTime() + 10 * 60 * 1000,
        end.getTime()
      )
    );
  });
});
