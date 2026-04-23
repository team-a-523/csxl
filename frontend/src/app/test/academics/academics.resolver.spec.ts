import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  ResolveFn,
  RouterStateSnapshot
} from '@angular/router';
import { Observable, firstValueFrom, isObservable, of, throwError } from 'rxjs';
import {
  courseResolver,
  coursesResolver,
  currentTermResolver,
  roomResolver,
  roomsResolver,
  sectionResolver,
  sectionsResolver,
  termResolver,
  termsResolver
} from 'src/app/academics/academics.resolver';
import { AcademicsService } from 'src/app/academics/academics.service';
import {
  Course,
  Room,
  Section,
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

const MOCK_COURSE: Course = {
  id: 'COMP110',
  subject_code: 'COMP',
  number: '110',
  title: 'Intro Programming',
  description: 'Fundamentals course',
  credit_hours: 3,
  sections: null
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

const MOCK_SECTION: Section = {
  id: 1,
  course_id: 'COMP110',
  number: '001',
  term_id: '24F',
  meeting_pattern: 'MWF 9:05-9:55',
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

describe('academics resolvers', () => {
  let academicsServiceMock: {
    getCourses: jest.Mock;
    getCourse: jest.Mock;
    getTerms: jest.Mock;
    getCurrentTerm: jest.Mock;
    getTerm: jest.Mock;
    getSection: jest.Mock;
    getSectionsByTerm24F: jest.Mock;
    getRooms: jest.Mock;
    getRoom: jest.Mock;
  };

  const makeRoute = (id: string): ActivatedRouteSnapshot =>
    ({
      paramMap: convertToParamMap({ id })
    }) as ActivatedRouteSnapshot;

  const state = {} as RouterStateSnapshot;
  const resolveValue = <T>(value: T | Promise<T> | Observable<T>) =>
    isObservable(value) ? firstValueFrom(value) : Promise.resolve(value);

  beforeEach(() => {
    academicsServiceMock = {
      getCourses: jest.fn(),
      getCourse: jest.fn(),
      getTerms: jest.fn(),
      getCurrentTerm: jest.fn(),
      getTerm: jest.fn(),
      getSection: jest.fn(),
      getSectionsByTerm24F: jest.fn(),
      getRooms: jest.fn(),
      getRoom: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AcademicsService, useValue: academicsServiceMock }]
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create testing module with resolver dependencies', () => {
    expect(TestBed.inject(AcademicsService)).toBeTruthy();
  });

  it('coursesResolver returns courses from service', async () => {
    academicsServiceMock.getCourses.mockReturnValue(of([MOCK_COURSE]));

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        coursesResolver(makeRoute('ignored'), state) as
          | Course[]
          | Promise<Course[]>
          | Observable<Course[]>
      )
    );

    expect(await result).toEqual([MOCK_COURSE]);
    expect(academicsServiceMock.getCourses).toHaveBeenCalled();
  });

  it('courseResolver returns blank course when id is new', () => {
    const result = TestBed.runInInjectionContext(() =>
      courseResolver(makeRoute('new'), state)
    ) as Course;

    expect(result.id).toBe('');
    expect(result.credit_hours).toBe(-1);
    expect(academicsServiceMock.getCourse).not.toHaveBeenCalled();
  });

  it('courseResolver returns course from service when id exists', async () => {
    academicsServiceMock.getCourse.mockReturnValue(of(MOCK_COURSE));

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        courseResolver(makeRoute('COMP110'), state) as
          | Course
          | Promise<Course | undefined>
          | Observable<Course | undefined>
      )
    );

    expect(await result).toEqual(MOCK_COURSE);
    expect(academicsServiceMock.getCourse).toHaveBeenCalledWith('COMP110');
  });

  it('courseResolver returns undefined on service error', async () => {
    academicsServiceMock.getCourse.mockReturnValue(
      throwError(() => new Error('getCourse failed'))
    );

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        courseResolver(makeRoute('COMP999'), state) as
          | Course
          | Promise<Course | undefined>
          | Observable<Course | undefined>
      )
    );

    expect(await result).toBeUndefined();
  });

  it('termsResolver returns terms from service', async () => {
    academicsServiceMock.getTerms.mockReturnValue(of([MOCK_TERM]));

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        termsResolver(makeRoute('ignored'), state) as
          | Term[]
          | Promise<Term[]>
          | Observable<Term[]>
      )
    );

    expect(await result).toEqual([MOCK_TERM]);
    expect(academicsServiceMock.getTerms).toHaveBeenCalled();
  });

  it('currentTermResolver returns current term from service', async () => {
    academicsServiceMock.getCurrentTerm.mockReturnValue(of(MOCK_TERM));

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        currentTermResolver(makeRoute('ignored'), state) as
          | Term
          | Promise<Term | undefined>
          | Observable<Term | undefined>
      )
    );

    expect(await result).toEqual(MOCK_TERM);
    expect(academicsServiceMock.getCurrentTerm).toHaveBeenCalled();
  });

  it('currentTermResolver returns undefined on service error', async () => {
    academicsServiceMock.getCurrentTerm.mockReturnValue(
      throwError(() => new Error('getCurrentTerm failed'))
    );

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        currentTermResolver(makeRoute('ignored'), state) as
          | Term
          | Promise<Term | undefined>
          | Observable<Term | undefined>
      )
    );

    expect(await result).toBeUndefined();
  });

  it('termResolver returns blank term when id is new', () => {
    const result = TestBed.runInInjectionContext(() =>
      termResolver(makeRoute('new'), state)
    ) as Term & { course_sections: null };

    expect(result.id).toBe('');
    expect(result.name).toBe('');
    expect(result.course_sections).toBeNull();
    expect(academicsServiceMock.getTerm).not.toHaveBeenCalled();
  });

  it('termResolver returns term from service when id exists', async () => {
    academicsServiceMock.getTerm.mockReturnValue(of(MOCK_TERM));

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        termResolver(makeRoute('24F'), state) as
          | Term
          | Promise<Term | undefined>
          | Observable<Term | undefined>
      )
    );

    expect(await result).toEqual(MOCK_TERM);
    expect(academicsServiceMock.getTerm).toHaveBeenCalledWith('24F');
  });

  it('termResolver returns undefined on service error', async () => {
    academicsServiceMock.getTerm.mockReturnValue(
      throwError(() => new Error('getTerm failed'))
    );

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        termResolver(makeRoute('BAD'), state) as
          | Term
          | Promise<Term | undefined>
          | Observable<Term | undefined>
      )
    );

    expect(await result).toBeUndefined();
  });

  it('sectionResolver returns blank section when id is new', () => {
    const result = TestBed.runInInjectionContext(() =>
      sectionResolver(makeRoute('new'), state)
    ) as Section;

    expect(result.id).toBeNull();
    expect(result.staff).toEqual([]);
    expect(result.office_hour_rooms).toEqual([]);
    expect(academicsServiceMock.getSection).not.toHaveBeenCalled();
  });

  it('sectionResolver returns section from service when id exists', async () => {
    academicsServiceMock.getSection.mockReturnValue(of(MOCK_SECTION));

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        sectionResolver(makeRoute('1'), state) as
          | Section
          | Promise<Section | undefined>
          | Observable<Section | undefined>
      )
    );

    expect(await result).toEqual(MOCK_SECTION);
    expect(academicsServiceMock.getSection).toHaveBeenCalledWith(1);
  });

  it('sectionResolver returns undefined on service error', async () => {
    academicsServiceMock.getSection.mockReturnValue(
      throwError(() => new Error('getSection failed'))
    );

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        sectionResolver(makeRoute('1'), state) as
          | Section
          | Promise<Section | undefined>
          | Observable<Section | undefined>
      )
    );

    expect(await result).toBeUndefined();
  });

  it('sectionsResolver returns sections from hardcoded term service call', async () => {
    academicsServiceMock.getSectionsByTerm24F.mockReturnValue(
      of([MOCK_SECTION])
    );

    const resolver = sectionsResolver as ResolveFn<Section[]>;
    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        resolver(makeRoute('ignored'), state) as
          | Section[]
          | Promise<Section[]>
          | Observable<Section[]>
      )
    );

    expect(await result).toEqual([MOCK_SECTION]);
    expect(academicsServiceMock.getSectionsByTerm24F).toHaveBeenCalled();
  });

  it('roomsResolver returns rooms from service', async () => {
    academicsServiceMock.getRooms.mockReturnValue(of([MOCK_ROOM]));

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        roomsResolver(makeRoute('ignored'), state) as
          | Room[]
          | Promise<Room[]>
          | Observable<Room[]>
      )
    );

    expect(await result).toEqual([MOCK_ROOM]);
    expect(academicsServiceMock.getRooms).toHaveBeenCalled();
  });

  it('roomResolver returns blank room when id is new', () => {
    const result = TestBed.runInInjectionContext(() =>
      roomResolver(makeRoute('new'), state)
    ) as Room;

    expect(result.id).toBe('');
    expect(result.capacity).toBe(100);
    expect(result.seats).toEqual([]);
    expect(academicsServiceMock.getRoom).not.toHaveBeenCalled();
  });

  it('roomResolver returns room from service when id exists', async () => {
    academicsServiceMock.getRoom.mockReturnValue(of(MOCK_ROOM));

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        roomResolver(makeRoute('SN014'), state) as
          | Room
          | Promise<Room | undefined>
          | Observable<Room | undefined>
      )
    );

    expect(await result).toEqual(MOCK_ROOM);
    expect(academicsServiceMock.getRoom).toHaveBeenCalledWith('SN014');
  });

  it('roomResolver returns undefined on service error', async () => {
    academicsServiceMock.getRoom.mockReturnValue(
      throwError(() => new Error('getRoom failed'))
    );

    const result = TestBed.runInInjectionContext(() =>
      resolveValue(
        roomResolver(makeRoute('SN099'), state) as
          | Room
          | Promise<Room | undefined>
          | Observable<Room | undefined>
      )
    );

    expect(await result).toBeUndefined();
  });
});
