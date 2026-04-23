import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseEditorComponent } from 'src/app/academics/academics-admin/course/course-editor/course-editor.component';
import { AcademicsService } from 'src/app/academics/academics.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Course } from 'src/app/academics/academics.models';

const mockProfile = { id: 1, first_name: 'Test', last_name: 'User' };

const mockNewCourse: Course = {
  id: '',
  subject_code: 'COMP',
  number: '523',
  title: 'Software Engineering Lab',
  description: 'Team-based software engineering.',
  credit_hours: 3,
  sections: null
};

const mockExistingCourse: Course = {
  id: 'comp523',
  subject_code: 'COMP',
  number: '523',
  title: 'Software Engineering Lab',
  description: 'Team-based software engineering.',
  credit_hours: 3,
  sections: null
};

function buildActivatedRoute(course: Course, id: string): any {
  return {
    snapshot: {
      data: { profile: mockProfile, course },
      params: { id }
    }
  };
}

describe('CourseEditorComponent', () => {
  let component: CourseEditorComponent;
  let fixture: ComponentFixture<CourseEditorComponent>;
  let academicsServiceMock: any;
  let snackBarMock: any;
  let routerMock: any;
  let activatedRouteMock: any;

  describe('when creating a new course (id = "new")', () => {
    beforeEach(async () => {
      academicsServiceMock = {
        createCourse: jest.fn().mockReturnValue(of(mockNewCourse)),
        updateCourse: jest.fn().mockReturnValue(of(mockExistingCourse))
      };

      snackBarMock = { open: jest.fn() };
      routerMock = { navigate: jest.fn() };
      activatedRouteMock = buildActivatedRoute(
        { ...mockNewCourse, id: '' },
        'new'
      );

      await TestBed.configureTestingModule({
        declarations: [CourseEditorComponent],
        imports: [ReactiveFormsModule],
        providers: [
          { provide: AcademicsService, useValue: academicsServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock },
          { provide: Router, useValue: routerMock },
          { provide: ActivatedRoute, useValue: activatedRouteMock }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      fixture = TestBed.createComponent(CourseEditorComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set courseId to "new"', () => {
      expect(component.courseId).toBe('new');
    });

    it('should populate form fields from resolved course data', () => {
      expect(component.courseForm.value).toEqual({
        subject_code: mockNewCourse.subject_code,
        number: mockNewCourse.number,
        title: mockNewCourse.title,
        description: mockNewCourse.description,
        credit_hours: mockNewCourse.credit_hours
      });
    });

    it('should call createCourse() on submit when courseId is "new"', () => {
      component.onSubmit();
      expect(academicsServiceMock.createCourse).toHaveBeenCalledTimes(1);
      expect(academicsServiceMock.updateCourse).not.toHaveBeenCalled();
    });

    it('should navigate to course admin list after successful creation', () => {
      component.onSubmit();
      expect(routerMock.navigate).toHaveBeenCalledWith([
        '/academics/admin/course'
      ]);
    });

    it('should show "Course Created" snack bar on success', () => {
      component.onSubmit();
      expect(snackBarMock.open).toHaveBeenCalledWith('Course Created', '', {
        duration: 2000
      });
    });

    it('should show "Error: Course Not Created" snack bar on error', () => {
      academicsServiceMock.createCourse.mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.onSubmit();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Error: Course Not Created',
        '',
        { duration: 2000 }
      );
    });

    it('should not call createCourse() when form is invalid', () => {
      component.courseForm.setValue({
        subject_code: '',
        number: '',
        title: '',
        description: '',
        credit_hours: 3
      });

      component.onSubmit();

      expect(academicsServiceMock.createCourse).not.toHaveBeenCalled();
    });
  });

  describe('when editing an existing course', () => {
    beforeEach(async () => {
      academicsServiceMock = {
        createCourse: jest.fn().mockReturnValue(of(mockNewCourse)),
        updateCourse: jest.fn().mockReturnValue(of(mockExistingCourse))
      };

      snackBarMock = { open: jest.fn() };
      routerMock = { navigate: jest.fn() };
      activatedRouteMock = buildActivatedRoute(
        { ...mockExistingCourse },
        mockExistingCourse.id
      );

      await TestBed.configureTestingModule({
        declarations: [CourseEditorComponent],
        imports: [ReactiveFormsModule],
        providers: [
          { provide: AcademicsService, useValue: academicsServiceMock },
          { provide: MatSnackBar, useValue: snackBarMock },
          { provide: Router, useValue: routerMock },
          { provide: ActivatedRoute, useValue: activatedRouteMock }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      }).compileComponents();

      fixture = TestBed.createComponent(CourseEditorComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set courseId to the existing course id', () => {
      expect(component.courseId).toBe(mockExistingCourse.id);
    });

    it('should populate form fields from resolved course data', () => {
      expect(component.courseForm.value).toEqual({
        subject_code: mockExistingCourse.subject_code,
        number: mockExistingCourse.number,
        title: mockExistingCourse.title,
        description: mockExistingCourse.description,
        credit_hours: mockExistingCourse.credit_hours
      });
    });

    it('should call updateCourse() on submit when editing an existing course', () => {
      component.onSubmit();
      expect(academicsServiceMock.updateCourse).toHaveBeenCalledTimes(1);
      expect(academicsServiceMock.createCourse).not.toHaveBeenCalled();
    });

    it('should navigate to course admin list after successful update', () => {
      component.onSubmit();
      expect(routerMock.navigate).toHaveBeenCalledWith([
        '/academics/admin/course'
      ]);
    });

    it('should show "Course Updated" snack bar on success', () => {
      component.onSubmit();
      expect(snackBarMock.open).toHaveBeenCalledWith('Course Updated', '', {
        duration: 2000
      });
    });

    it('should show "Error: Course Not Updated" snack bar on error', () => {
      academicsServiceMock.updateCourse.mockReturnValue(
        throwError(() => new Error('Server error'))
      );

      component.onSubmit();

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Error: Course Not Updated',
        '',
        { duration: 2000 }
      );
    });
  });
});
