/**
 * Tests for QueuedTicketCardWidget.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { QueuedTicketCardWidget } from '../../my-courses/course/office-hours/widgets/queued-ticket-card/queued-ticket-card.widget';
import { OfficeHourTicketOverview } from '../../my-courses/my-courses.model';

const MOCK_TICKET: OfficeHourTicketOverview = {
  id: 5,
  created_at: new Date(),
  called_at: undefined,
  closed_at: undefined,
  state: 'Queued',
  type: 0,
  description: 'Question about loops',
  creators: [],
  caller: undefined,
  has_concerns: undefined,
  caller_notes: undefined
};

describe('QueuedTicketCardWidget', () => {
  let component: QueuedTicketCardWidget;
  let fixture: ComponentFixture<QueuedTicketCardWidget>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QueuedTicketCardWidget],
      imports: [],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(QueuedTicketCardWidget);
    component = fixture.componentInstance;
    component.ticket = MOCK_TICKET;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cancelButtonEvent emits ticket via cancelButtonPressed', () => {
    const emitSpy = jest.spyOn(component.cancelButtonPressed, 'emit');
    component.cancelButtonEvent();
    expect(emitSpy).toHaveBeenCalledWith(MOCK_TICKET);
  });

  it('callButtonEvent emits ticket via callButtonPressed', () => {
    const emitSpy = jest.spyOn(component.callButtonPressed, 'emit');
    component.callButtonEvent();
    expect(emitSpy).toHaveBeenCalledWith(MOCK_TICKET);
  });

  it('hideCallTicketButton defaults to false', () => {
    expect(component.hideCallTicketButton).toBe(false);
  });

  it('disableCallTicketButton defaults to false', () => {
    expect(component.disableCallTicketButton).toBe(false);
  });
});
