import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminSectionComponent } from 'src/app/academics/academics-admin/section/admin-section.component';
import { AcademicsService } from 'src/app/academics/academics.service';

const MOCK_TERM = {
  id: '24F',
  name: 'Fall 2024',
  start: new Date('2024-08-15'),
  end: new Date('2024-12-15'),
  applications_open: new Date('2024-03-01'),
  applications_close: new Date('2024-04-01')
};

const MOCK_CATALOG_SECTION = {
  id: 1,
  subject_code: 'COMP',
  course_number: '110',
  section_number: '001',
  title: 'Intro',
  meeting_pattern: 'MWF',
  description: 'Foundations',
  lecture_room: null,
  instructors: [],
  enrolled: 80,
  total_seats: 100
};

const MOCK_SECTION = {
  id: 1,
  course_id: 'COMP110',
  number: '001',
  term_id: '24F',
  meeting_pattern: 'MWF',
  course: null,
  term: null,
  staff: [],
  lecture_room: null,
  office_hour_rooms: [],
  override_title: '',
  override_description: '',
  enrolled: 80,
  total_seats: 100
};

describe('AdminSectionComponent', () => {
  let fixture: ComponentFixture<AdminSectionComponent>;
  let component: AdminSectionComponent;
  let routerMock: { navigate: jest.Mock };
  let snackBarMock: { open: jest.Mock };
  let academicsServiceMock: {
    getSectionsByTerm: jest.Mock;
    deleteSection: jest.Mock;
  };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    snackBarMock = { open: jest.fn() };
    academicsServiceMock = {
      getSectionsByTerm: jest.fn().mockReturnValue(of([MOCK_CATALOG_SECTION])),
      deleteSection: jest.fn().mockReturnValue(of({}))
    };
    snackBarMock.open.mockReturnValue({ onAction: jest.fn().mockReturnValue(of(true)) });

    await TestBed.configureTestingModule({
      declarations: [AdminSectionComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AcademicsService, useValue: academicsServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { terms: [MOCK_TERM], currentTerm: MOCK_TERM } }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSectionComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.displayTermId).toBe('24F');
  });

  it('createSection and updateSection navigate to section editor', () => {
    component.createSection();
    component.updateSection(MOCK_SECTION);

    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'section',
      'edit',
      'new'
    ]);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'section',
      'edit',
      1
    ]);
  });

  it('resetSections loads sections for selected term', () => {
    component.displayTermId = '24F';
    component.resetSections();

    expect(academicsServiceMock.getSectionsByTerm).toHaveBeenCalledWith(MOCK_TERM);
    expect(component.sections()).toEqual([MOCK_CATALOG_SECTION]);
  });

  it('deleteSection removes section and shows success snackbar', () => {
    component.sections.set([MOCK_CATALOG_SECTION]);
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.deleteSection(MOCK_SECTION, event);

    expect(academicsServiceMock.deleteSection).toHaveBeenCalledWith(MOCK_SECTION);
    expect(component.sections()).toEqual([]);
    expect(snackBarMock.open).toHaveBeenCalledWith('This Section has been deleted.', '', {
      duration: 2000
    });
  });
});
