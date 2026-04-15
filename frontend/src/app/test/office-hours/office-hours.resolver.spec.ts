/**
 * Tests for officeHoursResolver.
 */

import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  ParamMap,
  RouterStateSnapshot
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { officeHoursResolver } from '../../my-courses/course/office-hours/office-hours.resolver';
import { MyCoursesService } from '../../my-courses/my-courses.service';
import { OfficeHours } from '../../my-courses/my-courses.model';

function buildRoute(
  eventId: string,
  courseSiteId: string = '42'
): ActivatedRouteSnapshot {
  return {
    paramMap: {
      get: (key: string) => (key === 'event_id' ? eventId : courseSiteId)
    } as unknown as ParamMap,
    parent: {
      paramMap: {
        get: (key: string) => (key === 'course_site_id' ? courseSiteId : null)
      } as unknown as ParamMap
    }
  } as unknown as ActivatedRouteSnapshot;
}

const MOCK_OH: OfficeHours = {
  id: 7,
  type: 0,
  mode: 0,
  description: 'Test OH',
  location_description: '',
  start_time: new Date('2024-03-01T10:00:00'),
  end_time: new Date('2024-03-01T12:00:00'),
  course_site_id: 42,
  room_id: 'SN 0115',
  recurrence_pattern_id: null,
  recurrence_pattern: null
};

describe('officeHoursResolver', () => {
  let myCoursesServiceMock: any;

  beforeEach(() => {
    myCoursesServiceMock = {
      getOfficeHours: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MyCoursesService, useValue: myCoursesServiceMock }
      ]
    });
  });

  it('returns a default new OfficeHours object when event_id is "new"', () => {
    const route = buildRoute('new');

    TestBed.runInInjectionContext(() => {
      const result = officeHoursResolver(route, {} as RouterStateSnapshot);

      (expect as any)(result).toMatchObject({
        id: -1,
        type: 0,
        mode: 0,
        description: '',
        location_description: ''
      });
    });
  });

  it('calls getOfficeHours when event_id is a number', (done) => {
    myCoursesServiceMock.getOfficeHours.mockReturnValue(of(MOCK_OH));
    const route = buildRoute('7', '42');

    TestBed.runInInjectionContext(() => {
      const result$ = officeHoursResolver(
        route,
        {} as RouterStateSnapshot
      ) as any;
      result$.subscribe((oh: OfficeHours | undefined) => {
        expect(myCoursesServiceMock.getOfficeHours).toHaveBeenCalledWith(42, 7);
        expect(oh).toEqual(MOCK_OH);
        done();
      });
    });
  });

  it('returns undefined when getOfficeHours throws an error', (done) => {
    myCoursesServiceMock.getOfficeHours.mockReturnValue(
      throwError(() => new Error('Not found'))
    );
    const route = buildRoute('99', '42');

    TestBed.runInInjectionContext(() => {
      const result$ = officeHoursResolver(
        route,
        {} as RouterStateSnapshot
      ) as any;
      result$.subscribe((oh: OfficeHours | undefined) => {
        expect(oh).toBeUndefined();
        done();
      });
    });
  });
});
