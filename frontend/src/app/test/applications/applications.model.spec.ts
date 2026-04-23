/**
 * Unit tests for applications model interfaces.
 */

import {
  Application,
  ApplicationSectionChoice,
  CatalogSectionIdentity
} from 'src/app/applications/applications.model';

describe('applications.model', () => {
  it('supports CatalogSectionIdentity with nullable id', () => {
    const section: CatalogSectionIdentity = {
      id: null,
      subject_code: 'COMP',
      course_number: '423',
      section_number: '001'
    };

    expect(section.id).toBeNull();
    expect(section.subject_code).toBe('COMP');
  });

  it('supports ApplicationSectionChoice with title information', () => {
    const choice: ApplicationSectionChoice = {
      id: 10,
      subject_code: 'COMP',
      course_number: '301',
      section_number: '002',
      title: 'Foundations of Programming'
    };

    expect(choice.id).toBe(10);
    expect(choice.title).toContain('Foundations');
  });

  it('supports Application with preferred sections and assignments arrays', () => {
    const preferredSection: ApplicationSectionChoice = {
      id: 1,
      subject_code: 'COMP',
      course_number: '110',
      section_number: '001',
      title: 'Introduction to Programming'
    };

    const application: Application = {
      id: 42,
      user_id: 7,
      term_id: 'F2026',
      type: 'new_uta',
      academic_hours: 12,
      extracurriculars: 'CS Club',
      expected_graduation: '2027 - Spring',
      program_pursued: 'CS Major (BS)',
      other_programs: null,
      gpa: 3.7,
      comp_gpa: 3.8,
      comp_227: 'Monetary compensation only',
      intro_video_url: 'https://youtu.be/example',
      prior_experience: 'Tutoring',
      service_experience: 'Peer mentoring',
      additional_experience: null,
      ta_experience: null,
      best_moment: null,
      desired_improvement: null,
      advisor: null,
      preferred_sections: [preferredSection],
      assignments: []
    };

    expect(application.term_id).toBe('F2026');
    expect(application.preferred_sections[0].course_number).toBe('110');
    expect(application.assignments).toEqual([]);
  });
});
