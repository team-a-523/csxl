import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademicsService } from 'src/app/academics/academics.service';
import {
  CatalogSection,
  Course,
  EditedSection,
  Room,
  Section,
  Term
} from 'src/app/academics/academics.models';
import { AuthenticationService } from 'src/app/authentication.service';

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
  title: 'Introduction to Programming',
  description: 'Intro course',
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
  seats: null
};

const MOCK_SECTION: Section = {
  id: 1,
  course_id: 'COMP110',
  number: '001',
  term_id: '24F',
  meeting_pattern: 'MWF 9:05-9:55',
  course: null,
  term: null,
  staff: null,
  lecture_room: MOCK_ROOM,
  office_hour_rooms: null,
  override_title: '',
  override_description: '',
  enrolled: 80,
  total_seats: 100
};

const MOCK_EDITED_SECTION: EditedSection = {
  id: 1,
  course_id: 'COMP110',
  number: '001',
  term_id: '24F',
  meeting_pattern: 'MWF 9:05-9:55',
  lecture_room: MOCK_ROOM,
  override_title: '',
  override_description: '',
  enrolled: 80,
  total_seats: 100,
  instructors: []
};

const MOCK_CATALOG_SECTION: CatalogSection = {
  id: 1,
  subject_code: 'COMP',
  course_number: '110',
  section_number: '001',
  title: 'Introduction to Programming',
  meeting_pattern: 'MWF 9:05-9:55',
  description: 'Intro course',
  lecture_room: MOCK_ROOM,
  instructors: [],
  enrolled: 80,
  total_seats: 100
};

