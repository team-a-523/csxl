import {
  Course,
  EditedSection,
  Room,
  RosterRole,
  Section,
  SectionMember,
  SectionMemberPartial,
  Term
} from 'src/app/academics/academics.models';

const MOCK_TERM: Term = {
  id: '24F',
  name: 'Fall 2024',
  start: new Date('2024-08-15'),
  end: new Date('2024-12-15'),
  applications_open: new Date('2024-03-01'),
  applications_close: new Date('2024-04-01')
};

const MOCK_ROOM: Room = {
  id: 'SN014',
  nickname: 'Sitterson 014',
  building: 'SN',
  room: '014',
  capacity: 100,
  reservable: true,
  seats: []
};

const MOCK_COURSE: Course = {
  id: 'COMP110',
  subject_code: 'COMP',
  number: '110',
  title: 'Intro Programming',
  description: 'Foundations',
  credit_hours: 3,
  sections: null
};

describe('academics models', () => {
  it('should create fixture objects', () => {
    expect(MOCK_TERM.id).toBe('24F');
    expect(MOCK_COURSE.id).toBe('COMP110');
    expect(MOCK_ROOM.id).toBe('SN014');
  });

  it('supports section and edited section typing', () => {
    const section: Section = {
      id: 1,
      course_id: MOCK_COURSE.id,
      number: '001',
      term_id: MOCK_TERM.id,
      meeting_pattern: 'MWF',
      course: null,
      term: null,
      staff: [],
      lecture_room: MOCK_ROOM,
      office_hour_rooms: [],
      override_title: '',
      override_description: '',
      enrolled: 80,
      total_seats: 100
    };
    const edited: EditedSection = {
      ...section,
      instructors: []
    };

    expect(section.lecture_room?.id).toBe('SN014');
    expect(edited.instructors).toEqual([]);
  });

  it('keeps roster role and member typing stable', () => {
    const member: SectionMember = {
      id: 1,
      user_id: 7,
      first_name: 'Ada',
      last_name: 'Lovelace',
      pronouns: 'she/her',
      member_role: RosterRole.INSTRUCTOR
    };
    const partial: SectionMemberPartial = {
      id: 1,
      member_role: RosterRole.UTA
    };

    expect(member.member_role).toBe('Instructor');
    expect(partial.member_role).toBe('UTA');
  });
});
