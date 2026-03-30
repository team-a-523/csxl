/**
 * Tests for CalledTicketCardWidget.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CalledTicketCardWidget } from '../../my-courses/course/office-hours/widgets/called-ticket-card/called-ticket-card.widget';
import { OfficeHourTicketOverview } from '../../my-courses/my-courses.model';

const MOCK_TICKET: OfficeHourTicketOverview = {
  id: 10,
  created_at: new Date(),
  called_at: new Date(),
  closed_at: undefined,
  state: 'Called',
  type: 0,
  description: 'Need help',
  creators: [],
  caller: {
    id: 1,
    onyen: 'tstaff',
    first_name: 'Teaching',
    last_name: 'Staff',
    email: 'ta@unc.edu',
    pronouns: 'they/them',
    github: null,
    github_avatar: null,
    bio: null,
    linkedin: null,
    website: null
  },
  has_concerns: undefined,
  caller_notes: undefined
};

describe('CalledTicketCardWidget', () => {
  let component: CalledTicketCardWidget;
  let fixture: ComponentFixture<CalledTicketCardWidget>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CalledTicketCardWidget],
      imports: [],
      providers: [provideHttpClient(), provideHttpClientTesting()],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(CalledTicketCardWidget);
    component = fixture.componentInstance;
    component.ticket = MOCK_TICKET;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('expanded defaults to false', () => {
    expect(component.expanded()).toBe(false);
  });

  it('toggleExpanded flips the signal from false to true', () => {
    component.toggleExpanded();
    expect(component.expanded()).toBe(true);
  });

  it('toggleExpanded flips the signal back to false', () => {
    component.toggleExpanded();
    component.toggleExpanded();
    expect(component.expanded()).toBe(false);
  });

  it('closeButtonEvent emits the ticket via closeButtonPressed', () => {
    const emitSpy = jest.spyOn(component.closeButtonPressed, 'emit');
    component.closeButtonEvent();
    expect(emitSpy).toHaveBeenCalledWith(MOCK_TICKET);
  });

  describe('ngOnChanges', () => {
    it('sets expanded to true when calledByUser becomes true', () => {
      component.calledByUser = true;
      component.ngOnChanges({
        calledByUser: new SimpleChange(false, true, false)
      });
      expect(component.expanded()).toBe(true);
    });

    it('does NOT set expanded when calledByUser becomes false', () => {
      component.expanded.set(false);
      component.calledByUser = false;
      component.ngOnChanges({
        calledByUser: new SimpleChange(true, false, false)
      });
      expect(component.expanded()).toBe(false);
    });

    it('does nothing when calledByUser change is not present', () => {
      component.expanded.set(false);
      component.ngOnChanges({});
      expect(component.expanded()).toBe(false);
    });
  });
});
