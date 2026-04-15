/**
 * Tests for OfficeHoursQueueComponent.
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
import { Title } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';

import { OfficeHoursQueueComponent } from '../../my-courses/course/office-hours/office-hours-queue/office-hours-queue.component';
import { MyCoursesService } from '../../my-courses/my-courses.service';
import {
  OfficeHourQueueOverview,
  OfficeHourTicketOverview
} from '../../my-courses/my-courses.model';
import { CloseTicketDialog } from '../../my-courses/course/office-hours/widgets/close-ticket-dialog/close-ticket.dialog';

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

function makeQueue(
  overrides: Partial<OfficeHourQueueOverview> = {}
): OfficeHourQueueOverview {
  return {
    id: 1,
    type: 'Office Hours',
    start_time: new Date(),
    end_time: new Date(),
    active: undefined,
    other_called: [],
    queue: [],
    personal_tickets_called: 0,
    average_minutes: 0,
    total_tickets_called: 0,
    history: [],
    ...overrides
  };
}

describe('OfficeHoursQueueComponent', () => {
  let component: OfficeHoursQueueComponent;
  let fixture: ComponentFixture<OfficeHoursQueueComponent>;
  let titleService: Title;

  const queueResponse = makeQueue();

  const myCoursesServiceMock = {
    getOfficeHoursQueue: jest.fn((_officeHoursEventId: number) =>
      of(queueResponse)
    ),
    callTicket: jest.fn((_ticketId: number) => of(MOCK_TICKET)),
    cancelTicket: jest.fn((_ticketId: number) => of(MOCK_TICKET))
  };

  const snackBarMock = { open: jest.fn() };

  const dialogMock = {
    open: jest.fn((_component: any, _config?: any) => ({
      afterClosed: () => of(undefined)
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    myCoursesServiceMock.getOfficeHoursQueue.mockReturnValue(of(queueResponse));
    myCoursesServiceMock.callTicket.mockReturnValue(of(MOCK_TICKET));
    myCoursesServiceMock.cancelTicket.mockReturnValue(of(MOCK_TICKET));
    dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) });

    // Silence HTMLMediaElement.play which JSDOM doesn't support
    jest
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      declarations: [OfficeHoursQueueComponent],
      imports: [],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MyCoursesService, useValue: myCoursesServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: MatDialog, useValue: dialogMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { event_id: 7 } } }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(OfficeHoursQueueComponent);
    component = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    // Stub timer so ngOnDestroy does not throw when ngOnInit was never called
    component.timer = { unsubscribe: jest.fn() } as any;
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set ohEventId from route params', () => {
    expect(component.ohEventId).toBe(7);
  });

  it('ngOnInit starts polling timer and fires immediately', fakeAsync(() => {
    component.ngOnInit();
    tick(0);
    expect(myCoursesServiceMock.getOfficeHoursQueue).toHaveBeenCalledWith(7);
    component.ngOnDestroy();
  }));

  it('ngOnInit polls again after 10 seconds', fakeAsync(() => {
    component.ngOnInit();
    tick(0);
    tick(10000);
    expect(myCoursesServiceMock.getOfficeHoursQueue).toHaveBeenCalledTimes(2);
    component.ngOnDestroy();
  }));

  it('ngOnDestroy unsubscribes timer', fakeAsync(() => {
    component.ngOnInit();
    tick(0);
    component.ngOnDestroy();
    // After destroy, advancing time should not trigger more polls
    const callsBefore = myCoursesServiceMock.getOfficeHoursQueue.mock.calls.length;
    tick(10000);
    expect(myCoursesServiceMock.getOfficeHoursQueue).toHaveBeenCalledTimes(
      callsBefore
    );
  }));

  describe('pollQueue', () => {
    it('calls getOfficeHoursQueue and updates queue signal', fakeAsync(() => {
      const queue = makeQueue({ queue: [MOCK_TICKET] });
      myCoursesServiceMock.getOfficeHoursQueue.mockReturnValue(of(queue));

      component.pollQueue();
      tick();

      expect(component.queue()).toEqual(queue);
    }));
  });

  describe('handleNotification', () => {
    it('notifies when queue has new ticket and no active ticket', fakeAsync(() => {
      const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
      component.queue.set(makeQueue({ queue: [] }));

      const newQueue = makeQueue({ queue: [MOCK_TICKET] });
      component.handleNotification(newQueue);

      expect(playSpy).toHaveBeenCalled();

      component.titleFlashTimer?.unsubscribe();
    }));

    it('notifies when old queue was undefined and new queue has tickets', fakeAsync(() => {
      const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
      component.queue.set(undefined);

      const newQueue = makeQueue({ queue: [MOCK_TICKET] });
      component.handleNotification(newQueue);

      expect(playSpy).toHaveBeenCalled();
      component.titleFlashTimer?.unsubscribe();
    }));

    it('notifies when new queue has ticket not in old queue', fakeAsync(() => {
      const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
      const oldTicket: OfficeHourTicketOverview = { ...MOCK_TICKET, id: 1 };
      const newTicket: OfficeHourTicketOverview = { ...MOCK_TICKET, id: 2 };

      component.queue.set(makeQueue({ queue: [oldTicket] }));

      const newQueue = makeQueue({ queue: [oldTicket, newTicket] });
      component.handleNotification(newQueue);

      expect(playSpy).toHaveBeenCalled();
      component.titleFlashTimer?.unsubscribe();
    }));

    it('does NOT notify when active ticket is already present', fakeAsync(() => {
      const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
      component.queue.set(makeQueue());

      const newQueue = makeQueue({
        active: MOCK_TICKET,
        queue: [MOCK_TICKET]
      });
      component.handleNotification(newQueue);

      expect(playSpy).not.toHaveBeenCalled();
    }));

    it('does NOT notify when queue is empty', fakeAsync(() => {
      const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
      component.queue.set(makeQueue());

      component.handleNotification(makeQueue({ queue: [] }));

      expect(playSpy).not.toHaveBeenCalled();
    }));

    it('does NOT notify when all new tickets were already in old queue', fakeAsync(() => {
      const playSpy = jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
      component.queue.set(makeQueue({ queue: [MOCK_TICKET] }));

      component.handleNotification(makeQueue({ queue: [MOCK_TICKET] }));

      expect(playSpy).not.toHaveBeenCalled();
    }));

    it('resets title and unsubscribes flash timer when notify=false', fakeAsync(() => {
      const setTitleSpy = jest.spyOn(titleService, 'setTitle');
      const mockFlashSub = { unsubscribe: jest.fn() };
      component.titleFlashTimer = mockFlashSub as any;

      component.handleNotification(makeQueue({ queue: [] }));

      expect(mockFlashSub.unsubscribe).toHaveBeenCalled();
      expect(setTitleSpy).toHaveBeenCalledWith('Office Hours Queue');
    }));

    it('flashes title when notifying', fakeAsync(() => {
      const setTitleSpy = jest.spyOn(titleService, 'setTitle');
      jest.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

      component.queue.set(makeQueue({ queue: [] }));
      component.handleNotification(makeQueue({ queue: [MOCK_TICKET] }));

      tick(0);
      expect(setTitleSpy).toHaveBeenCalled();

      component.titleFlashTimer?.unsubscribe();
    }));
  });

  describe('callTicket', () => {
    it('calls callTicket service and then pollQueue on success', fakeAsync(() => {
      component.callTicket(MOCK_TICKET);
      tick();
      expect(myCoursesServiceMock.callTicket).toHaveBeenCalledWith(
        MOCK_TICKET.id
      );
      expect(myCoursesServiceMock.getOfficeHoursQueue).toHaveBeenCalled();
    }));

    it('shows snackBar on error with error message', () => {
      myCoursesServiceMock.callTicket.mockReturnValue(
        throwError(() => ({ error: { message: 'Call failed' } }))
      );

      component.callTicket(MOCK_TICKET);

      expect(snackBarMock.open).toHaveBeenCalledWith('Call failed', '', {
        duration: 2000
      });
    });

    it('shows fallback snackBar message when no error.message', () => {
      myCoursesServiceMock.callTicket.mockReturnValue(
        throwError(() => ({ error: {} }))
      );

      component.callTicket(MOCK_TICKET);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Error calling ticket',
        '',
        { duration: 2000 }
      );
    });
  });

  describe('cancelTicket', () => {
    it('calls cancelTicket service and pollQueue on success', fakeAsync(() => {
      component.cancelTicket(MOCK_TICKET);
      tick();
      expect(myCoursesServiceMock.cancelTicket).toHaveBeenCalledWith(
        MOCK_TICKET.id
      );
      expect(myCoursesServiceMock.getOfficeHoursQueue).toHaveBeenCalled();
    }));

    it('shows snackBar on error', () => {
      myCoursesServiceMock.cancelTicket.mockReturnValue(
        throwError(() => 'Cancel error')
      );

      component.cancelTicket(MOCK_TICKET);

      expect(snackBarMock.open).toHaveBeenCalledWith('Cancel error', '', {
        duration: 2000
      });
    });
  });

  describe('closeTicket', () => {
    it('opens CloseTicketDialog with ticket id', () => {
      component.closeTicket(MOCK_TICKET);

      expect(dialogMock.open).toHaveBeenCalledWith(
        CloseTicketDialog,
        (expect as any).objectContaining({ data: MOCK_TICKET.id })
      );
    });

    it('calls pollQueue after dialog closes', fakeAsync(() => {
      const afterClosedSubject = new Subject<undefined>();
      dialogMock.open.mockReturnValue({
        afterClosed: () => afterClosedSubject.asObservable()
      } as any);

      component.closeTicket(MOCK_TICKET);
      afterClosedSubject.next(undefined);
      afterClosedSubject.complete();
      tick();

      expect(myCoursesServiceMock.getOfficeHoursQueue).toHaveBeenCalled();
    }));
  });
});
