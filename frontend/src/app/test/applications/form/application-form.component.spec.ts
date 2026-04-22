/**
 * Unit tests for ApplicationFormComponent.
 *
 * Tests cover: component creation, form initialization (new vs. existing
 * application), onSubmit (create path, update path, error path), section
 * selection signal wiring, and the showApplicationAssignmentCard flag.
 *
 * Pattern: All services are mocked with jest.fn(). ActivatedRoute is faked
 * with snapshot params. NO_ERRORS_SCHEMA suppresses child component errors.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { ApplicationFormComponent } from 'src/app/applications/form/application-form.component';
import { ApplicationsService } from 'src/app/applications/applications.service';
import { AcademicsService } from 'src/app/academics/academics.service';
import {
  Application,
  ApplicationSectionChoice
} from 'src/app/applications/applications.model';
import { FormGroup, FormControl } from '@angular/forms';
import { Term } from 'src/app/academics/academics.models';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const MOCK_TERM: Term = {
  id: 'F2025',
  name: 'Fall 2025',
  start: new Date('2025-08-15'),
  end: new Date('2025-12-15'),
  applications_open: new Date('2025-04-01'),
  applications_close: new Date('2025-05-01')
};

const MOCK_SECTION: ApplicationSectionChoice = {
  id: 1,
  subject_code: 'COMP',
  course_number: '110',
  section_number: '001',
  title: 'Introduction to Programming'
};

const EXISTING_APPLICATION: Application = {
  id: 42,
  user_id: 7,
  term_id: 'F2025',
  type: 'new_uta',
  academic_hours: 15,
  extracurriculars: 'CS Club',
  expected_graduation: '2026 - Spring',
  program_pursued: 'CS Major (BS)',
  other_programs: '',
  gpa: 3.8,
  comp_gpa: 3.9,
  comp_227: 'Monetary compensation only',
  intro_video_url: 'https://youtu.be/example',
  prior_experience: 'Prior experience text',
  service_experience: 'Service experience text',
  additional_experience: 'Additional experience text',
  ta_experience: null,
  best_moment: null,
  desired_improvement: null,
  advisor: null,
  preferred_sections: [MOCK_SECTION],
  assignments: []
};

// ---------------------------------------------------------------------------
// Helper: build a minimal FormGroup that matches what getForm returns
// ---------------------------------------------------------------------------
function buildMockFormGroup(): FormGroup {
  return new FormGroup({
    intro_video_url: new FormControl(''),
    prior_experience: new FormControl(''),
    service_experience: new FormControl(''),
    additional_experience: new FormControl(''),
    academic_hours: new FormControl(0),
    extracurriculars: new FormControl(''),
    expected_graduation: new FormControl(''),
    program_pursued: new FormControl(''),
    other_programs: new FormControl(''),
    gpa: new FormControl(0),
    comp_gpa: new FormControl(0),
    comp_227: new FormControl('')
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ApplicationFormComponent', () => {
  let component: ApplicationFormComponent;
  let fixture: ComponentFixture<ApplicationFormComponent>;

  let mockApplicationsService: jest.Mocked<Partial<ApplicationsService>>;
  let mockAcademicsService: { getTerm: jest.Mock };
  let mockRouter: { navigate: jest.Mock };
  let mockSnackBar: { open: jest.Mock };

  beforeEach(async () => {
    mockApplicationsService = {
      getForm: jest.fn().mockReturnValue([buildMockFormGroup(), []]),
      getApplication: jest.fn().mockReturnValue(of(null)),
      createApplication: jest.fn().mockReturnValue(of(EXISTING_APPLICATION)),
      updateApplication: jest.fn().mockReturnValue(of(EXISTING_APPLICATION)),
      eligibleSections: jest.fn().mockReturnValue([]) as any
    };

    mockAcademicsService = {
      getTerm: jest.fn().mockReturnValue(of(MOCK_TERM))
    };

    mockRouter = { navigate: jest.fn() };
    mockSnackBar = { open: jest.fn() };

    await TestBed.configureTestingModule({
      declarations: [ApplicationFormComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                profile: { id: 7, first_name: 'Lucy', last_name: 'Moore' }
              },
              params: { term: 'F2025', type: 'new_uta' }
            }
          }
        },
        { provide: ApplicationsService, useValue: mockApplicationsService },
        { provide: AcademicsService, useValue: mockAcademicsService },
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calls getForm with the type from route params on init', () => {
    expect(mockApplicationsService.getForm).toHaveBeenCalledWith('new_uta');
  });

  it('calls getApplication with the termId from route params on init', () => {
    expect(mockApplicationsService.getApplication).toHaveBeenCalledWith(
      'F2025'
    );
  });

  it('calls getTerm with the termId on init', () => {
    expect(mockAcademicsService.getTerm).toHaveBeenCalledWith('F2025');
  });

  // -------------------------------------------------------------------------
  // Default application state (no existing application)
  // -------------------------------------------------------------------------

  it('initializes application with null id when no existing application is found', () => {
    expect(component.application.id).toBeNull();
  });

  it('initializes application with user_id from profile', () => {
    expect(component.application.user_id).toBe(7);
  });

  it('initializes application with term_id from route params', () => {
    expect(component.application.term_id).toBe('F2025');
  });

  it('initializes application with empty preferred_sections and assignments arrays', () => {
    expect(component.application.preferred_sections).toEqual([]);
    expect(component.application.assignments).toEqual([]);
  });

  it('initializes selectedSections signal as empty when no existing application', () => {
    expect(component.selectedSections()).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Existing application patching
  // -------------------------------------------------------------------------

  it('patches formGroup and selectedSections when existing application is returned', async () => {
    // Re-configure getApplication to return an existing application
    (mockApplicationsService.getApplication as jest.Mock).mockReturnValue(
      of(EXISTING_APPLICATION)
    );
    (mockApplicationsService.getForm as jest.Mock).mockReturnValue([
      buildMockFormGroup(),
      []
    ]);

    // Re-create the component with the new mock behavior
    const localFixture = TestBed.createComponent(ApplicationFormComponent);
    const localComponent = localFixture.componentInstance;
    localFixture.detectChanges();

    expect(localComponent.application.id).toBe(42);
    expect(localComponent.selectedSections().length).toBe(1);
    expect(localComponent.selectedSections()[0].id).toBe(1);
  });

  it('sets application to the returned application object when one exists', () => {
    (mockApplicationsService.getApplication as jest.Mock).mockReturnValue(
      of(EXISTING_APPLICATION)
    );
    (mockApplicationsService.getForm as jest.Mock).mockReturnValue([
      buildMockFormGroup(),
      []
    ]);

    const localFixture = TestBed.createComponent(ApplicationFormComponent);
    const localComponent = localFixture.componentInstance;
    localFixture.detectChanges();

    expect(localComponent.application.gpa).toBe(3.8);
  });

  // -------------------------------------------------------------------------
  // onSubmit — create path (id is null)
  // -------------------------------------------------------------------------

  it('calls createApplication when form is valid and application.id is null', () => {
    // Fill in all controls so formGroup is valid
    component.formGroup.setValue({
      intro_video_url: 'https://youtu.be/test',
      prior_experience: 'prior',
      service_experience: 'service',
      additional_experience: 'additional',
      academic_hours: 15,
      extracurriculars: 'clubs',
      expected_graduation: '2026 - Spring',
      program_pursued: 'CS Major (BS)',
      other_programs: '',
      gpa: 3.8,
      comp_gpa: 3.9,
      comp_227: 'Monetary compensation only'
    });

    component.application.id = null;
    component.onSubmit();

    expect(mockApplicationsService.createApplication).toHaveBeenCalledTimes(1);
    expect(mockApplicationsService.updateApplication).not.toHaveBeenCalled();
  });

  it('navigates to /my-courses/ on successful create', () => {
    component.formGroup.setValue({
      intro_video_url: 'https://youtu.be/test',
      prior_experience: 'prior',
      service_experience: 'service',
      additional_experience: 'additional',
      academic_hours: 15,
      extracurriculars: 'clubs',
      expected_graduation: '2026 - Spring',
      program_pursued: 'CS Major (BS)',
      other_programs: '',
      gpa: 3.8,
      comp_gpa: 3.9,
      comp_227: 'Monetary compensation only'
    });

    component.application.id = null;
    component.onSubmit();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/my-courses/']);
  });

  it('shows success snackbar on successful create', () => {
    component.formGroup.setValue({
      intro_video_url: 'https://youtu.be/test',
      prior_experience: 'prior',
      service_experience: 'service',
      additional_experience: 'additional',
      academic_hours: 15,
      extracurriculars: 'clubs',
      expected_graduation: '2026 - Spring',
      program_pursued: 'CS Major (BS)',
      other_programs: '',
      gpa: 3.8,
      comp_gpa: 3.9,
      comp_227: 'Monetary compensation only'
    });

    component.application.id = null;
    component.onSubmit();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Thank you for submitting your application!',
      '',
      { duration: 2000 }
    );
  });

  // -------------------------------------------------------------------------
  // onSubmit — update path (id is set)
  // -------------------------------------------------------------------------

  it('calls updateApplication when form is valid and application.id is set', () => {
    component.application = { ...EXISTING_APPLICATION };

    component.formGroup.setValue({
      intro_video_url: 'https://youtu.be/test',
      prior_experience: 'prior',
      service_experience: 'service',
      additional_experience: 'additional',
      academic_hours: 15,
      extracurriculars: 'clubs',
      expected_graduation: '2026 - Spring',
      program_pursued: 'CS Major (BS)',
      other_programs: '',
      gpa: 3.8,
      comp_gpa: 3.9,
      comp_227: 'Monetary compensation only'
    });

    component.onSubmit();

    expect(mockApplicationsService.updateApplication).toHaveBeenCalledTimes(1);
    expect(mockApplicationsService.createApplication).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // onSubmit — error path
  // -------------------------------------------------------------------------

  it('shows error snackbar when submission fails', () => {
    (mockApplicationsService.createApplication as jest.Mock).mockReturnValue(
      throwError(() => new Error('Server error'))
    );

    component.formGroup.setValue({
      intro_video_url: 'https://youtu.be/test',
      prior_experience: 'prior',
      service_experience: 'service',
      additional_experience: 'additional',
      academic_hours: 15,
      extracurriculars: 'clubs',
      expected_graduation: '2026 - Spring',
      program_pursued: 'CS Major (BS)',
      other_programs: '',
      gpa: 3.8,
      comp_gpa: 3.9,
      comp_227: 'Monetary compensation only'
    });

    component.application.id = null;
    component.onSubmit();

    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Error: Application not submitted.',
      '',
      { duration: 2000 }
    );
  });

  it('does not submit when form is invalid', () => {
    component.formGroup.get('intro_video_url')?.setErrors({ required: true });
    component.onSubmit();

    expect(mockApplicationsService.createApplication).not.toHaveBeenCalled();
    expect(mockApplicationsService.updateApplication).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // selectedSections merging into submission payload
  // -------------------------------------------------------------------------

  it('merges selectedSections signal into submission payload', () => {
    component.selectedSections.set([MOCK_SECTION]);
    component.application.id = null;

    component.formGroup.setValue({
      intro_video_url: 'https://youtu.be/test',
      prior_experience: 'prior',
      service_experience: 'service',
      additional_experience: 'additional',
      academic_hours: 15,
      extracurriculars: 'clubs',
      expected_graduation: '2026 - Spring',
      program_pursued: 'CS Major (BS)',
      other_programs: '',
      gpa: 3.8,
      comp_gpa: 3.9,
      comp_227: 'Monetary compensation only'
    });

    component.onSubmit();

    const submitted = (mockApplicationsService.createApplication as jest.Mock)
      .mock.calls[0][0] as Application;
    expect(submitted.preferred_sections).toEqual([MOCK_SECTION]);
  });

  // -------------------------------------------------------------------------
  // showApplicationAssignmentCard
  // -------------------------------------------------------------------------

  it('showApplicationAssignmentCard is a boolean', () => {
    expect(typeof component.showApplicationAssignmentCard).toBe('boolean');
  });
});
