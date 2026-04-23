import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SectionEditorComponent } from 'src/app/academics/academics-admin/section/section-editor/section-editor.component';
import { AcademicsService } from 'src/app/academics/academics.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Course,
  Room,
  RosterRole,
  Section,
  Term
} from 'src/app/academics/academics.models';

const mockProfile = { id: 1, first_name: 'Test', last_name: 'User' };

const mockTerms: Term[] = [
  {
    id: 'SP26',
    name: 'Spring 2026',
    start: new Date('2026-01-14'),
    end: new Date('2026-05-06'),
    applications_open: new Date('2025-10-01'),
    applications_close: new Date('2025-11-01')
  }
];

const mockCourses: Course[] = [
  {
    id: 'comp523',
    subject_code: 'COMP',
    number: '523',
    title: 'Software Engineering Lab',
    description: 'Team-based software engineering.',
    credit_hours: 3,
    sections: null
  }
];

const mockRooms: Room[] = [
  {
    id: 'SN0115',
    nickname: 'Sitterson 115',
    building: 'Sitterson',
    room: '0115',
    capacity: 30,
    reservable: false,
    seats: null
  }
];

const mockNewSection: Section = {
  id: null,
  course_id: '',
  number: '',
  term_id: '',
  meeting_pattern: '',
  course: null,
  term: null,
  staff: null,
  lecture_room: null,
  office_hour_rooms: null,
  override_title: '',
  override_description: '',
  enrolled: 0,
  total_seats: 0
};

const mockExistingSection: Section = {
  id: 1,
  course_id: 'comp523',
  number: '001',
  term_id: 'SP26',
  meeting_pattern: 'MWF 10:00-10:50',
  course: null,
  term: null,
  staff: [
    {
      id: 10,
      user_id: 42,
      first_name: 'Jane',
      last_name: 'Doe',
      pronouns: 'she/her',
      member_role: RosterRole.INSTRUCTOR
    }
  ],
  lecture_room: mockRooms[0],
  office_hour_rooms: null,
  override_title: '',
  override_description: '',
  enrolled: 10,
  total_seats: 30
};

const mockExistingSectionWithOverride: Section = {
  ...mockExistingSection,
  override_title: 'Custom Title',
  override_description: 'Custom Description'
};

function buildActivatedRoute(section: Section, id: string): any {
  return {
    snapshot: {
      data: {
        profile: mockProfile,
        section,
        terms: mockTerms,
        courses: mockCourses,
        rooms: mockRooms
      },
      params: { id }
    }
  };
}

function fillValidForm(cmp: SectionEditorComponent): void {
  cmp.term.setValue(mockTerms[0]);
  cmp.course.setValue(mockCourses[0]);
  cmp.room.setValue(mockRooms[0]);
  cmp.sectionForm.setValue({
    number: '001',
    meeting_pattern: 'MWF 10:00-10:50',
    override_title: '',
    override_description: ''
  });
}

