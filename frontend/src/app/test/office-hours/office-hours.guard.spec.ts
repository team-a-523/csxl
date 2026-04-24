/**
 * Tests for office-hours guards.
 */

import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  officeHourPageGuard,
  courseSitePageGuard
} from '../../my-courses/course/office-hours/office-hours.guard';
import { MyCoursesService } from '../../my-courses/my-courses.service';

function buildRoute(params: Record<string, any>): ActivatedRouteSnapshot {
  return {
    params,
    parent: { params: { course_site_id: '42' } }
  } as unknown as ActivatedRouteSnapshot;
}

describe('officeHourPageGuard', () => {
  let myCoursesServiceMock: any;

  beforeEach(() => {
    myCoursesServiceMock = {
      getOfficeHoursRole: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MyCoursesService, useValue: myCoursesServiceMock }
      ]
    });
  });

  it('returns true when role is in allowed roles', (done) => {
    myCoursesServiceMock.getOfficeHoursRole.mockReturnValue(
      of({ role: 'UTA' })
    );

    const guard = officeHourPageGuard(['UTA', 'GTA', 'Instructor']);
    const route = buildRoute({ event_id: 7 });

    TestBed.runInInjectionContext(() => {
      const result$ = guard(route, {} as RouterStateSnapshot) as any;
      result$.subscribe((result: boolean) => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  it('returns false when role is NOT in allowed roles', (done) => {
    myCoursesServiceMock.getOfficeHoursRole.mockReturnValue(
      of({ role: 'Student' })
    );

    const guard = officeHourPageGuard(['UTA', 'GTA', 'Instructor']);
    const route = buildRoute({ event_id: 7 });

    TestBed.runInInjectionContext(() => {
      const result$ = guard(route, {} as RouterStateSnapshot) as any;
      result$.subscribe((result: boolean) => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  it('returns false when service throws an error', (done) => {
    myCoursesServiceMock.getOfficeHoursRole.mockReturnValue(
      throwError(() => new Error('Unauthorized'))
    );

    const guard = officeHourPageGuard(['UTA', 'GTA', 'Instructor']);
    const route = buildRoute({ event_id: 7 });

    TestBed.runInInjectionContext(() => {
      const result$ = guard(route, {} as RouterStateSnapshot) as any;
      result$.subscribe((result: boolean) => {
        expect(result).toBe(false);
        done();
      });
    });
  });
});

describe('courseSitePageGuard', () => {
  let myCoursesServiceMock: any;

  beforeEach(() => {
    myCoursesServiceMock = {
      courseOverview: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MyCoursesService, useValue: myCoursesServiceMock }
      ]
    });
  });

  it('returns Observable<true> when role is in allowed roles', (done) => {
    myCoursesServiceMock.courseOverview.mockReturnValue({ role: 'Instructor' });

    const guard = courseSitePageGuard(['UTA', 'GTA', 'Instructor']);
    const route = buildRoute({});

    TestBed.runInInjectionContext(() => {
      const result$ = guard(route, {} as RouterStateSnapshot) as any;
      result$.subscribe((result: boolean) => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  it('returns Observable<false> when role is NOT in allowed roles', (done) => {
    myCoursesServiceMock.courseOverview.mockReturnValue({ role: 'Student' });

    const guard = courseSitePageGuard(['UTA', 'GTA', 'Instructor']);
    const route = buildRoute({});

    TestBed.runInInjectionContext(() => {
      const result$ = guard(route, {} as RouterStateSnapshot) as any;
      result$.subscribe((result: boolean) => {
        expect(result).toBe(false);
        done();
      });
    });
  });

  it('returns Observable<false> when courseOverview is undefined', (done) => {
    myCoursesServiceMock.courseOverview.mockReturnValue(undefined);

    const guard = courseSitePageGuard(['UTA', 'GTA', 'Instructor']);
    const route = buildRoute({});

    TestBed.runInInjectionContext(() => {
      const result$ = guard(route, {} as RouterStateSnapshot) as any;
      result$.subscribe((result: boolean) => {
        expect(result).toBe(false);
        done();
      });
    });
  });
});