describe('AcademicsService', () => {
  let service: AcademicsService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AcademicsService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: AuthenticationService, useValue: { isAuthenticated: jest.fn() } },
        { provide: MatSnackBar, useValue: { open: jest.fn() } }
      ]
    });

    service = TestBed.inject(AcademicsService);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('getTerms should GET all terms', () => {
    let result: Term[] | undefined;
    service.getTerms().subscribe((terms) => (result = terms));

    const req = httpController.expectOne('/api/academics/term');
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_TERM]);

    expect(result).toEqual([MOCK_TERM]);
  });

  it('getTerms should emit error response', () => {
    let status = 0;
    service.getTerms().subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/term');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('getCurrentTerm should GET current term', () => {
    let result: Term | undefined;
    service.getCurrentTerm().subscribe((term) => (result = term));

    const req = httpController.expectOne('/api/academics/term/current');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_TERM);

    expect(result).toEqual(MOCK_TERM);
  });

  it('getCurrentTerm should emit error response', () => {
    let status = 0;
    service.getCurrentTerm().subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/term/current');
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });

  it('getTerm should GET one term by id', () => {
    let result: Term | undefined;
    service.getTerm('24F').subscribe((term) => (result = term));

    const req = httpController.expectOne('/api/academics/term/24F');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_TERM);

    expect(result?.id).toBe('24F');
  });

  it('getTerm should emit error response', () => {
    let status = 0;
    service.getTerm('bad').subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/term/bad');
    req.flush('bad request', { status: 400, statusText: 'Bad Request' });

    expect(status).toBe(400);
  });

  it('createTerm should POST term', () => {
    let result: Term | undefined;
    service.createTerm(MOCK_TERM).subscribe((term) => (result = term));

    const req = httpController.expectOne('/api/academics/term');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(MOCK_TERM);
    req.flush(MOCK_TERM);

    expect(result).toEqual(MOCK_TERM);
  });

  it('createTerm should emit error response', () => {
    let status = 0;
    service.createTerm(MOCK_TERM).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/term');
    req.flush('conflict', { status: 409, statusText: 'Conflict' });

    expect(status).toBe(409);
  });

  it('updateTerm should PUT term', () => {
    let result: Term | undefined;
    service.updateTerm(MOCK_TERM).subscribe((term) => (result = term));

    const req = httpController.expectOne('/api/academics/term');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(MOCK_TERM);
    req.flush(MOCK_TERM);

    expect(result?.name).toBe('Fall 2024');
  });

  it('updateTerm should emit error response', () => {
    let status = 0;
    service.updateTerm(MOCK_TERM).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/term');
    req.flush('unprocessable', { status: 422, statusText: 'Unprocessable' });

    expect(status).toBe(422);
  });

  it('deleteTerm should DELETE term by id', () => {
    let completed = false;
    service.deleteTerm(MOCK_TERM).subscribe(() => (completed = true));

    const req = httpController.expectOne('/api/academics/term/24F');
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    expect(completed).toBe(true);
  });

  it('deleteTerm should emit error response', () => {
    let status = 0;
    service.deleteTerm(MOCK_TERM).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/term/24F');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('getCourses should GET all courses', () => {
    let result: Course[] | undefined;
    service.getCourses().subscribe((courses) => (result = courses));

    const req = httpController.expectOne('/api/academics/course');
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_COURSE]);

    expect(result).toEqual([MOCK_COURSE]);
  });

  it('getCourses should emit error response', () => {
    let status = 0;
    service.getCourses().subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/course');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('getCourse should GET one course by id', () => {
    let result: Course | undefined;
    service.getCourse('COMP110').subscribe((course) => (result = course));

    const req = httpController.expectOne('/api/academics/course/COMP110');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_COURSE);

    expect(result?.id).toBe('COMP110');
  });

  it('getCourse should emit error response', () => {
    let status = 0;
    service.getCourse('missing').subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/course/missing');
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });

  it('createCourse should POST course', () => {
    let result: Course | undefined;
    service.createCourse(MOCK_COURSE).subscribe((course) => (result = course));

    const req = httpController.expectOne('/api/academics/course');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(MOCK_COURSE);
    req.flush(MOCK_COURSE);

    expect(result).toEqual(MOCK_COURSE);
  });

  it('createCourse should emit error response', () => {
    let status = 0;
    service.createCourse(MOCK_COURSE).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/course');
    req.flush('conflict', { status: 409, statusText: 'Conflict' });

    expect(status).toBe(409);
  });

  it('updateCourse should PUT course', () => {
    let result: Course | undefined;
    service.updateCourse(MOCK_COURSE).subscribe((course) => (result = course));

    const req = httpController.expectOne('/api/academics/course');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(MOCK_COURSE);
    req.flush(MOCK_COURSE);

    expect(result?.subject_code).toBe('COMP');
  });

  it('updateCourse should emit error response', () => {
    let status = 0;
    service.updateCourse(MOCK_COURSE).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/course');
    req.flush('unprocessable', { status: 422, statusText: 'Unprocessable' });

    expect(status).toBe(422);
  });

  it('deleteCourse should DELETE course by id', () => {
    let completed = false;
    service.deleteCourse(MOCK_COURSE).subscribe(() => (completed = true));

    const req = httpController.expectOne('/api/academics/course/COMP110');
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    expect(completed).toBe(true);
  });

  it('deleteCourse should emit error response', () => {
    let status = 0;
    service.deleteCourse(MOCK_COURSE).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/course/COMP110');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('getSectionsByTerm should GET sections for a term', () => {
    let result: CatalogSection[] | undefined;
    service.getSectionsByTerm(MOCK_TERM).subscribe((sections) => (result = sections));

    const req = httpController.expectOne('/api/academics/section/term/24F');
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_CATALOG_SECTION]);

    expect(result).toEqual([MOCK_CATALOG_SECTION]);
  });

  it('getSectionsByTerm should emit error response', () => {
    let status = 0;
    service.getSectionsByTerm(MOCK_TERM).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/section/term/24F');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('getSectionsByTerm24F should GET sections for hardcoded term', () => {
    let result: Section[] | undefined;
    service.getSectionsByTerm24F().subscribe((sections) => (result = sections));

    const req = httpController.expectOne('/api/academics/section/term/24F');
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_SECTION]);

    expect(result).toEqual([MOCK_SECTION]);
  });

  it('getSectionsByTerm24F should emit error response', () => {
    let status = 0;
    service.getSectionsByTerm24F().subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/section/term/24F');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('getSection should GET one section by id', () => {
    let result: Section | undefined;
    service.getSection(1).subscribe((section) => (result = section));

    const req = httpController.expectOne('/api/academics/section/1');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_SECTION);

    expect(result?.id).toBe(1);
  });

  it('getSection should emit error response', () => {
    let status = 0;
    service.getSection(999).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/section/999');
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });

  it('createSection should POST edited section', () => {
    let result: Section | undefined;
    service
      .createSection(MOCK_EDITED_SECTION)
      .subscribe((section) => (result = section));

    const req = httpController.expectOne('/api/academics/section');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(MOCK_EDITED_SECTION);
    req.flush(MOCK_SECTION);

    expect(result?.course_id).toBe('COMP110');
  });

  it('createSection should emit error response', () => {
    let status = 0;
    service.createSection(MOCK_EDITED_SECTION).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/section');
    req.flush('bad request', { status: 400, statusText: 'Bad Request' });

    expect(status).toBe(400);
  });

  it('updateSection should PUT edited section', () => {
    let result: Section | undefined;
    service
      .updateSection(MOCK_EDITED_SECTION)
      .subscribe((section) => (result = section));

    const req = httpController.expectOne('/api/academics/section');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(MOCK_EDITED_SECTION);
    req.flush(MOCK_SECTION);

    expect(result?.number).toBe('001');
  });

  it('updateSection should emit error response', () => {
    let status = 0;
    service.updateSection(MOCK_EDITED_SECTION).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/section');
    req.flush('unprocessable', { status: 422, statusText: 'Unprocessable' });

    expect(status).toBe(422);
  });

  it('deleteSection should DELETE section by id', () => {
    let completed = false;
    service.deleteSection(MOCK_SECTION).subscribe(() => (completed = true));

    const req = httpController.expectOne('/api/academics/section/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    expect(completed).toBe(true);
  });

  it('deleteSection should emit error response', () => {
    let status = 0;
    service.deleteSection(MOCK_SECTION).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/section/1');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('getRooms should GET all rooms', () => {
    let result: Room[] | undefined;
    service.getRooms().subscribe((rooms) => (result = rooms));

    const req = httpController.expectOne('/api/room');
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_ROOM]);

    expect(result).toEqual([MOCK_ROOM]);
  });

  it('getRooms should emit error response', () => {
    let status = 0;
    service.getRooms().subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/room');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('getRoom should GET one room by id', () => {
    let result: Room | undefined;
    service.getRoom('SN014').subscribe((room) => (result = room));

    const req = httpController.expectOne('/api/room/SN014');
    expect(req.request.method).toBe('GET');
    req.flush(MOCK_ROOM);

    expect(result?.id).toBe('SN014');
  });

  it('getRoom should emit error response', () => {
    let status = 0;
    service.getRoom('missing').subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/room/missing');
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });

  it('createRoom should POST room', () => {
    let result: Room | undefined;
    service.createRoom(MOCK_ROOM).subscribe((room) => (result = room));

    const req = httpController.expectOne('/api/room');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(MOCK_ROOM);
    req.flush(MOCK_ROOM);

    expect(result?.nickname).toBe('Sitterson 014');
  });

  it('createRoom should emit error response', () => {
    let status = 0;
    service.createRoom(MOCK_ROOM).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/room');
    req.flush('conflict', { status: 409, statusText: 'Conflict' });

    expect(status).toBe(409);
  });

  it('updateRoom should PUT room', () => {
    let result: Room | undefined;
    service.updateRoom(MOCK_ROOM).subscribe((room) => (result = room));

    const req = httpController.expectOne('/api/room');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(MOCK_ROOM);
    req.flush(MOCK_ROOM);

    expect(result?.capacity).toBe(100);
  });

  it('updateRoom should emit error response', () => {
    let status = 0;
    service.updateRoom(MOCK_ROOM).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/room');
    req.flush('unprocessable', { status: 422, statusText: 'Unprocessable' });

    expect(status).toBe(422);
  });

  it('deleteRoom should DELETE room by id using academics room endpoint', () => {
    let completed = false;
    service.deleteRoom(MOCK_ROOM).subscribe(() => (completed = true));

    const req = httpController.expectOne('/api/academics/room/SN014');
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    expect(completed).toBe(true);
  });

  it('deleteRoom should emit error response', () => {
    let status = 0;
    service.deleteRoom(MOCK_ROOM).subscribe({
      error: (err) => (status = err.status)
    });

    const req = httpController.expectOne('/api/academics/room/SN014');
    req.flush('failed', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });
});
