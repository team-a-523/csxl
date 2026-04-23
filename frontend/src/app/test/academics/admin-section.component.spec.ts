import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminSectionComponent } from 'src/app/academics/academics-admin/section/admin-section.component';
import { AcademicsService } from 'src/app/academics/academics.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CatalogSection, Section, Term } from 'src/app/academics/academics.models';

const mockTerms: Term[] = [
  {
    id: 'SP26',
    name: 'Spring 2026',
    start: new Date('2026-01-14'),
    end: new Date('2026-05-06'),
    applications_open: new Date('2025-10-01'),
    applications_close: new Date('2025-11-01')
  },
  {
    id: 'FA26',
    name: 'Fall 2026',
    start: new Date('2026-08-19'),
    end: new Date('2026-12-10'),
    applications_open: new Date('2026-03-01'),
    applications_close: new Date('2026-04-01')
  }
];

const mockCatalogSections: CatalogSection[] = [
  {
    id: 1,
    subject_code: 'COMP',
    course_number: '523',
    section_number: '001',
    title: 'Software Engineering Lab',
    meeting_pattern: 'MWF 10:00-10:50',
    description: 'Team-based software engineering.',
    lecture_room: null,
    instructors: [],
    enrolled: 10,
    total_seats: 30
  },
  {
    id: 2,
    subject_code: 'COMP',
    course_number: '426',
    section_number: '001',
    title: 'Modern Web Programming',
    meeting_pattern: 'TTh 11:00-12:15',
    description: 'Full-stack web development.',
    lecture_room: null,
    instructors: [],
    enrolled: 5,
    total_seats: 25
  }
];

const mockSection: Section = {
  id: 1,
  course_id: 'COMP523',
  number: '001',
  term_id: 'SP26',
  meeting_pattern: 'MWF 10:00-10:50',
  course: null,
  term: null,
  staff: null,
  lecture_room: null,
  office_hour_rooms: null,
  override_title: '',
  override_description: '',
  enrolled: 10,
  total_seats: 30
};

function buildActivatedRoute(
  terms: Term[],
  currentTerm: Term | undefined
): any {
  return {
    snapshot: {
      data: { terms, currentTerm }
    }
  };
}

describe('AdminSectionComponent', () => {
  let component: AdminSectionComponent;
  let fixture: ComponentFixture<AdminSectionComponent>;
  let academicsServiceMock: any;
  let snackBarMock: any;
  let routerMock: any;
  let activatedRouteMock: any;

  beforeEach(async () => {
    academicsServiceMock = {
      getSectionsByTerm: jest.fn((_term: Term) => of(mockCatalogSections)),
      deleteSection: jest.fn((_section: Section) => of(void 0))
    };

    snackBarMock = {
      open: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };

    activatedRouteMock = buildActivatedRoute(mockTerms, mockTerms[0]);

    await TestBed.configureTestingModule({
      declarations: [AdminSectionComponent],
      providers: [
        { provide: AcademicsService, useValue: academicsServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getSectionsByTerm() on construction when a current term exists', () => {
    expect(academicsServiceMock.getSectionsByTerm).toHaveBeenCalledTimes(1);
    expect(academicsServiceMock.getSectionsByTerm).toHaveBeenCalledWith(
      mockTerms[0]
    );
  });

  it('should populate sections signal when getSectionsByTerm succeeds', () => {
    expect(component.sections()).toEqual(mockCatalogSections);
  });

  it('should leave sections empty when getSectionsByTerm returns an empty list', () => {
    academicsServiceMock.getSectionsByTerm.mockReturnValue(of([]));
    activatedRouteMock.snapshot.data = { terms: mockTerms, currentTerm: mockTerms[0] };

    fixture = TestBed.createComponent(AdminSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.sections()).toEqual([]);
  });

  it('should not call getSectionsByTerm when no current term is set', () => {
    academicsServiceMock.getSectionsByTerm.mockClear();
    activatedRouteMock.snapshot.data = { terms: mockTerms, currentTerm: undefined };

    fixture = TestBed.createComponent(AdminSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(academicsServiceMock.getSectionsByTerm).not.toHaveBeenCalled();
    expect(component.sections()).toEqual([]);
  });

  it('should navigate to new section editor when createSection() is called', () => {
    component.createSection();
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'section',
      'edit',
      'new'
    ]);
  });

  it('should navigate to section editor with section id when updateSection() is called', () => {
    component.updateSection(mockSection);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'section',
      'edit',
      mockSection.id
    ]);
  });

  describe('deleteSection()', () => {
    let event: Event;

    beforeEach(() => {
      const snackBarRef = { onAction: jest.fn().mockReturnValue(of(void 0)) };
      snackBarMock.open.mockReturnValue(snackBarRef);
      event = { stopPropagation: jest.fn() } as unknown as Event;
    });

    it('should open a snack bar confirmation when deleteSection() is called', () => {
      component.deleteSection(mockSection, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Are you sure you want to delete this section?',
        'Delete'
      );
    });

    it('should call academicsService.deleteSection() when delete is confirmed', () => {
      component.deleteSection(mockSection, event);

      expect(academicsServiceMock.deleteSection).toHaveBeenCalledWith(
        mockSection
      );
    });

    it('should remove the deleted section from the sections signal', () => {
      component.deleteSection(mockSection, event);

      const remaining = component.sections();
      expect(remaining).not.toContainEqual(mockCatalogSections[0]);
      expect(remaining).toContainEqual(mockCatalogSections[1]);
    });

    it('should show a success snack bar after deletion', () => {
      component.deleteSection(mockSection, event);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'This Section has been deleted.',
        '',
        { duration: 2000 }
      );
    });

    it('should not call deleteSection when confirmation is dismissed', () => {
      snackBarMock.open.mockReturnValue({
        onAction: jest.fn().mockReturnValue(of())
      });

      component.deleteSection(mockSection, event);

      expect(academicsServiceMock.deleteSection).not.toHaveBeenCalled();
    });
  });
});
