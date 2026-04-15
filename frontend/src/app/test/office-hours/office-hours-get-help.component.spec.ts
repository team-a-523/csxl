/**
 * Tests for OfficeHoursGetHelpComponent.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { OfficeHoursGetHelpComponent } from '../../my-courses/course/office-hours/office-hours-get-help/office-hours-get-help.component';
import { MyCoursesService } from '../../my-courses/my-courses.service';
import {
  OfficeHourGetHelpOverview,
  OfficeHourTicketOverview
} from '../../my-courses/my-courses.model';

const MOCK_TICKET: OfficeHourTicketOverview = {
  id: 10,
  created_at: new Date(),
  called_at: undefined,
  closed_at: undefined,
  state: 'Queued',
  type: 0,
  description: 'Help me',
  creators: [],
  caller: undefined,
  has_concerns: undefined,
  caller_notes: undefined
};

function makeGetHelpOverview(
  overrides: Partial<OfficeHourGetHelpOverview> = {}
): OfficeHourGetHelpOverview {
  return {
    event_type: 'Office Hours',
    event_mode: 'In-Person',
    event_start_time: new Date(),
    event_end_time: new Date(),
    event_location: 'SN 0115',
    event_location_description: '',
    ticket: undefined,
    queue_position: 0,
    ...overrides
  };
}

describe('OfficeHoursGetHelpComponent', () => {
  let component: OfficeHoursGetHelpComponent;
  let fixture: ComponentFixture<OfficeHoursGetHelpComponent>;
  let titleService: Title;

  const baseOverview = makeGetHelpOverview();

  const myCoursesServiceMock = {
    getOfficeHoursHelpOverview: jest.fn((_officeHoursEventId: number) =>
      of(baseOverview)
    ),
    cancelTicket: jest.fn((_ticketId: number) => of(MOCK_TICKET)),
    createTicket: jest.fn(() => of(MOCK_TICKET))
  };

  const snackBarMock = { open: jest.fn() };

  function setup() {
    jest.clearAllMocks();
    jest
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);

    myCoursesServiceMock.getOfficeHoursHelpOverview.mockReturnValue(
      of(baseOverview)
    );
    myCoursesServiceMock.cancelTicket.mockReturnValue(of(MOCK_TICKET));
    myCoursesServiceMock.createTicket.mockReturnValue(of(MOCK_TICKET));

    TestBed.configureTestingModule({
      declarations: [OfficeHoursGetHelpComponent],
      imports: [ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MyCoursesService, useValue: myCoursesServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { event_id: 5 } } }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(OfficeHoursGetHelpComponent);
    component = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    // Stub timer so ngOnDestroy does not throw when ngOnInit was never called
    component.timer = { unsubscribe: jest.fn() } as any;
  }

  describe('basic properties', () => {
    beforeEach(() => setup());

    it('should create', fakeAsync(() => {
      component.ngOnInit();
      tick(0);
      expect(component).toBeTruthy();
      component.ngOnDestroy();
    }));

    it('should set ohEventId from route params', () => {
      expect(component.ohEventId).toBe(5);
    });
  });

  describe('ngOnInit / ngOnDestroy', () => {
    beforeEach(() => setup());

    it('starts polling timer immediately', fakeAsync(() => {
      component.ngOnInit();
      tick(0);
      expect(
        myCoursesServiceMock.getOfficeHoursHelpOverview
      ).toHaveBeenCalledWith(5);
      component.ngOnDestroy();
    }));

    it('polls again at 10s intervals', fakeAsync(() => {
      component.ngOnInit();
      tick(0);
      tick(10000);
      expect(
        myCoursesServiceMock.getOfficeHoursHelpOverview
      ).toHaveBeenCalledTimes(2);
      component.ngOnDestroy();
    }));

    it('ngOnDestroy unsubscribes timer', fakeAsync(() => {
      component.ngOnInit();
      tick(0);
      component.ngOnDestroy();
      const count =
        myCoursesServiceMock.getOfficeHoursHelpOverview.mock.calls.length;
      tick(10000);
      expect(
        myCoursesServiceMock.getOfficeHoursHelpOverview
      ).toHaveBeenCalledTimes(count);
    }));
  });

  describe('pollData', () => {
    beforeEach(() => setup());

    it('calls getOfficeHoursHelpOverview and sets data signal', fakeAsync(() => {
      const overview = makeGetHelpOverview({ queue_position: 3 });
      myCoursesServiceMock.getOfficeHoursHelpOverview.mockReturnValue(
        of(overview)
      );

      component.ngOnInit();
      tick(0);
      component.ngOnDestroy();

      expect(component.data()).toEqual(overview);
    }));
  });

  describe('handleNotification', () => {
    beforeEach(() => setup());

    it('notifies when ticket transitions from Queued to Called', fakeAsync(() => {
      const playSpy = jest
        .spyOn(window.HTMLMediaElement.prototype, 'play')
        .mockResolvedValue(undefined);

      component.data.set(
        makeGetHelpOverview({ ticket: { ...MOCK_TICKET, state: 'Queued' } })
      );

      component.handleNotification(
        makeGetHelpOverview({ ticket: { ...MOCK_TICKET, state: 'Called' } })
      );

      expect(playSpy).toHaveBeenCalled();
      component.titleFlashTimer?.unsubscribe();
    }));

    it('does NOT notify when ticket is still Queued', fakeAsync(() => {
      const playSpy = jest
        .spyOn(window.HTMLMediaElement.prototype, 'play')
        .mockResolvedValue(undefined);

      component.data.set(
        makeGetHelpOverview({ ticket: { ...MOCK_TICKET, state: 'Queued' } })
      );

      component.handleNotification(
        makeGetHelpOverview({ ticket: { ...MOCK_TICKET, state: 'Queued' } })
      );

      expect(playSpy).not.toHaveBeenCalled();
    }));

    it('does NOT notify when old state was not Queued', fakeAsync(() => {
      const playSpy = jest
        .spyOn(window.HTMLMediaElement.prototype, 'play')
        .mockResolvedValue(undefined);

      component.data.set(
        makeGetHelpOverview({ ticket: { ...MOCK_TICKET, state: 'Called' } })
      );

      component.handleNotification(
        makeGetHelpOverview({ ticket: { ...MOCK_TICKET, state: 'Called' } })
      );

      expect(playSpy).not.toHaveBeenCalled();
    }));

    it('does NOT notify when no ticket in new data', fakeAsync(() => {
      const playSpy = jest
        .spyOn(window.HTMLMediaElement.prototype, 'play')
        .mockResolvedValue(undefined);

      component.data.set(makeGetHelpOverview());
      component.handleNotification(makeGetHelpOverview({ ticket: undefined }));

      expect(playSpy).not.toHaveBeenCalled();
    }));

    it('resets title and unsubscribes flash timer when not notifying', fakeAsync(() => {
      const setTitleSpy = jest.spyOn(titleService, 'setTitle');
      const mockFlashSub = { unsubscribe: jest.fn() };
      component.titleFlashTimer = mockFlashSub as any;

      component.handleNotification(makeGetHelpOverview({ ticket: undefined }));

      expect(mockFlashSub.unsubscribe).toHaveBeenCalled();
      expect(setTitleSpy).toHaveBeenCalledWith('Office Hours Get Help');
    }));

    it('flashes title when notifying', fakeAsync(() => {
      const setTitleSpy = jest.spyOn(titleService, 'setTitle');
      jest
        .spyOn(window.HTMLMediaElement.prototype, 'play')
        .mockResolvedValue(undefined);

      component.data.set(
        makeGetHelpOverview({ ticket: { ...MOCK_TICKET, state: 'Queued' } })
      );
      component.handleNotification(
        makeGetHelpOverview({ ticket: { ...MOCK_TICKET, state: 'Called' } })
      );

      tick(0);
      expect(setTitleSpy).toHaveBeenCalled();
      component.titleFlashTimer?.unsubscribe();
    }));
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      setup();
      component.data.set(makeGetHelpOverview());
    });

    it('type=0 with description returns true', () => {
      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('My question');
      expect(component.isFormValid()).toBe(true);
    });

    it('type=0 with empty description returns false', () => {
      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('');
      expect(component.isFormValid()).toBe(false);
    });

    it('type=1 with all fields filled returns true', () => {
      component.ticketForm.controls['type'].setValue(1);
      component.ticketForm.controls['assignmentSection'].setValue('Part A');
      component.ticketForm.controls['codeSection'].setValue('Goal');
      component.ticketForm.controls['conceptsSection'].setValue('Concepts');
      component.ticketForm.controls['attemptSection'].setValue('I tried X');
      expect(component.isFormValid()).toBe(true);
    });

    it('type=1 with missing assignmentSection returns false', () => {
      component.ticketForm.controls['type'].setValue(1);
      component.ticketForm.controls['assignmentSection'].setValue('');
      component.ticketForm.controls['codeSection'].setValue('Goal');
      component.ticketForm.controls['conceptsSection'].setValue('Concepts');
      component.ticketForm.controls['attemptSection'].setValue('I tried X');
      expect(component.isFormValid()).toBe(false);
    });

    it('Virtual - Student Link mode requires link', () => {
      component.data.set(
        makeGetHelpOverview({ event_mode: 'Virtual - Student Link' })
      );
      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('Question');
      component.ticketForm.controls['link'].setValue('');
      expect(component.isFormValid()).toBe(false);
    });

    it('Virtual - Student Link mode with link provided returns true', () => {
      component.data.set(
        makeGetHelpOverview({ event_mode: 'Virtual - Student Link' })
      );
      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('Question');
      component.ticketForm.controls['link'].setValue('https://zoom.us/j/123');
      expect(component.isFormValid()).toBe(true);
    });
  });

  describe('cancelTicket', () => {
    beforeEach(() => setup());

    it('calls cancelTicket service, calls pollData, shows snackBar', fakeAsync(() => {
      component.ngOnInit();
      tick(0);
      jest.clearAllMocks();
      myCoursesServiceMock.cancelTicket.mockReturnValue(of(MOCK_TICKET));
      myCoursesServiceMock.getOfficeHoursHelpOverview.mockReturnValue(
        of(baseOverview)
      );

      component.cancelTicket(MOCK_TICKET);
      tick();

      expect(myCoursesServiceMock.cancelTicket).toHaveBeenCalledWith(
        MOCK_TICKET.id
      );
      expect(myCoursesServiceMock.getOfficeHoursHelpOverview).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('Ticket cancelled', '', {
        duration: 5000
      });
      component.ngOnDestroy();
    }));

    it('shows snackBar on error', fakeAsync(() => {
      myCoursesServiceMock.cancelTicket.mockReturnValue(
        throwError(() => 'Cancel failed')
      );

      component.cancelTicket(MOCK_TICKET);
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith('Cancel failed', '', {
        duration: 2000
      });
    }));
  });

  describe('submitTicketForm', () => {
    beforeEach(() => {
      setup();
      component.data.set(makeGetHelpOverview());
    });

    it('type=0 builds conceptual description', fakeAsync(() => {
      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('Need help');

      component.submitTicketForm();
      tick();

      const call = (myCoursesServiceMock.createTicket.mock.calls as any[][])[0][0];
      expect(call.description).toContain('**Conceptual Question**');
      expect(call.description).toContain('Need help');
      expect(call.type).toBe(0);
      expect(call.office_hours_id).toBe(5);
    }));

    it('type=1 builds structured assignment description', fakeAsync(() => {
      component.ticketForm.controls['type'].setValue(1);
      component.ticketForm.controls['assignmentSection'].setValue('Part A');
      component.ticketForm.controls['codeSection'].setValue('My goal');
      component.ticketForm.controls['conceptsSection'].setValue('Loops');
      component.ticketForm.controls['attemptSection'].setValue('I tried X');

      component.submitTicketForm();
      tick();

      const call = (myCoursesServiceMock.createTicket.mock.calls as any[][])[0][0];
      expect(call.description).toContain('**Assignment Part**');
      expect(call.description).toContain('Part A');
      expect(call.description).toContain('**Goal**');
      expect(call.description).toContain('**Concepts**');
      expect(call.description).toContain('**Tried**');
      expect(call.type).toBe(1);
    }));

    it('appends link for Virtual - Student Link mode', fakeAsync(() => {
      component.data.set(
        makeGetHelpOverview({ event_mode: 'Virtual - Student Link' })
      );
      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('Help');
      component.ticketForm.controls['link'].setValue('https://zoom.us/j/123');

      component.submitTicketForm();
      tick();

      const call = (myCoursesServiceMock.createTicket.mock.calls as any[][])[0][0];
      expect(call.description).toContain('https://zoom.us/j/123');
    }));

    it('does NOT append link for non-virtual mode', fakeAsync(() => {
      component.data.set(makeGetHelpOverview({ event_mode: 'In-Person' }));
      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('Help');
      component.ticketForm.controls['link'].setValue('https://zoom.us/j/123');

      component.submitTicketForm();
      tick();

      const call = (myCoursesServiceMock.createTicket.mock.calls as any[][])[0][0];
      expect(call.description).not.toContain('Link:');
    }));

    it('calls pollData on success', fakeAsync(() => {
      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('Help');

      component.submitTicketForm();
      tick();

      expect(myCoursesServiceMock.getOfficeHoursHelpOverview).toHaveBeenCalled();
    }));

    it('shows snackBar on error', fakeAsync(() => {
      myCoursesServiceMock.createTicket.mockReturnValue(
        throwError(() => ({ error: { message: 'Cooldown active' } }))
      );

      component.ticketForm.controls['type'].setValue(0);
      component.ticketForm.controls['description'].setValue('Help');
      component.submitTicketForm();
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith('Cooldown active', '', {
        duration: 2000
      });
    }));
  });
});
