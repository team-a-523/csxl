import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AdminTermComponent } from 'src/app/academics/academics-admin/term/admin-term.component';
import { AcademicsService } from 'src/app/academics/academics.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Term } from 'src/app/academics/academics.models';

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

describe('AdminTermComponent', () => {
  let component: AdminTermComponent;
  let fixture: ComponentFixture<AdminTermComponent>;
  let academicsServiceMock: any;
  let snackBarMock: any;
  let routerMock: any;

  beforeEach(async () => {
    academicsServiceMock = {
      getTerms: jest.fn().mockReturnValue(of(mockTerms)),
      deleteTerm: jest.fn((_term: Term) => of(void 0))
    };

    snackBarMock = {
      open: jest.fn()
    };

    routerMock = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [AdminTermComponent],
      providers: [
        { provide: AcademicsService, useValue: academicsServiceMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: Router, useValue: routerMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getTerms() on construction', () => {
    expect(academicsServiceMock.getTerms).toHaveBeenCalledTimes(1);
  });

  it('should populate terms signal when getTerms succeeds', () => {
    expect(component.terms()).toEqual(mockTerms);
  });

  it('should leave terms empty when getTerms returns an empty list', async () => {
    academicsServiceMock.getTerms.mockReturnValue(of([]));

    fixture = TestBed.createComponent(AdminTermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.terms()).toEqual([]);
  });

  it('should not set terms when getTerms fails', () => {
    academicsServiceMock.getTerms.mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    fixture = TestBed.createComponent(AdminTermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.terms()).toEqual([]);
  });

  it('should navigate to new term editor when createTerm() is called', () => {
    component.createTerm();
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'term',
      'edit',
      'new'
    ]);
  });

  it('should navigate to term editor with term id when updateTerm() is called', () => {
    component.updateTerm(mockTerms[0]);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'term',
      'edit',
      mockTerms[0].id
    ]);
  });

  describe('deleteTerm()', () => {
    let event: Event;

    beforeEach(() => {
      const snackBarRef = { onAction: jest.fn().mockReturnValue(of(void 0)) };
      snackBarMock.open.mockReturnValue(snackBarRef);
      event = { stopPropagation: jest.fn() } as unknown as Event;
    });

    it('should open a snack bar confirmation when deleteTerm() is called', () => {
      component.deleteTerm(mockTerms[0], event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith(
        'Are you sure you want to delete this term?',
        'Delete'
      );
    });

    it('should call academicsService.deleteTerm() when delete is confirmed', () => {
      component.deleteTerm(mockTerms[0], event);

      expect(academicsServiceMock.deleteTerm).toHaveBeenCalledWith(mockTerms[0]);
    });

    it('should remove the deleted term from the terms signal', () => {
      component.deleteTerm(mockTerms[0], event);

      const remaining = component.terms();
      expect(remaining).not.toContainEqual(mockTerms[0]);
      expect(remaining).toContainEqual(mockTerms[1]);
    });

    it('should show a success snack bar after deletion', () => {
      component.deleteTerm(mockTerms[0], event);

      expect(snackBarMock.open).toHaveBeenCalledWith(
        'This term has been deleted.',
        '',
        { duration: 2000 }
      );
    });

    it('should not call deleteTerm when confirmation is dismissed', () => {
      snackBarMock.open.mockReturnValue({
        onAction: jest.fn().mockReturnValue(of())
      });

      component.deleteTerm(mockTerms[0], event);

      expect(academicsServiceMock.deleteTerm).not.toHaveBeenCalled();
    });
  });
});
