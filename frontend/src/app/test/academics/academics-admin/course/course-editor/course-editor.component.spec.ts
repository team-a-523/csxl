import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { CourseEditorComponent } from 'src/app/academics/academics-admin/course/course-editor/course-editor.component';
import { AcademicsService } from 'src/app/academics/academics.service';

const MOCK_PROFILE = { onyen: 'admin' };
const MOCK_COURSE = {
  id: 'COMP110',
  subject_code: 'COMP',
  number: '110',
  title: 'Intro',
  description: 'Foundations',
  credit_hours: 3,
  sections: null
};

describe('CourseEditorComponent', () => {
  let fixture: ComponentFixture<CourseEditorComponent>;
  let component: CourseEditorComponent;
  let routerMock: { navigate: jest.Mock };
  let snackBarMock: { open: jest.Mock };
  let academicsServiceMock: {
    createCourse: jest.Mock;
    updateCourse: jest.Mock;
  };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    snackBarMock = { open: jest.fn() };
    academicsServiceMock = {
      createCourse: jest.fn().mockReturnValue(of(MOCK_COURSE)),
      updateCourse: jest.fn().mockReturnValue(of(MOCK_COURSE))
    };

    await TestBed.configureTestingModule({
      declarations: [CourseEditorComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AcademicsService, useValue: academicsServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { profile: MOCK_PROFILE, course: MOCK_COURSE },
              params: { id: 'COMP110' }
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseEditorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.courseForm.value.subject_code).toBe('COMP');
  });

  it('onSubmit updates existing course', () => {
    component.courseId = 'COMP110';
    component.courseForm.setValue({
      subject_code: 'COMP',
      number: '110',
      title: 'Updated Intro',
      description: 'Updated',
      credit_hours: 3
    });

    component.onSubmit();

    expect(academicsServiceMock.updateCourse).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/academics/admin/course']);
    expect(snackBarMock.open).toHaveBeenCalledWith('Course Updated', '', {
      duration: 2000
    });
  });

  it('onSubmit creates new course and generates id', () => {
    component.courseId = 'new';
    component.course = { ...MOCK_COURSE, id: '' };
    component.courseForm.setValue({
      subject_code: 'COMP',
      number: '210',
      title: 'Data Structures',
      description: 'DS',
      credit_hours: 3
    });

    component.onSubmit();

    expect(component.course.id).toBe('comp210');
    expect(academicsServiceMock.createCourse).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith('Course Created', '', {
      duration: 2000
    });
  });

  it('onSubmit shows error snackbar when create fails', () => {
    component.courseId = 'new';
    academicsServiceMock.createCourse.mockReturnValueOnce(
      throwError(() => new Error('create failed'))
    );
    component.course = { ...MOCK_COURSE, id: '' };
    component.courseForm.setValue({
      subject_code: 'COMP',
      number: '210',
      title: 'Data Structures',
      description: 'DS',
      credit_hours: 3
    });

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('Error: Course Not Created', '', {
      duration: 2000
    });
  });
});
