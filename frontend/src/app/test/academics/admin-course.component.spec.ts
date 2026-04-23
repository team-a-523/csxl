import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AdminCourseComponent } from 'src/app/academics/academics-admin/course/admin-course.component';
import { AcademicsService } from 'src/app/academics/academics.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Course } from 'src/app/academics/academics.models';

const mockCourses: Course[] = [
  {
    id: 'COMP523',
    subject_code: 'COMP',
    number: '523',
    title: 'Software Engineering Lab',
    description: 'Team-based software engineering.',
    credit_hours: 3,
    sections: null
  },
  {
    id: 'COMP426',
    subject_code: 'COMP',
    number: '426',
    title: 'Modern Web Programming',
    description: 'Full-stack web development.',
    credit_hours: 3,
    sections: null
  }
];

describe('AdminCourseComponent', () => {
  let component: AdminCourseComponent;
  let fixture: ComponentFixture<AdminCourseComponent>;
  let academicsServiceMock: any;
  let snackBarMock: any;
  let routerMock: any;

  beforeEach(async () => {
    academicsServiceMock = {
      getCourses: jest.fn().mockReturnValue(of(mockCourses)),
      deleteCourse: jest.fn((_course: Course) => of(void 0))
    };

    snackBarMock = {
      open: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [AdminCourseComponent],
      providers: [
        { provide: AcademicsService, useValue: academicsServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getCourses() on construction', () => {
    expect(academicsServiceMock.getCourses).toHaveBeenCalledTimes(1);
  });

  it('should populate courses signal when getCourses succeeds', () => {
    expect(component.courses()).toEqual(mockCourses);
  });

  it('should leave courses empty when getCourses returns an empty list', async () => {
    academicsServiceMock.getCourses.mockReturnValue(of([]));

    fixture = TestBed.createComponent(AdminCourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.courses()).toEqual([]);
  });

  it('should throw when getCourses fails during component initialization', () => {
    academicsServiceMock.getCourses.mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    expect(() => {
      fixture = TestBed.createComponent(AdminCourseComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    }).toThrow('Network error');
  });

  it('should navigate to new course editor when createCourse() is called', () => {
    component.createCourse();
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'course',
      'edit',
      'new'
    ]);
  });

  it('should navigate to course editor with course id when updateCourse() is called', () => {
    component.updateCourse(mockCourses[0]);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'course',
      'edit',
      mockCourses[0].id
    ]);
  });

  describe('deleteCourse()', () => {
    let event: Event;

    beforeEach(() => {
      const snackBarRef = { onAction: jest.fn().mockReturnValue(of(void 0)) };
      snackBarMock.open.mockReturnValue(snackBarRef);
      event = { stopPropagation: jest.fn() } as unknown as Event;
    });

    it('should open a snack bar confirmation when deleteCourse() is called', () => {
      component.deleteCourse(mockCourses[0], event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Are you sure you want to delete this course?',
        'Delete'
      );
    });

    it('should call academicsService.deleteCourse() when delete is confirmed', () => {
      component.deleteCourse(mockCourses[0], event);

      expect(academicsServiceMock.deleteCourse).toHaveBeenCalledWith(
        mockCourses[0]
      );
    });

    it('should remove the deleted course from the courses signal', () => {
      component.deleteCourse(mockCourses[0], event);

      const remaining = component.courses();
      expect(remaining).not.toContainEqual(mockCourses[0]);
      expect(remaining).toContainEqual(mockCourses[1]);
    });

    it('should show a success snack bar after deletion', () => {
      component.deleteCourse(mockCourses[0], event);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'This course has been deleted.',
        '',
        { duration: 2000 }
      );
    });

    it('should show an error snack bar when deletion fails', () => {
      academicsServiceMock.deleteCourse.mockReturnValue(
        throwError(() => new Error('Delete failed'))
      );

      component.deleteCourse(mockCourses[0], event);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Delete failed. Make sure to remove all sections for this course first.',
        '',
        { duration: 2000 }
      );
    });

    it('should not call deleteCourse when confirmation is dismissed', () => {
      snackBarMock.open.mockReturnValue({
        onAction: jest.fn().mockReturnValue(of())
      });

      component.deleteCourse(mockCourses[0], event);

      expect(academicsServiceMock.deleteCourse).not.toHaveBeenCalled();
    });
  });
});
