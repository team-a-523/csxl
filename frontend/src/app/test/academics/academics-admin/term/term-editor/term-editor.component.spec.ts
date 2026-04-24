import { DatePipe } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { TermEditorComponent } from 'src/app/academics/academics-admin/term/term-editor/term-editor.component';
import { AcademicsService } from 'src/app/academics/academics.service';

const MOCK_PROFILE = { onyen: 'admin' };
const MOCK_TERM = {
  id: '24F',
  name: 'Fall 2024',
  start: new Date('2024-08-15T09:00:00'),
  end: new Date('2024-12-15T17:00:00'),
  applications_open: new Date('2024-03-01T09:00:00'),
  applications_close: new Date('2024-04-01T17:00:00')
};

describe('TermEditorComponent', () => {
  let fixture: ComponentFixture<TermEditorComponent>;
  let component: TermEditorComponent;
  let routerMock: { navigate: jest.Mock };
  let snackBarMock: { open: jest.Mock };
  let academicsServiceMock: {
    createTerm: jest.Mock;
    updateTerm: jest.Mock;
  };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    snackBarMock = { open: jest.fn() };
    academicsServiceMock = {
      createTerm: jest.fn().mockReturnValue(of(MOCK_TERM)),
      updateTerm: jest.fn().mockReturnValue(of(MOCK_TERM))
    };

    await TestBed.configureTestingModule({
      declarations: [TermEditorComponent],
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
              data: { profile: MOCK_PROFILE, term: MOCK_TERM },
              params: { id: '24F' }
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TermEditorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.termForm.value.name).toBe('Fall 2024');
  });

  it('onSubmit updates existing term', () => {
    component.termId = '24F';
    component.termForm.patchValue({ name: 'Updated Fall 2024' });

    component.onSubmit();

    expect(academicsServiceMock.updateTerm).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/academics/admin/term']);
    expect(snackBarMock.open).toHaveBeenCalledWith('Term Updated', '', {
      duration: 2000
    });
  });

  it('onSubmit creates new term', () => {
    component.termId = 'new';
    component.term = { ...MOCK_TERM, id: '' };
    component.termForm.patchValue({ id: '25S', name: 'Spring 2025' });

    component.onSubmit();

    expect(academicsServiceMock.createTerm).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith('Term Created', '', {
      duration: 2000
    });
  });

  it('onSubmit shows error snackbar when update fails', () => {
    component.termId = '24F';
    academicsServiceMock.updateTerm.mockReturnValueOnce(
      throwError(() => new Error('update failed'))
    );

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('Error: Course Not Updated', '', {
      duration: 2000
    });
  });
});
