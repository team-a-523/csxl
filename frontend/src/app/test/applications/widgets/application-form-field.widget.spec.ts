/**
 * Unit tests for ApplicationFormFieldWidget.
 *
 * Tests cover: component creation, selectedSection (adds section to signal),
 * removeSection (splices from signal, handles missing index gracefully).
 *
 * Pattern: ApplicationsService is mocked with jest.fn(). ControlContainer is
 * provided via FormGroupDirective so the widget can bind [formControlName].
 * NO_ERRORS_SCHEMA suppresses Angular Material child errors.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroupDirective,
  FormControl,
  FormGroup
} from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { ApplicationFormFieldWidget } from 'src/app/applications/widgets/application-form-field-widget/application-form-field.widget';
import { ApplicationsService } from 'src/app/applications/applications.service';
import { ApplicationSectionChoice } from 'src/app/applications/applications.model';
import {
  ApplicationFormField,
  FormFieldType
} from 'src/app/applications/form/application-forms';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SECTION_A: ApplicationSectionChoice = {
  id: 1,
  subject_code: 'COMP',
  course_number: '110',
  section_number: '001',
  title: 'Introduction to Programming'
};

const SECTION_B: ApplicationSectionChoice = {
  id: 2,
  subject_code: 'COMP',
  course_number: '210',
  section_number: '001',
  title: 'Data Structures'
};

const MOCK_SHORT_TEXT_FIELD: ApplicationFormField = {
  name: 'intro_video_url',
  title: 'Introductory Video',
  description: 'Please add your YouTube link.',
  fieldType: FormFieldType.SHORT_TEXT,
  dropdownItems: undefined,
  required: true
};

const MOCK_COURSE_PREF_FIELD: ApplicationFormField = {
  name: 'preferences',
  title: 'TA Course Preferences',
  description: 'Select courses.',
  fieldType: FormFieldType.COURSE_PREFERENCE,
  dropdownItems: undefined,
  required: true
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('ApplicationFormFieldWidget', () => {
  let component: ApplicationFormFieldWidget;
  let fixture: ComponentFixture<ApplicationFormFieldWidget>;

  let mockApplicationsService: { eligibleSections: any };

  beforeEach(async () => {
    const eligibleSignal = signal([SECTION_A, SECTION_B]);

    mockApplicationsService = {
      eligibleSections: eligibleSignal.asReadonly()
    };

    // FormGroupDirective needs a FormGroup to be bound to the host element.
    const formGroupDirective = new FormGroupDirective([], []);
    formGroupDirective.form = new FormGroup({
      intro_video_url: new FormControl('')
    });

    await TestBed.configureTestingModule({
      declarations: [ApplicationFormFieldWidget],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ApplicationsService, useValue: mockApplicationsService },
        {
          provide: FormGroupDirective,
          useValue: formGroupDirective
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationFormFieldWidget);
    component = fixture.componentInstance;

    // Provide required @Input before detectChanges
    component.field = MOCK_SHORT_TEXT_FIELD;
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

  it('exposes the FormFieldType enum for template binding', () => {
    expect(component.fieldType).toBe(FormFieldType);
  });

  it('initializes currentSectionInput signal as empty string', () => {
    expect(component.currentSectionInput()).toBe('');
  });

  // -------------------------------------------------------------------------
  // selectedSection
  // -------------------------------------------------------------------------

  it('selectedSection adds the chosen section to selectedSections signal', () => {
    component.field = MOCK_COURSE_PREF_FIELD;

    const event = {
      option: {
        value: SECTION_A,
        deselect: jest.fn()
      }
    } as unknown as MatAutocompleteSelectedEvent;

    component.selectedSection(event);

    expect(component.selectedSections()).toContain(SECTION_A);
  });

  it('selectedSection clears the currentSectionInput signal after selection', () => {
    component.field = MOCK_COURSE_PREF_FIELD;
    component.currentSectionInput.set('COMP 1');

    const event = {
      option: {
        value: SECTION_A,
        deselect: jest.fn()
      }
    } as unknown as MatAutocompleteSelectedEvent;

    component.selectedSection(event);

    expect(component.currentSectionInput()).toBe('');
  });

  it('selectedSection calls deselect on the option after selection', () => {
    const deselectSpy = jest.fn();
    const event = {
      option: {
        value: SECTION_A,
        deselect: deselectSpy
      }
    } as unknown as MatAutocompleteSelectedEvent;

    component.selectedSection(event);

    expect(deselectSpy).toHaveBeenCalledTimes(1);
  });

  it('selectedSection can add multiple sections in sequence', () => {
    const eventA = {
      option: { value: SECTION_A, deselect: jest.fn() }
    } as unknown as MatAutocompleteSelectedEvent;
    const eventB = {
      option: { value: SECTION_B, deselect: jest.fn() }
    } as unknown as MatAutocompleteSelectedEvent;

    component.selectedSection(eventA);
    component.selectedSection(eventB);

    expect(component.selectedSections().length).toBe(2);
    expect(component.selectedSections()).toContain(SECTION_B);
  });

  // -------------------------------------------------------------------------
  // removeSection
  // -------------------------------------------------------------------------

  it('removeSection removes the specified section from selectedSections', () => {
    component.selectedSections.set([SECTION_A, SECTION_B]);

    component.removeSection(SECTION_A);

    expect(component.selectedSections()).not.toContain(SECTION_A);
    expect(component.selectedSections()).toContain(SECTION_B);
  });

  it('removeSection returns sections unchanged when the section is not in the list', () => {
    component.selectedSections.set([SECTION_B]);

    component.removeSection(SECTION_A); // SECTION_A is not in the list

    expect(component.selectedSections().length).toBe(1);
    expect(component.selectedSections()[0]).toBe(SECTION_B);
  });

  it('removeSection results in an empty array when the last section is removed', () => {
    component.selectedSections.set([SECTION_A]);

    component.removeSection(SECTION_A);

    expect(component.selectedSections().length).toBe(0);
  });

  it('removeSection does not mutate the original array reference — returns a new array', () => {
    component.selectedSections.set([SECTION_A, SECTION_B]);
    const before = component.selectedSections();

    component.removeSection(SECTION_A);

    expect(component.selectedSections()).not.toBe(before);
  });
});
