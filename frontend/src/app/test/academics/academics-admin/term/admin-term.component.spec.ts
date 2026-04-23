import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminTermComponent } from 'src/app/academics/academics-admin/term/admin-term.component';
import { AcademicsService } from 'src/app/academics/academics.service';

const MOCK_TERM = {
  id: '24F',
  name: 'Fall 2024',
  start: new Date('2024-08-15'),
  end: new Date('2024-12-15'),
  applications_open: new Date('2024-03-01'),
  applications_close: new Date('2024-04-01')
};

describe('AdminTermComponent', () => {
  let fixture: ComponentFixture<AdminTermComponent>;
  let component: AdminTermComponent;
  let routerMock: { navigate: jest.Mock };
  let snackBarMock: { open: jest.Mock };
  let academicsServiceMock: {
    getTerms: jest.Mock;
    deleteTerm: jest.Mock;
  };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    snackBarMock = { open: jest.fn() };
    academicsServiceMock = {
      getTerms: jest.fn().mockReturnValue(of([MOCK_TERM])),
      deleteTerm: jest.fn().mockReturnValue(of({}))
    };
    snackBarMock.open.mockReturnValue({ onAction: jest.fn().mockReturnValue(of(true)) });

    await TestBed.configureTestingModule({
      declarations: [AdminTermComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AcademicsService, useValue: academicsServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminTermComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.terms()).toHaveLength(1);
  });

  it('createTerm and updateTerm navigate to term editor', () => {
    component.createTerm();
    component.updateTerm(MOCK_TERM);

    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'term',
      'edit',
      'new'
    ]);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'term',
      'edit',
      '24F'
    ]);
  });

  it('deleteTerm removes term and shows success snackbar', () => {
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.deleteTerm(MOCK_TERM, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(academicsServiceMock.deleteTerm).toHaveBeenCalledWith(MOCK_TERM);
    expect(component.terms()).toEqual([]);
    expect(snackBarMock.open).toHaveBeenCalledWith('This term has been deleted.', '', {
      duration: 2000
    });
  });

  it('deleteTerm preserves list when confirmation is not triggered', () => {
    snackBarMock.open.mockReturnValueOnce({
      onAction: jest.fn().mockReturnValue(of())
    });
    component.terms.set([MOCK_TERM]);
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.deleteTerm(MOCK_TERM, event);

    expect(component.terms()).toEqual([MOCK_TERM]);
  });
});
