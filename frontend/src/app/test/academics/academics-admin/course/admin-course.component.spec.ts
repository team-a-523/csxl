import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminCourseComponent } from 'src/app/academics/academics-admin/course/admin-course.component';
import { AcademicsService } from 'src/app/academics/academics.service';

const MOCK_COURSE = {
  id: 'COMP110',
  subject_code: 'COMP',
  number: '110',
  title: 'Intro',
  description: 'Foundations',
  credit_hours: 3,
  sections: null
};

describe('AdminCourseComponent', () => {
  let fixture: ComponentFixture<AdminCourseComponent>;
  let component: AdminCourseComponent;
  let routerMock: { navigate: jest.Mock };
  let snackBarMock: { open: jest.Mock };
  let academicsServiceMock: {
    getCourses: jest.Mock;
    deleteCourse: jest.Mock;
  };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    snackBarMock = { open: jest.fn() };
    academicsServiceMock = {
      getCourses: jest.fn().mockReturnValue(of([MOCK_COURSE])),
      deleteCourse: jest.fn().mockReturnValue(of({}))
    };
    snackBarMock.open.mockReturnValue({ onAction: jest.fn().mockReturnValue(of(true)) });

    await TestBed.configureTestingModule({
      declarations: [AdminCourseComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AcademicsService, useValue: academicsServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCourseComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.courses()).toHaveLength(1);
  });

  it('createCourse and updateCourse navigate to editor routes', () => {
    component.createCourse();
    component.updateCourse(MOCK_COURSE);

    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'course',
      'edit',
      'new'
    ]);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'course',
      'edit',
      'COMP110'
    ]);
  });

  it('deleteCourse removes course and shows success snackbar', () => {
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.deleteCourse(MOCK_COURSE, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(academicsServiceMock.deleteCourse).toHaveBeenCalledWith(MOCK_COURSE);
    expect(component.courses()).toEqual([]);
    expect(snackBarMock.open).toHaveBeenCalledWith('This course has been deleted.', '', {
      duration: 2000
    });
  });

  it('deleteCourse shows error snackbar when API fails', () => {
    academicsServiceMock.deleteCourse.mockReturnValueOnce(
      throwError(() => new Error('delete failed'))
    );

    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.deleteCourse(MOCK_COURSE, event);

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Delete failed. Make sure to remove all sections for this course first.',
      '',
      { duration: 2000 }
    );
  });
});
