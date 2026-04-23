import { DatePipe } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { SectionEditorComponent } from 'src/app/academics/academics-admin/section/section-editor/section-editor.component';
import { AcademicsService } from 'src/app/academics/academics.service';
import { RosterRole } from 'src/app/academics/academics.models';

const MOCK_PROFILE = { onyen: 'admin' };
const MOCK_TERM = {
  id: '24F',
  name: 'Fall 2024',
  start: new Date('2024-08-15'),
  end: new Date('2024-12-15'),
  applications_open: new Date('2024-03-01'),
  applications_close: new Date('2024-04-01')
};
const MOCK_COURSE = {
  id: 'COMP110',
  subject_code: 'COMP',
  number: '110',
  title: 'Intro',
  description: 'Foundations',
  credit_hours: 3,
  sections: null
};
const MOCK_ROOM = {
  id: 'SN014',
  nickname: 'Sitterson 014',
  building: 'SN',
  room: '014',
  capacity: 100,
  reservable: true,
  seats: []
};
const MOCK_SECTION = {
  id: 1,
  course_id: 'COMP110',
  number: '001',
  term_id: '24F',
  meeting_pattern: 'MWF',
  course: null,
  term: null,
  staff: [
    {
      id: 1,
      user_id: 99,
      first_name: 'Ada',
      last_name: 'Lovelace',
      pronouns: 'she/her',
      member_role: RosterRole.INSTRUCTOR
    }
  ],
  lecture_room: MOCK_ROOM,
  office_hour_rooms: [],
  override_title: '',
  override_description: '',
  enrolled: 80,
  total_seats: 100
};

describe('SectionEditorComponent', () => {
  let fixture: ComponentFixture<SectionEditorComponent>;
  let component: SectionEditorComponent;
  let routerMock: { navigate: jest.Mock };
  let snackBarMock: { open: jest.Mock };
  let academicsServiceMock: {
    createSection: jest.Mock;
    updateSection: jest.Mock;
  };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    snackBarMock = { open: jest.fn() };
    academicsServiceMock = {
      createSection: jest.fn().mockReturnValue(of(MOCK_SECTION)),
      updateSection: jest.fn().mockReturnValue(of(MOCK_SECTION))
    };

    await TestBed.configureTestingModule({
      declarations: [SectionEditorComponent],
      imports: [ReactiveFormsModule],
      providers: [
        DatePipe,
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AcademicsService, useValue: academicsServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                profile: MOCK_PROFILE,
                section: MOCK_SECTION,
                terms: [MOCK_TERM],
                courses: [MOCK_COURSE],
                rooms: [MOCK_ROOM]
              },
              params: { id: '1' }
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SectionEditorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.sectionForm.value.number).toBe('001');
  });

  it('onSubmit updates existing section', () => {
    component.sectionIdString = '1';
    component.term.setValue(MOCK_TERM);
    component.course.setValue(MOCK_COURSE);
    component.room.setValue(MOCK_ROOM);

    component.onSubmit();

    expect(academicsServiceMock.updateSection).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/academics/admin/section']);
    expect(snackBarMock.open).toHaveBeenCalledWith('Section Updated', '', {
      duration: 2000
    });
  });

  it('onSubmit creates new section', () => {
    component.sectionIdString = 'new';
    component.term.setValue(MOCK_TERM);
    component.course.setValue(MOCK_COURSE);
    component.room.setValue(MOCK_ROOM);

    component.onSubmit();

    expect(academicsServiceMock.createSection).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith('Section Created', '', {
      duration: 2000
    });
  });

  it('onSubmit shows error snackbar on update failure', () => {
    component.sectionIdString = '1';
    component.term.setValue(MOCK_TERM);
    component.course.setValue(MOCK_COURSE);
    component.room.setValue(MOCK_ROOM);
    academicsServiceMock.updateSection.mockReturnValueOnce(
      throwError(() => new Error('update failed'))
    );

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('Error: Section Not Updated', '', {
      duration: 2000
    });
  });
});
