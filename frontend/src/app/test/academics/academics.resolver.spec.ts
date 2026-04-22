import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  coursesResolver,
  courseResolver,
  termsResolver,
  currentTermResolver,
  termResolver,
  sectionResolver,
  sectionsResolver,
  roomsResolver,
  roomResolver
} from 'src/app/academics/academics.resolver';
import { AcademicsService } from 'src/app/academics/academics.service';
import { Course, Room, Section, Term } from 'src/app/academics/academics.models';

const mockCourses: Course[] = [
  {
    id: 'comp523',
    subject_code: 'COMP',
    number: '523',
    title: 'Software Engineering Lab',
    description: 'Team-based software engineering.',
    credit_hours: 3,
    sections: null
  }
];

const mockTerms: Term[] = [
  {
    id: 'SP26',
    name: 'Spring 2026',
    start: new Date('2026-01-14'),
    end: new Date('2026-05-06'),
    applications_open: new Date('2025-10-01'),
    applications_close: new Date('2025-11-01')
  }
];

const mockSection: Section = {
  id: 1,
  course_id: 'comp523',
  number: '001',
  term_id: 'SP26',
  meeting_pattern: 'MWF 10:00-10:50',
  course: null,
  term: null,
  staff: [],
  lecture_room: null,
  office_hour_rooms: [],
  override_title: '',
  override_description: '',
  enrolled: 10,
  total_seats: 30
};

const mockRoom: Room = {
  id: 'SN0115',
  nickname: 'Sitterson 115',
  building: 'Sitterson',
  room: '0115',
  capacity: 30,
  reservable: false,
  seats: null
};

function buildRoute(id: string): ActivatedRouteSnapshot {
  return {
    paramMap: {
      get: (key: string) => (key === 'id' ? id : null)
    }
  } as unknown as ActivatedRouteSnapshot;
}

const mockState = {} as RouterStateSnapshot;

