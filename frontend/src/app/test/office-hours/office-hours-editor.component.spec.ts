/**
 * Tests for OfficeHoursEditorComponent.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';

import { OfficeHoursEditorComponent } from '../../my-courses/course/office-hours/office-hours-editor/office-hours-editor.component';
import { MyCoursesService, Weekday } from '../../my-courses/my-courses.service';
import { OfficeHours } from '../../my-courses/my-courses.model';

const VIRTUAL_ROOM = { id: 'Virtual', nickname: 'Virtual', building: '', room: '' };
const ROOM_1 = { id: 'SN 0115', nickname: 'SN 0115', building: 'Sitterson', room: '0115' };

const BASE_OH: OfficeHours = {
  id: -1,
  type: 0,
  mode: 0,
  description: '',
  location_description: '',
  start_time: new Date('2024-03-01T10:00:00'),
  end_time: new Date('2024-03-01T12:00:00'),
  course_site_id: 42,
  room_id: '',
  recurrence_pattern_id: null,
  recurrence_pattern: null
};

const EXISTING_OH: OfficeHours = {
  ...BASE_OH,
  id: 7,
  room_id: 'SN 0115'
};

function buildTestBed(officeHours: OfficeHours, extraProviders: any[] = []) {
  const myCoursesServiceMock = {
    currentTerms: jest.fn(() => [{ end: new Date('2025-05-10') }]),
    createOfficeHours: jest.fn(() => of(officeHours)),
    updateOfficeHours: jest.fn(() => of(officeHours)),
    createRecurringOfficeHours: jest.fn(() => of([officeHours])),
    updateRecurringOfficeHours: jest.fn(() => of([officeHours]))
  };

  const routerMock = { navigate: jest.fn() };
  const snackBarMock = { open: jest.fn() };

  TestBed.configureTestingModule({
    declarations: [OfficeHoursEditorComponent],
    imports: [ReactiveFormsModule],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      DatePipe,
      { provide: MyCoursesService, useValue: myCoursesServiceMock },
      { provide: Router, useValue: routerMock },
      { provide: MatSnackBar, useValue: snackBarMock },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: { officeHours, rooms: [VIRTUAL_ROOM, ROOM_1] },
            params: { event_id: String(officeHours.id) }
          },
          parent: { snapshot: { params: { course_site_id: '42' } } }
        }
      },
      ...extraProviders
    ],
    schemas: [NO_ERRORS_SCHEMA]
  });

  return { myCoursesServiceMock, routerMock, snackBarMock };
}

describe('OfficeHoursEditorComponent (new)', () => {
  let component: OfficeHoursEditorComponent;
  let fixture: ComponentFixture<OfficeHoursEditorComponent>;
  let myCoursesServiceMock: any;
  let routerMock: any;
  let snackBarMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mocks = buildTestBed(BASE_OH);
    myCoursesServiceMock = mocks.myCoursesServiceMock;
    routerMock = mocks.routerMock;
    snackBarMock = mocks.snackBarMock;

    fixture = TestBed.createComponent(OfficeHoursEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('isNew() returns true for id = -1', () => {
    expect(component.isNew()).toBe(true);
  });

  it('action() returns "Created" for new', () => {
    expect(component.action()).toBe('Created');
  });

  it('filteredRooms defaults to all rooms', () => {
    expect(component.filteredRooms).toEqual([VIRTUAL_ROOM, ROOM_1]);
  });

  it('virtualRoom is identified from rooms', () => {
    expect(component.virtualRoom).toEqual(VIRTUAL_ROOM);
  });

  it('toggleDay flips the day boolean', () => {
    expect(component.days[Weekday.Monday]).toBe(false);
    component.toggleDay(Weekday.Monday);
    expect(component.days[Weekday.Monday]).toBe(true);
    component.toggleDay(Weekday.Monday);
    expect(component.days[Weekday.Monday]).toBe(false);
  });

  it('maintainOriginalOrder returns 0', () => {
    expect(component.maintainOriginalOrder()).toBe(0);
  });

  it('numberToType maps correctly', () => {
    expect(component.numberToType(0)).toBe('Office Hours');
    expect(component.numberToType(1)).toBe('Tutoring');
    expect(component.numberToType(2)).toBe('Review Session');
    expect(component.numberToType(99)).toBe('');
  });

  it('numberToMode maps correctly', () => {
    expect(component.numberToMode(0)).toBe('In-Person');
    expect(component.numberToMode(1)).toBe('Virtual - Student Link');
    expect(component.numberToMode(2)).toBe('Virtual - Our Link');
    expect(component.numberToMode(99)).toBe('');
  });

  describe('dateRangeValidator', () => {
    it('returns null when start < end', () => {
      component.officeHoursForm.patchValue({
        start_time: '2024-03-01T10:00',
        end_time: '2024-03-01T12:00'
      });
      const result = component.dateRangeValidator(component.officeHoursForm);
      expect(result).toBeNull();
    });

    it('returns error when start >= end', () => {
      component.officeHoursForm.patchValue({
        start_time: '2024-03-01T12:00',
        end_time: '2024-03-01T10:00'
      });
      const result = component.dateRangeValidator(component.officeHoursForm);
      expect(result).toEqual({ dateRangeInvalid: true });
    });
  });

  describe('genericDateRangeValidator', () => {
    it('returns null when valid', () => {
      component.officeHoursForm.patchValue({
        start_time: '2024-03-01T10:00',
        end_time: '2024-03-01T12:00'
      });
      const validator = component.genericDateRangeValidator(
        'start_time',
        'end_time'
      );
      expect(validator(component.officeHoursForm)).toBeNull();
    });

    it('returns dateRangeInvalid for non-recur_end', () => {
      component.officeHoursForm.patchValue({
        start_time: '2024-03-01T12:00',
        end_time: '2024-03-01T10:00'
      });
      const validator = component.genericDateRangeValidator(
        'start_time',
        'end_time'
      );
      expect(validator(component.officeHoursForm)).toEqual({
        dateRangeInvalid: true
      });
    });

    it('returns recurEndDateInvalid for recur_end label', () => {
      component.officeHoursForm.patchValue({
        end_time: '2024-03-15T12:00',
        recur_end: '2024-03-01'
      });
      const validator = component.genericDateRangeValidator(
        'end_time',
        'recur_end'
      );
      expect(validator(component.officeHoursForm)).toEqual({
        recurEndDateInvalid: true
      });
    });
  });

  describe('modeChanged', () => {
    it('mode=0 sets room_id to empty string', () => {
      component.officeHoursForm.controls['mode'].setValue(0);
      component.modeChanged();
      expect(component.officeHoursForm.controls['room_id'].value).toBe('');
    });

    it('mode=1 sets room_id to virtual room id', () => {
      component.officeHoursForm.controls['mode'].setValue(1);
      component.modeChanged();
      expect(component.officeHoursForm.controls['room_id'].value).toBe(
        'Virtual'
      );
    });
  });

  describe('filterRooms', () => {
    it('filters rooms by input value', () => {
      component.input = { nativeElement: { value: 'SN' } } as any;
      component.filterRooms();
      expect(component.filteredRooms).toEqual([ROOM_1]);
    });

    it('returns all rooms when input is empty', () => {
      component.input = { nativeElement: { value: '' } } as any;
      component.filterRooms();
      expect(component.filteredRooms).toHaveLength(2);
    });
  });

  describe('onReset', () => {
    it('resets form to original values', () => {
      component.officeHoursForm.controls['description'].setValue('Changed');
      component.onReset();
      expect(component.officeHoursForm.controls['description'].value).toBe('');
    });
  });

  describe('onSubmit (new + non-recurring)', () => {
    it('calls createOfficeHours and navigates on success', fakeAsync(() => {
      component.officeHoursForm.patchValue({
        type: 0,
        mode: 0,
        description: '',
        location_description: '',
        start_time: '2024-03-01T10:00',
        end_time: '2024-03-01T12:00',
        room_id: 'SN 0115',
        recurs: false,
        recur_end: '2024-05-01'
      });

      myCoursesServiceMock.createOfficeHours.mockReturnValue(
        of({ ...BASE_OH, id: 99, course_site_id: 42 })
      );

      component.onSubmit();
      tick();

      expect(myCoursesServiceMock.createOfficeHours).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith([
        '/course/',
        42,
        'office-hours'
      ]);
    }));
  });

  describe('onSubmit (new + recurring)', () => {
    it('calls createRecurringOfficeHours when recurs=true', fakeAsync(() => {
      component.officeHoursForm.patchValue({
        type: 0,
        mode: 0,
        description: '',
        location_description: '',
        start_time: '2024-03-01T10:00',
        end_time: '2024-03-01T12:00',
        room_id: 'SN 0115',
        recurs: true,
        recur_end: '2024-05-01'
      });

      myCoursesServiceMock.createRecurringOfficeHours.mockReturnValue(
        of([{ ...BASE_OH, id: 99, course_site_id: 42 }])
      );

      component.onSubmit();
      tick();

      expect(myCoursesServiceMock.createRecurringOfficeHours).toHaveBeenCalled();
    }));
  });

  describe('onSubmit error', () => {
    it('shows snackBar on error', fakeAsync(() => {
      component.officeHoursForm.patchValue({
        type: 0,
        mode: 0,
        start_time: '2024-03-01T10:00',
        end_time: '2024-03-01T12:00',
        room_id: 'SN 0115',
        recurs: false
      });

      myCoursesServiceMock.createOfficeHours.mockReturnValue(
        throwError(() => ({ error: { message: 'Bad request' } }))
      );

      component.onSubmit();
      tick();

      expect(snackBarMock.open).toHaveBeenCalledWith('Bad request', '', {
        duration: 2000
      });
    }));
  });

  it('onSubmit does nothing when form is invalid', () => {
    // Force form invalid by clearing required field
    component.officeHoursForm.controls['room_id'].setValue('');
    component.officeHoursForm.controls['room_id'].setErrors({
      required: true
    });

    component.onSubmit();

    expect(myCoursesServiceMock.createOfficeHours).not.toHaveBeenCalled();
  });
});

describe('OfficeHoursEditorComponent (existing)', () => {
  let component: OfficeHoursEditorComponent;
  let fixture: ComponentFixture<OfficeHoursEditorComponent>;
  let myCoursesServiceMock: any;
  let routerMock: any;
  let snackBarMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const mocks = buildTestBed(EXISTING_OH);
    myCoursesServiceMock = mocks.myCoursesServiceMock;
    routerMock = mocks.routerMock;
    snackBarMock = mocks.snackBarMock;

    fixture = TestBed.createComponent(OfficeHoursEditorComponent);
    component = fixture.componentInstance;
  });

  it('isNew() returns false for existing id', () => {
    expect(component.isNew()).toBe(false);
  });

  it('action() returns "Updated" for existing', () => {
    expect(component.action()).toBe('Updated');
  });

  it('disables recurs and recur_end controls for existing OH', () => {
    expect(component.officeHoursForm.controls.recurs.disabled).toBe(true);
    expect(component.officeHoursForm.controls.recur_end.disabled).toBe(true);
  });

  describe('toggleUpdateRecurrencePattern', () => {
    it('enables recurs/recur_end when checked=true on existing OH', () => {
      component.toggleUpdateRecurrencePattern(true);
      expect(component.updateRecurrencePattern).toBe(true);
      expect(component.officeHoursForm.controls.recurs.disabled).toBe(false);
      expect(component.officeHoursForm.controls.recur_end.disabled).toBe(false);
    });

    it('disables recurs/recur_end when checked=false', () => {
      component.toggleUpdateRecurrencePattern(true);
      component.toggleUpdateRecurrencePattern(false);
      expect(component.updateRecurrencePattern).toBe(false);
      expect(component.officeHoursForm.controls.recurs.disabled).toBe(true);
    });
  });

  describe('onSubmit (existing + non-recurring)', () => {
    it('calls updateOfficeHours and navigates on success', fakeAsync(() => {
      component.officeHoursForm.patchValue({
        type: 0,
        mode: 0,
        description: '',
        location_description: '',
        start_time: '2024-03-01T10:00',
        end_time: '2024-03-01T12:00',
        room_id: 'SN 0115'
      });

      myCoursesServiceMock.updateOfficeHours.mockReturnValue(
        of({ ...EXISTING_OH, course_site_id: 42 })
      );

      component.onSubmit();
      tick();

      expect(myCoursesServiceMock.updateOfficeHours).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith([
        '/course/',
        42,
        'office-hours'
      ]);
    }));
  });

  describe('onSubmit (existing + updateRecurrencePattern)', () => {
    it('calls updateRecurringOfficeHours when updateRecurrencePattern=true', fakeAsync(() => {
      component.toggleUpdateRecurrencePattern(true);
      component.officeHoursForm.patchValue({
        type: 0,
        mode: 0,
        start_time: '2024-03-01T10:00',
        end_time: '2024-03-01T12:00',
        room_id: 'SN 0115',
        recur_end: '2024-05-01'
      });

      myCoursesServiceMock.updateRecurringOfficeHours.mockReturnValue(
        of([{ ...EXISTING_OH, course_site_id: 42 }])
      );

      component.onSubmit();
      tick();

      expect(
        myCoursesServiceMock.updateRecurringOfficeHours
      ).toHaveBeenCalled();
    }));
  });
});
