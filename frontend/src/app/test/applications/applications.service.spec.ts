/**
 * Unit tests for ApplicationsService.
 *
 * Tests cover: getApplication, createApplication, updateApplication,
 * getEligibleSections (called on construction), and getForm (UTA + GTA paths).
 *
 * Pattern: HttpTestingController intercepts all HTTP calls — no real network
 * traffic occurs. The constructor triggers getEligibleSections automatically,
 * so every test must flush that initial request before making additional calls.
 */

import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ApplicationsService } from 'src/app/applications/applications.service';
import {
  Application,
  ApplicationSectionChoice
} from 'src/app/applications/applications.model';
import { FormFieldType } from 'src/app/applications/form/application-forms';

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const MOCK_SECTION: ApplicationSectionChoice = {
  id: 1,
  subject_code: 'COMP',
  course_number: '110',
  section_number: '001',
  title: 'Introduction to Programming'
};

const MOCK_APPLICATION: Application = {
  id: 42,
  user_id: 7,
  term_id: 'F2025',
  type: 'new_uta',
  academic_hours: 15,
  extracurriculars: 'CS Club ~3h/week',
  expected_graduation: '2026 - Spring',
  program_pursued: 'CS Major (BS)',
  other_programs: 'Math Minor',
  gpa: 3.8,
  comp_gpa: 3.9,
  comp_227: 'Monetary compensation only',
  intro_video_url: 'https://youtu.be/example',
  prior_experience: 'Some prior experience',
  service_experience: 'Tutored peers',
  additional_experience: 'Internship at XYZ',
  ta_experience: null,
  best_moment: null,
  desired_improvement: null,
  advisor: null,
  preferred_sections: [MOCK_SECTION],
  assignments: []
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApplicationsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });

    // Constructing the service triggers getEligibleSections() immediately.
    // We must flush that pending request before each test body runs.
    service = TestBed.inject(ApplicationsService);
    httpController = TestBed.inject(HttpTestingController);

    const initReq = httpController.expectOne(
      '/api/applications/ta/eligible-sections'
    );
    initReq.flush([MOCK_SECTION]);
  });

  afterEach(() => {
    httpController.verify();
  });

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  // -------------------------------------------------------------------------
  // getEligibleSections — signal population
  // -------------------------------------------------------------------------

  it('populates eligibleSections signal from constructor call', () => {
    // The signal was already populated by the flushed init request in beforeEach.
    expect(service.eligibleSections().length).toBe(1);
    expect(service.eligibleSections()[0].subject_code).toBe('COMP');
  });

  it('getEligibleSections updates signal when called again', () => {
    const secondSection: ApplicationSectionChoice = {
      id: 2,
      subject_code: 'COMP',
      course_number: '211',
      section_number: '002',
      title: 'Data Structures'
    };

    service.getEligibleSections();

    const req = httpController.expectOne(
      '/api/applications/ta/eligible-sections'
    );
    req.flush([MOCK_SECTION, secondSection]);

    expect(service.eligibleSections().length).toBe(2);
  });

  // -------------------------------------------------------------------------
  // getApplication
  // -------------------------------------------------------------------------

  it('getApplication sends GET to correct endpoint and emits application', () => {
    let result: Application | null = null;

    service.getApplication('F2025').subscribe((app) => {
      result = app;
    });

    const req = httpController.expectOne('/api/applications/ta/user/F2025');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_APPLICATION);

    expect(result).toBeTruthy();
    expect((result as unknown as Application).id).toBe(42);
    expect((result as unknown as Application).term_id).toBe('F2025');
  });

  it('getApplication emits null when backend returns null (no existing application)', () => {
    let result: Application | null | undefined = undefined;

    service.getApplication('S2026').subscribe((app) => {
      result = app;
    });

    const req = httpController.expectOne('/api/applications/ta/user/S2026');
    req.flush(null);

    expect(result).toBeNull();
  });

  it('getApplication uses the termId in the URL', () => {
    service.getApplication('S2026').subscribe();

    const req = httpController.expectOne('/api/applications/ta/user/S2026');
    expect(req.request.url).toContain('S2026');
    req.flush(null);
  });

  // -------------------------------------------------------------------------
  // createApplication
  // -------------------------------------------------------------------------

  it('createApplication sends POST with application body and returns created application', () => {
    const newApp: Application = { ...MOCK_APPLICATION, id: null };
    let created: Application | null = null;

    service.createApplication(newApp).subscribe((app) => {
      created = app;
    });

    const req = httpController.expectOne('/api/applications/ta');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newApp);

    const serverResponse: Application = { ...newApp, id: 99 };
    req.flush(serverResponse);

    expect(created).toBeTruthy();
    expect((created as unknown as Application).id).toBe(99);
  });

  // -------------------------------------------------------------------------
  // updateApplication
  // -------------------------------------------------------------------------

  it('updateApplication sends PUT with application body and returns updated application', () => {
    const updated = { ...MOCK_APPLICATION, extracurriculars: 'Updated clubs' };
    let returned: Application | null = null;

    service.updateApplication(updated).subscribe((app) => {
      returned = app;
    });

    const req = httpController.expectOne('/api/applications/ta');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updated);
    req.flush(updated);

    expect(returned).toBeTruthy();
    expect((returned as unknown as Application).extracurriculars).toBe(
      'Updated clubs'
    );
  });

  // -------------------------------------------------------------------------
  // getForm — UTA path
  // -------------------------------------------------------------------------

  it('getForm returns a FormGroup and field list for new_uta type', () => {
    const [formGroup, fields] = service.getForm('new_uta');

    expect(formGroup).toBeTruthy();
    expect(fields.length).toBeGreaterThan(0);
  });

  it('getForm for new_uta includes controls for text fields with empty string default', () => {
    const [formGroup] = service.getForm('new_uta');

    // intro_video_url is a SHORT_TEXT field — should default to ''
    expect(formGroup.contains('intro_video_url')).toBe(true);
    expect(formGroup.get('intro_video_url')?.value).toBe('');
  });

  it('getForm for new_uta initializes NUMBER fields with 0, not empty string', () => {
    const [formGroup] = service.getForm('new_uta');

    // academic_hours and gpa are NUMBER fields
    expect(formGroup.get('academic_hours')?.value).toBe(0);
    expect(formGroup.get('gpa')?.value).toBe(0);
    expect(formGroup.get('comp_gpa')?.value).toBe(0);
  });

  it('getForm for new_uta does not add a form control for COURSE_PREFERENCE field', () => {
    const [formGroup, fields] = service.getForm('new_uta');

    const prefField = fields.find(
      (f) => f.fieldType === FormFieldType.COURSE_PREFERENCE
    );
    expect(prefField).toBeTruthy(); // field is in the list
    expect(formGroup.contains(prefField!.name)).toBe(false); // but NOT in the form group
  });

  it('getForm for new_uta marks required fields with Validators.required', () => {
    const [formGroup] = service.getForm('new_uta');

    // intro_video_url is required per UTA_APPLICATION_FORM
    const control = formGroup.get('intro_video_url');
    control?.setValue('');
    expect(control?.valid).toBe(false);

    control?.setValue('https://youtu.be/valid');
    expect(control?.valid).toBe(true);
  });

  // -------------------------------------------------------------------------
  // getForm — GTA path
  // -------------------------------------------------------------------------

  it('getForm returns a FormGroup and field list for gta type', () => {
    const [formGroup, fields] = service.getForm('gta');

    expect(formGroup).toBeTruthy();
    expect(fields.length).toBeGreaterThan(0);
  });

  it('getForm for gta includes program_pursued and advisor controls', () => {
    const [formGroup] = service.getForm('gta');

    expect(formGroup.contains('program_pursued')).toBe(true);
    expect(formGroup.contains('advisor')).toBe(true);
  });

  it('getForm for gta does not add a form control for COURSE_PREFERENCE field', () => {
    const [formGroup, fields] = service.getForm('gta');

    const prefField = fields.find(
      (f) => f.fieldType === FormFieldType.COURSE_PREFERENCE
    );
    expect(prefField).toBeTruthy();
    expect(formGroup.contains(prefField!.name)).toBe(false);
  });

  it('getForm for unknown type returns an empty form group and empty fields array', () => {
    const [formGroup, fields] = service.getForm('unknown_type');

    expect(Object.keys(formGroup.controls).length).toBe(0);
    expect(fields.length).toBe(0);
  });
});
