import {
  RxCourseList,
  RxRoomList,
  RxSectionList,
  RxTermList
} from 'src/app/academics/academics-admin/rx-academics-admin';
import { Course, Room, Section, Term } from 'src/app/academics/academics.models';

const TERM_A: Term = {
  id: '24F',
  name: 'Fall 2024',
  start: new Date('2024-08-15'),
  end: new Date('2024-12-15'),
  applications_open: new Date('2024-03-01'),
  applications_close: new Date('2024-04-01')
};

const TERM_B: Term = {
  ...TERM_A,
  id: '25S',
  name: 'Spring 2025'
};

const COURSE_A: Course = {
  id: 'COMP110',
  subject_code: 'COMP',
  number: '110',
  title: 'Intro Programming',
  description: 'Foundations',
  credit_hours: 3,
  sections: null
};

const COURSE_B: Course = {
  ...COURSE_A,
  id: 'COMP210',
  number: '210',
  title: 'Data Structures'
};

const ROOM_A: Room = {
  id: 'SN014',
  nickname: 'Sitterson 014',
  building: 'SN',
  room: '014',
  capacity: 100,
  reservable: true,
  seats: []
};

const ROOM_B: Room = {
  ...ROOM_A,
  id: 'SN015',
  nickname: 'Sitterson 015'
};

const SECTION_A: Section = {
  id: 1,
  course_id: 'COMP110',
  number: '001',
  term_id: '24F',
  meeting_pattern: 'MWF',
  course: null,
  term: null,
  staff: [],
  lecture_room: ROOM_A,
  office_hour_rooms: [],
  override_title: '',
  override_description: '',
  enrolled: 80,
  total_seats: 100
};

const SECTION_B: Section = {
  ...SECTION_A,
  id: 2,
  number: '002'
};

describe('RxTermList', () => {
  let list: RxTermList;
  beforeEach(() => {
    list = new RxTermList();
    list.set([TERM_A]);
  });
  afterEach(() => jest.clearAllMocks());

  it('should create', () => expect(list).toBeTruthy());
  it('pushTerm appends term', async () => {
    list.pushTerm(TERM_B);
    await expect(Promise.resolve((list as any).value)).resolves.toHaveLength(2);
  });
  it('updateTerm replaces matching term', async () => {
    list.updateTerm({ ...TERM_A, name: 'Updated' });
    await expect(Promise.resolve((list as any).value[0].name)).resolves.toBe(
      'Updated'
    );
  });
  it('removeTerm removes matching term', async () => {
    list.removeTerm(TERM_A);
    await expect(Promise.resolve((list as any).value)).resolves.toEqual([]);
  });
});

describe('RxCourseList', () => {
  let list: RxCourseList;
  beforeEach(() => {
    list = new RxCourseList();
    list.set([COURSE_A]);
  });
  afterEach(() => jest.clearAllMocks());

  it('should create', () => expect(list).toBeTruthy());
  it('pushCourse appends course', () => {
    list.pushCourse(COURSE_B);
    expect((list as any).value).toHaveLength(2);
  });
  it('updateCourse replaces matching course', () => {
    list.updateCourse({ ...COURSE_A, title: 'Updated Title' });
    expect((list as any).value[0].title).toBe('Updated Title');
  });
  it('removeCourse removes matching course', () => {
    list.removeCourse(COURSE_A);
    expect((list as any).value).toEqual([]);
  });
});

describe('RxSectionList', () => {
  let list: RxSectionList;
  beforeEach(() => {
    list = new RxSectionList();
    list.set([SECTION_A]);
  });
  afterEach(() => jest.clearAllMocks());

  it('should create', () => expect(list).toBeTruthy());
  it('pushSection appends section', () => {
    list.pushSection(SECTION_B);
    expect((list as any).value).toHaveLength(2);
  });
  it('updateSection replaces matching section', () => {
    list.updateSection({ ...SECTION_A, number: '099' });
    expect((list as any).value[0].number).toBe('099');
  });
  it('removeSection removes matching section', () => {
    list.removeSection(SECTION_A);
    expect((list as any).value).toEqual([]);
  });
});

describe('RxRoomList', () => {
  let list: RxRoomList;
  beforeEach(() => {
    list = new RxRoomList();
    list.set([ROOM_A]);
  });
  afterEach(() => jest.clearAllMocks());

  it('should create', () => expect(list).toBeTruthy());
  it('pushRoom appends room', () => {
    list.pushRoom(ROOM_B);
    expect((list as any).value).toHaveLength(2);
  });
  it('updateRoom replaces matching room', () => {
    list.updateRoom({ ...ROOM_A, nickname: 'Updated' });
    expect((list as any).value[0].nickname).toBe('Updated');
  });
  it('removeRoom removes matching room', () => {
    list.removeRoom(ROOM_A);
    expect((list as any).value).toEqual([]);
  });
});