describe('SectionEditorComponent', () => {
  let component: SectionEditorComponent;
  let fixture: ComponentFixture<SectionEditorComponent>;
  let academicsServiceMock: any;
  let snackBarMock: any;
  let routerMock: any;
  let activatedRouteMock: any;

  describe('when creating a new section (id = "new")', () => {
    beforeEach(async () => {
      academicsServiceMock = {
        createSection: jest.fn().mockReturnValue(of(mockNewSection)),
        updateSection: jest.fn().mockReturnValue(of(mockExistingSection))
      };

      snackBarMock = { open: jest.fn() };
      routerMock = { navigate: jest.fn() };
      activatedRouteMock = buildActivatedRoute({ ...mockNewSection }, 'new');

      await TestBed.configureTestingModule({
        declarations: [SectionEditorComponent],
        imports: [ReactiveFormsModule],
        providers: [
          { provide: AcademicsService, useValue: academicsServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock },
          { provide: Router, useValue: routerMock },
          { provide: ActivatedRoute, useValue: activatedRouteMock },
          { provide: DatePipe, useValue: { transform: jest.fn() } }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      fixture = TestBed.createComponent(SectionEditorComponent);
      component = fixture.componentInstance;
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set sectionIdString to "new"', () => {
      expect(component.sectionIdString).toBe('new');
    });

    it('should populate sectionForm fields from resolved section data', () => {
      expect(component.sectionForm.value).toEqual({
        number: '',
        meeting_pattern: '',
        override_title: '',
        override_description: ''
      });
    });

    it('should leave term, course, and room controls null when no match exists', () => {
      expect(component.term.value).toBeNull();
      expect(component.course.value).toBeNull();
      expect(component.room.value).toBeNull();
    });

    it('should initialize instructors as empty when staff is null', () => {
      expect(component.instructors).toEqual([]);
    });

    it('should not set override flag when override fields are empty', () => {
      expect(component.override.value).toBe(false);
    });

    it('should call createSection() on submit when sectionIdString is "new"', () => {
      fillValidForm(component);
      component.onSubmit();

      expect(academicsServiceMock.createSection).toHaveBeenCalledTimes(1);
      expect(academicsServiceMock.updateSection).not.toHaveBeenCalled();
    });

    it('should navigate to section admin list after successful creation', () => {
      fillValidForm(component);
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith([
        '/academics/admin/section'
      ]);
    });

    it('should show "Section Created" snack bar on success', () => {
      fillValidForm(component);
      component.onSubmit();

      expect(snackBarMock.open).toHaveBeenCalledWith('Section Created', '', {
        duration: 2000
      });
    });

    it('should show "Error: Section Not Created" snack bar on error', () => {
      academicsServiceMock.createSection.mockReturnValue(
        throwError(() => new Error('Server error'))
      );
      fillValidForm(component);
      component.onSubmit();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Error: Section Not Created',
        '',
        { duration: 2000 }
      );
    });

    it('should not call createSection() when form is invalid', () => {
      component.sectionForm.setValue({
        number: '',
        meeting_pattern: '',
        override_title: '',
        override_description: ''
      });

      component.onSubmit();

      expect(academicsServiceMock.createSection).not.toHaveBeenCalled();
    });
  });

  describe('when editing an existing section', () => {
    beforeEach(async () => {
      academicsServiceMock = {
        createSection: jest.fn().mockReturnValue(of(mockNewSection)),
        updateSection: jest.fn().mockReturnValue(of(mockExistingSection))
      };

      snackBarMock = { open: jest.fn() };
      routerMock = { navigate: jest.fn() };
      activatedRouteMock = buildActivatedRoute(
        { ...mockExistingSection },
        String(mockExistingSection.id)
      );

      await TestBed.configureTestingModule({
        declarations: [SectionEditorComponent],
        imports: [ReactiveFormsModule],
        providers: [
          { provide: AcademicsService, useValue: academicsServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock },
          { provide: Router, useValue: routerMock },
          { provide: ActivatedRoute, useValue: activatedRouteMock },
          { provide: DatePipe, useValue: { transform: jest.fn() } }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      fixture = TestBed.createComponent(SectionEditorComponent);
      component = fixture.componentInstance;
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set sectionIdString to the existing section id', () => {
      expect(component.sectionIdString).toBe(String(mockExistingSection.id));
    });

    it('should populate sectionForm fields from resolved section data', () => {
      expect(component.sectionForm.value).toEqual({
        number: mockExistingSection.number,
        meeting_pattern: mockExistingSection.meeting_pattern,
        override_title: mockExistingSection.override_title,
        override_description: mockExistingSection.override_description
      });
    });

    it('should pre-select term, course, and room controls from resolved data', () => {
      expect(component.term.value).toEqual(mockTerms[0]);
      expect(component.course.value).toEqual(mockCourses[0]);
      expect(component.room.value).toEqual(mockRooms[0]);
    });

    it('should populate instructors from staff with INSTRUCTOR role', () => {
      expect(component.instructors).toHaveLength(1);
      expect(component.instructors[0].first_name).toBe('Jane');
      expect(component.instructors[0].last_name).toBe('Doe');
    });

    it('should call updateSection() on submit when editing an existing section', () => {
      component.onSubmit();

      expect(academicsServiceMock.updateSection).toHaveBeenCalledTimes(1);
      expect(academicsServiceMock.createSection).not.toHaveBeenCalled();
    });

    it('should navigate to section admin list after successful update', () => {
      component.onSubmit();

      expect(routerMock.navigate).toHaveBeenCalledWith([
        '/academics/admin/section'
      ]);
    });

    it('should show "Section Updated" snack bar on success', () => {
      component.onSubmit();

      expect(snackBarMock.open).toHaveBeenCalledWith('Section Updated', '', {
        duration: 2000
      });
    });

    it('should show "Error: Section Not Updated" snack bar on error', () => {
      academicsServiceMock.updateSection.mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.onSubmit();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Error: Section Not Updated',
        '',
        { duration: 2000 }
      );
    });
  });

  describe('override flag behavior', () => {
    beforeEach(async () => {
      academicsServiceMock = {
        createSection: jest.fn().mockReturnValue(of(mockNewSection)),
        updateSection: jest.fn().mockReturnValue(of(mockExistingSection))
      };

      snackBarMock = { open: jest.fn() };
      routerMock = { navigate: jest.fn() };
      activatedRouteMock = buildActivatedRoute(
        { ...mockExistingSectionWithOverride },
        String(mockExistingSectionWithOverride.id)
      );

      await TestBed.configureTestingModule({
        declarations: [SectionEditorComponent],
        imports: [ReactiveFormsModule],
        providers: [
          { provide: AcademicsService, useValue: academicsServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock },
          { provide: Router, useValue: routerMock },
          { provide: ActivatedRoute, useValue: activatedRouteMock },
          { provide: DatePipe, useValue: { transform: jest.fn() } }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      fixture = TestBed.createComponent(SectionEditorComponent);
      component = fixture.componentInstance;
    });

    it('should set override flag to true when override fields are populated', () => {
      expect(component.override.value).toBe(true);
    });

    it('should clear override fields when override flag is turned off', () => {
      component.override.setValue(false);

      expect(component.override_title.value).toBe('');
      expect(component.override_description.value).toBe('');
    });
  });
});
