/**
 * Tests for OfficeHoursPageComponent.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Subject } from 'rxjs';

import { OfficeHoursPageComponent } from '../../my-courses/course/office-hours/office-hours-page/office-hours-page.component';
import { MyCoursesService } from '../../my-courses/my-courses.service';
import {
  OfficeHourEventOverview,
  TermOverview
} from '../../my-courses/my-courses.model';
import { DeleteRecurringEventDialog } from '../../my-courses/dialogs/delete-recurring-event/delete-recurring-event.dialog';

const EMPTY_PAGE = {
  items: [],
  length: 0,
  params: { page: 0, page_size: 25, order_by: '', filter: '' }
};

const MOCK_EVENT: OfficeHourEventOverview = {
  id: 1,
  type: 'Office Hours',
  mode: 'In-Person',
  description: 'Test OH',
  location: 'SN 0115',
  location_description: '',
  start_time: new Date('2024-01-15T10:00:00'),
  end_time: new Date('2024-01-15T12:00:00'),
  queued: 0,
  total_tickets: 0,
  recurrence_pattern_id: 0
};

const MOCK_TERMS: TermOverview[] = [
  {
    id: 'SP24',
    name: 'Spring 2024',
    start: new Date('2024-01-10'),
    end: new Date('2024-05-10'),
    sites: [
      {
        id: 42,
        term_id: 'SP24',
        subject_code: 'COMP',
        number: '110',
        title: 'Intro to Programming',
        role: 'Instructor',
        sections: [],
        gtas: [],
        utas: []
      }
    ],
    teaching_no_site: []
  }
];

describe('OfficeHoursPageComponent', () => {
  let component: OfficeHoursPageComponent;
  let fixture: ComponentFixture<OfficeHoursPageComponent>;
  let httpTestingController: HttpTestingController;

  const myCoursesServiceMock = {
    getCurrentOfficeHourEvents: jest.fn(() => of([])),
    getTermOverviews: jest.fn(() => of(MOCK_TERMS)),
    deleteOfficeHours: jest.fn(() => of(undefined))
  };

  const snackBarMock = {
    open: jest.fn(() => ({ onAction: () => of() }))
  };

  const dialogMock = {
    open: jest.fn(() => ({ afterClosed: () => of(undefined) }))
  };

  function flushPaginators() {
    httpTestingController.match(() => true).forEach((req) =>
      req.flush(EMPTY_PAGE)
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    myCoursesServiceMock.getCurrentOfficeHourEvents.mockReturnValue(of([] as any));
    myCoursesServiceMock.getTermOverviews.mockReturnValue(of(MOCK_TERMS) as any);
    myCoursesServiceMock.deleteOfficeHours.mockReturnValue(of(null) as any);
    snackBarMock.open.mockReturnValue({ onAction: () => of() } as any);
    dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) } as any);

    TestBed.configureTestingModule({
      declarations: [OfficeHoursPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MyCoursesService, useValue: myCoursesServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: dialogMock },
        {
          provide: ActivatedRoute,
          useValue: {
            parent: { snapshot: { params: { course_site_id: '42' } } }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OfficeHoursPageComponent);
    component = fixture.componentInstance;
    flushPaginators();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set courseSiteId from route parent params', () => {
    expect(component.courseSiteId).toBe('42');
  });

  it('should default viewState to Scheduled', () => {
    expect(component.viewState).toBe(
      OfficeHoursPageComponent.ViewState.Scheduled
    );
  });

  it('ViewState enum has Scheduled, History, Data values', () => {
    const { ViewState } = OfficeHoursPageComponent;
    expect(ViewState.Scheduled).toBeDefined();
    expect(ViewState.History).toBeDefined();
    expect(ViewState.Data).toBeDefined();
  });

  it('should call getCurrentOfficeHourEvents on init', () => {
    expect(myCoursesServiceMock.getCurrentOfficeHourEvents).toHaveBeenCalledWith(
      '42'
    );
  });

  it('should set currentOfficeHourEvents signal from service', () => {
    myCoursesServiceMock.getCurrentOfficeHourEvents.mockReturnValue(
      of([MOCK_EVENT]) as any
    );
    fixture = TestBed.createComponent(OfficeHoursPageComponent);
    component = fixture.componentInstance;
    flushPaginators();
    expect(component.currentOfficeHourEvents()).toEqual([MOCK_EVENT]);
  });

  it('should add actions column for Instructor role', () => {
    expect(component.futureOhDisplayedColumns).toContain('actions');
  });

  it('should NOT add actions column for Student role', () => {
    const studentTerms: TermOverview[] = [
      {
        ...MOCK_TERMS[0],
        sites: [{ ...MOCK_TERMS[0].sites[0], role: 'Student' }]
      }
    ];
    myCoursesServiceMock.getTermOverviews.mockReturnValue(of(studentTerms));

    fixture = TestBed.createComponent(OfficeHoursPageComponent);
    component = fixture.componentInstance;
    flushPaginators();

    expect(component.futureOhDisplayedColumns).not.toContain('actions');
  });

  it('should default pastOhDisplayedColumns to date and type', () => {
    expect(component.pastOhDisplayedColumns).toEqual(['date', 'type']);
  });

  describe('handleFutureOfficeHoursPageEvent', () => {
    it('should load new page and update signal', fakeAsync(() => {
      component.futureOfficeHourEventsPage.set({
        items: [],
        length: 0,
        params: { page: 0, page_size: 25, order_by: '', filter: '' } as any
      });

      component.handleFutureOfficeHoursPageEvent({
        pageIndex: 1,
        pageSize: 10,
        length: 50
      });

      const req = httpTestingController.expectOne((r) =>
        r.url.includes('oh-events/future')
      );
      req.flush(EMPTY_PAGE);
      tick();

      expect(component.futureOfficeHourEventsPage()).toEqual(EMPTY_PAGE as any);
    }));
  });

  describe('handlePastOfficeHoursPageEvent', () => {
    it('should load new page and update signal', fakeAsync(() => {
      component.pastOfficeHourEventsPage.set({
        items: [],
        length: 0,
        params: { page: 0, page_size: 25, order_by: '', filter: '' } as any
      });

      component.handlePastOfficeHoursPageEvent({
        pageIndex: 2,
        pageSize: 5,
        length: 100
      });

      const req = httpTestingController.expectOne((r) =>
        r.url.includes('oh-events/history')
      );
      req.flush(EMPTY_PAGE);
      tick();

      expect(component.pastOfficeHourEventsPage()).toEqual(EMPTY_PAGE as any);
    }));
  });

  describe('deleteOfficeHours', () => {
    it('opens DeleteRecurringEventDialog for recurring event', fakeAsync(() => {
      const recurringEvent = { ...MOCK_EVENT, recurrence_pattern_id: 99 };
      component.deleteOfficeHours(recurringEvent);

      expect(dialogMock.open).toHaveBeenCalledWith(
        DeleteRecurringEventDialog,
        expect.objectContaining({
          data: { siteId: '42', officeHours: recurringEvent }
        })
      );

      // afterClosed fires synchronously (of(undefined)), flush resulting HTTP request
      httpTestingController.match(() => true).forEach((req) =>
        req.flush(EMPTY_PAGE)
      );
      tick();
    }));

    it('reloads future events after recurring dialog closes', fakeAsync(() => {
      const afterClosedSubject = new Subject<void>();
      dialogMock.open.mockReturnValue({
        afterClosed: () => afterClosedSubject.asObservable()
      } as any);

      const recurringEvent = { ...MOCK_EVENT, recurrence_pattern_id: 99 };
      component.deleteOfficeHours(recurringEvent);

      afterClosedSubject.next();
      afterClosedSubject.complete();

      const req = httpTestingController.expectOne((r) =>
        r.url.includes('oh-events/future')
      );
      req.flush(EMPTY_PAGE);
      tick();
    }));

    it('opens snackbar confirm for non-recurring event', () => {
      const nonRecurring = { ...MOCK_EVENT, recurrence_pattern_id: 0 };
      component.deleteOfficeHours(nonRecurring);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Are you sure you want to delete this office hours event?',
        'Delete',
        expect.any(Object)
      );
    });

    it('calls deleteOfficeHours and reloads when confirmed', fakeAsync(() => {
      const actionSubject = new Subject<void>();
      snackBarMock.open.mockReturnValue({
        onAction: () => actionSubject.asObservable()
      } as any);

      const nonRecurring = { ...MOCK_EVENT, id: 5, recurrence_pattern_id: 0 };
      component.deleteOfficeHours(nonRecurring);

      actionSubject.next();
      actionSubject.complete();

      expect(myCoursesServiceMock.deleteOfficeHours).toHaveBeenCalledWith(
        42,
        5
      );

      const req = httpTestingController.expectOne((r) =>
        r.url.includes('oh-events/future')
      );
      req.flush(EMPTY_PAGE);
      tick();
    }));

    it('shows success snackbar after deletion', fakeAsync(() => {
      const actionSubject = new Subject<void>();
      snackBarMock.open.mockReturnValue({
        onAction: () => actionSubject.asObservable()
      } as any);

      const nonRecurring = { ...MOCK_EVENT, recurrence_pattern_id: 0 };
      component.deleteOfficeHours(nonRecurring);
      actionSubject.next();
      actionSubject.complete();

      const req = httpTestingController.expectOne((r) =>
        r.url.includes('oh-events/future')
      );
      req.flush(EMPTY_PAGE);
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'The office hours has been deleted.',
        '',
        expect.any(Object)
      );
    }));
  });
});