describe('Academics Resolvers', () => {
  let academicsServiceMock: any;

  beforeEach(() => {
    academicsServiceMock = {
      getCourses: jest.fn().mockReturnValue(of(mockCourses)),
      getCourse: jest.fn((_id: string) => of(mockCourses[0])),
      getTerms: jest.fn().mockReturnValue(of(mockTerms)),
      getCurrentTerm: jest.fn().mockReturnValue(of(mockTerms[0])),
      getTerm: jest.fn((_id: string) => of(mockTerms[0])),
      getSection: jest.fn((_id: number) => of(mockSection)),
      getSectionsByTerm24F: jest.fn().mockReturnValue(of([mockSection])),
      getRooms: jest.fn().mockReturnValue(of([mockRoom])),
      getRoom: jest.fn((_id: string) => of(mockRoom))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AcademicsService, useValue: academicsServiceMock }
      ]
    });
  });

  describe('coursesResolver', () => {
    it('should call getCourses() and return the result', (done) => {
      const route = buildRoute('');

      TestBed.runInInjectionContext(() => {
        (coursesResolver(route, mockState) as any).subscribe(
          (result: Course[]) => {
            expect(academicsServiceMock.getCourses).toHaveBeenCalledTimes(1);
            expect(result).toEqual(mockCourses);
            done();
          }
        );
      });
    });
  });

  describe('courseResolver', () => {
    it('should return a blank course when id is "new"', () => {
      const route = buildRoute('new');

      TestBed.runInInjectionContext(() => {
        const result = courseResolver(route, mockState) as Course;
        expect(result.id).toBe('');
        expect(result.subject_code).toBe('');
        expect(result.credit_hours).toBe(-1);
        expect(result.sections).toBeNull();
      });
    });

    it('should call getCourse() with the id when id is not "new"', (done) => {
      const route = buildRoute('comp523');

      TestBed.runInInjectionContext(() => {
        (courseResolver(route, mockState) as any).subscribe(
          (result: Course) => {
            expect(academicsServiceMock.getCourse).toHaveBeenCalledWith(
              'comp523'
            );
            expect(result).toEqual(mockCourses[0]);
            done();
          }
        );
      });
    });

    it('should return undefined when getCourse() fails', (done) => {
      academicsServiceMock.getCourse.mockReturnValue(
        throwError(() => new Error('Not found'))
      );
      const route = buildRoute('comp523');

      TestBed.runInInjectionContext(() => {
        (courseResolver(route, mockState) as any).subscribe(
          (result: Course | undefined) => {
            expect(result).toBeUndefined();
            done();
          }
        );
      });
    });
  });

  describe('termsResolver', () => {
    it('should call getTerms() and return the result', (done) => {
      const route = buildRoute('');

      TestBed.runInInjectionContext(() => {
        (termsResolver(route, mockState) as any).subscribe((result: Term[]) => {
          expect(academicsServiceMock.getTerms).toHaveBeenCalledTimes(1);
          expect(result).toEqual(mockTerms);
          done();
        });
      });
    });
  });

  describe('currentTermResolver', () => {
    it('should call getCurrentTerm() and return the result', (done) => {
      const route = buildRoute('');

      TestBed.runInInjectionContext(() => {
        (currentTermResolver(route, mockState) as any).subscribe(
          (result: Term) => {
            expect(academicsServiceMock.getCurrentTerm).toHaveBeenCalledTimes(
              1
            );
            expect(result).toEqual(mockTerms[0]);
            done();
          }
        );
      });
    });

    it('should return undefined when getCurrentTerm() fails', (done) => {
      academicsServiceMock.getCurrentTerm.mockReturnValue(
        throwError(() => new Error('Not found'))
      );
      const route = buildRoute('');

      TestBed.runInInjectionContext(() => {
        (currentTermResolver(route, mockState) as any).subscribe(
          (result: Term | undefined) => {
            expect(result).toBeUndefined();
            done();
          }
        );
      });
    });
  });

  describe('termResolver', () => {
    it('should return a blank term when id is "new"', () => {
      const route = buildRoute('new');

      TestBed.runInInjectionContext(() => {
        const result = termResolver(route, mockState) as Term;
        expect(result.id).toBe('');
        expect(result.name).toBe('');
      });
    });

    it('should call getTerm() with the id when id is not "new"', (done) => {
      const route = buildRoute('SP26');

      TestBed.runInInjectionContext(() => {
        (termResolver(route, mockState) as any).subscribe((result: Term) => {
          expect(academicsServiceMock.getTerm).toHaveBeenCalledWith('SP26');
          expect(result).toEqual(mockTerms[0]);
          done();
        });
      });
    });

    it('should return undefined when getTerm() fails', (done) => {
      academicsServiceMock.getTerm.mockReturnValue(
        throwError(() => new Error('Not found'))
      );
      const route = buildRoute('SP26');

      TestBed.runInInjectionContext(() => {
        (termResolver(route, mockState) as any).subscribe(
          (result: Term | undefined) => {
            expect(result).toBeUndefined();
            done();
          }
        );
      });
    });
  });

  describe('sectionResolver', () => {
    it('should return a blank section when id is "new"', () => {
      const route = buildRoute('new');

      TestBed.runInInjectionContext(() => {
        const result = sectionResolver(route, mockState) as Section;
        expect(result.id).toBeNull();
        expect(result.course_id).toBe('');
        expect(result.number).toBe('');
        expect(result.override_title).toBe('');
        expect(result.override_description).toBe('');
      });
    });

    it('should call getSection() with the numeric id when id is not "new"', (done) => {
      const route = buildRoute('1');

      TestBed.runInInjectionContext(() => {
        (sectionResolver(route, mockState) as any).subscribe(
          (result: Section) => {
            expect(academicsServiceMock.getSection).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockSection);
            done();
          }
        );
      });
    });

    it('should return undefined when getSection() fails', (done) => {
      academicsServiceMock.getSection.mockReturnValue(
        throwError(() => new Error('Not found'))
      );
      const route = buildRoute('1');

      TestBed.runInInjectionContext(() => {
        (sectionResolver(route, mockState) as any).subscribe(
          (result: Section | undefined) => {
            expect(result).toBeUndefined();
            done();
          }
        );
      });
    });
  });

  describe('sectionsResolver', () => {
    it('should call getSectionsByTerm24F() and return the result', (done) => {
      const route = buildRoute('');

      TestBed.runInInjectionContext(() => {
        (sectionsResolver!(route, mockState) as any).subscribe(
          (result: Section[]) => {
            expect(
              academicsServiceMock.getSectionsByTerm24F
            ).toHaveBeenCalledTimes(1);
            expect(result).toEqual([mockSection]);
            done();
          }
        );
      });
    });
  });

  describe('roomsResolver', () => {
    it('should call getRooms() and return the result', (done) => {
      const route = buildRoute('');

      TestBed.runInInjectionContext(() => {
        (roomsResolver(route, mockState) as any).subscribe((result: Room[]) => {
          expect(academicsServiceMock.getRooms).toHaveBeenCalledTimes(1);
          expect(result).toEqual([mockRoom]);
          done();
        });
      });
    });
  });

  describe('roomResolver', () => {
    it('should return a blank room when id is "new"', () => {
      const route = buildRoute('new');

      TestBed.runInInjectionContext(() => {
        const result = roomResolver(route, mockState) as Room;
        expect(result.id).toBe('');
        expect(result.nickname).toBe('');
        expect(result.capacity).toBe(100);
      });
    });

    it('should call getRoom() with the id when id is not "new"', (done) => {
      const route = buildRoute('SN0115');

      TestBed.runInInjectionContext(() => {
        (roomResolver(route, mockState) as any).subscribe((result: Room) => {
          expect(academicsServiceMock.getRoom).toHaveBeenCalledWith('SN0115');
          expect(result).toEqual(mockRoom);
          done();
        });
      });
    });

    it('should return undefined when getRoom() fails', (done) => {
      academicsServiceMock.getRoom.mockReturnValue(
        throwError(() => new Error('Not found'))
      );
      const route = buildRoute('SN0115');

      TestBed.runInInjectionContext(() => {
        (roomResolver(route, mockState) as any).subscribe(
          (result: Room | undefined) => {
            expect(result).toBeUndefined();
            done();
          }
        );
      });
    });
  });
});
