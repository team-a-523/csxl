/**
 * Tests for CloseTicketDialog.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { CloseTicketDialog } from '../../my-courses/course/office-hours/widgets/close-ticket-dialog/close-ticket.dialog';
import { MyCoursesService } from '../../my-courses/my-courses.service';
import { OfficeHourTicketOverview } from '../../my-courses/my-courses.model';

const MOCK_TICKET_OVERVIEW: OfficeHourTicketOverview = {
  id: 10,
  created_at: new Date(),
  called_at: new Date(),
  closed_at: undefined,
  state: 'Called',
  type: 0,
  description: 'Help needed',
  creators: [],
  caller: undefined,
  has_concerns: undefined,
  caller_notes: undefined
};

describe('CloseTicketDialog', () => {
  let component: CloseTicketDialog;
  let fixture: ComponentFixture<CloseTicketDialog>;

  const myCoursesServiceMock = {
    closeTicket: jest.fn(
      (_ticketId: number, _hasConcerns: boolean, _notes: string) =>
        of(MOCK_TICKET_OVERVIEW)
    )
  };

  const dialogRefMock = {
    close: jest.fn()
  };

  const snackBarMock = {
    open: jest.fn()
  };

  const routerMock = {
    navigate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    myCoursesServiceMock.closeTicket.mockReturnValue(of(MOCK_TICKET_OVERVIEW));

    TestBed.configureTestingModule({
      declarations: [CloseTicketDialog],
      imports: [ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MyCoursesService, useValue: myCoursesServiceMock },
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: MAT_DIALOG_DATA, useValue: 42 },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    TestBed.overrideTemplate(CloseTicketDialog, '');
    fixture = TestBed.createComponent(CloseTicketDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ticketId is injected as 42', () => {
    expect(component.ticketId).toBe(42);
  });

  it('hasConcerns defaults to false', () => {
    expect(component.hasConcerns.value).toBe(false);
  });

  it('notes defaults to empty string', () => {
    expect(component.notes.value).toBe('');
  });

  describe('close()', () => {
    it('calls dialogRef.close()', () => {
      component.close();
      expect(dialogRefMock.close).toHaveBeenCalled();
    });
  });

  describe('submit()', () => {
    it('calls closeTicket with ticketId and form values', fakeAsync(() => {
      component.hasConcerns.setValue(true);
      component.notes.setValue('Student struggled with recursion');

      component.submit();
      tick();

      expect(myCoursesServiceMock.closeTicket).toHaveBeenCalledWith(
        42,
        true,
        'Student struggled with recursion'
      );
    }));

    it('calls close() on success', fakeAsync(() => {
      component.submit();
      tick();
      expect(dialogRefMock.close).toHaveBeenCalled();
    }));

    it('defaults hasConcerns to false when null', fakeAsync(() => {
      component.hasConcerns.setValue(null);
      component.submit();
      tick();

      expect(myCoursesServiceMock.closeTicket).toHaveBeenCalledWith(
        42,
        false,
        (expect as any).any(String)
      );
    }));

    it('defaults notes to empty string when null', fakeAsync(() => {
      component.notes.setValue(null);
      component.submit();
      tick();

      expect(myCoursesServiceMock.closeTicket).toHaveBeenCalledWith(
        42,
        (expect as any).any(Boolean),
        ''
      );
    }));

    it('shows snackBar on error', () => {
      myCoursesServiceMock.closeTicket.mockReturnValue(
        throwError(() => 'Close failed')
      );

      component.submit();

      expect(snackBarMock.open).toHaveBeenCalledWith('Close failed', '', {
        duration: 2000
      });
    });

    it('does NOT call dialogRef.close() on error', () => {
      myCoursesServiceMock.closeTicket.mockReturnValue(
        throwError(() => 'Close failed')
      );

      component.submit();

      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });
  });
});
