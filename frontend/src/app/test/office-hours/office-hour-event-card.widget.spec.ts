/**
 * Tests for OfficeHourEventCardWidget.
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { OfficeHourEventCardWidget } from '../../my-courses/course/office-hours/widgets/office-hour-event-card/office-hour-event-card.widget';
import { MyCoursesService } from '../../my-courses/my-courses.service';
import { OfficeHourEventOverview } from '../../my-courses/my-courses.model';

const MOCK_EVENT: OfficeHourEventOverview = {
  id: 3,
  type: 'Office Hours',
  mode: 'In-Person',
  description: '',
  location: 'SN 0115',
  location_description: '',
  start_time: new Date('2024-03-01T10:00:00'),
  end_time: new Date('2024-03-01T12:00:00'),
  queued: 0,
  total_tickets: 0,
  recurrence_pattern_id: 0
};

describe('OfficeHourEventCardWidget', () => {
  let component: OfficeHourEventCardWidget;
  let fixture: ComponentFixture<OfficeHourEventCardWidget>;

  const myCoursesServiceMock = {
    getOfficeHoursRole: jest.fn(() => of({ role: 'UTA' }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
    myCoursesServiceMock.getOfficeHoursRole.mockReturnValue(of({ role: 'UTA' }));

    TestBed.configureTestingModule({
      declarations: [OfficeHourEventCardWidget],
      imports: [],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MyCoursesService, useValue: myCoursesServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(OfficeHourEventCardWidget);
    component = fixture.componentInstance;
    component.event = MOCK_EVENT;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('editRoute defaults to empty string', () => {
    expect(component.editRoute).toBe('');
  });

  it('ngOnInit calls getOfficeHoursRole and sets role$', fakeAsync(() => {
    fixture.detectChanges(); // triggers ngOnInit
    tick();

    component.role$.subscribe((role) => {
      expect(role).toBe('UTA');
    });

    expect(myCoursesServiceMock.getOfficeHoursRole).toHaveBeenCalledWith(
      MOCK_EVENT.id
    );
  }));

  it('role$ emits empty string before ngOnInit', () => {
    component.role$.subscribe((role) => {
      expect(role).toBe('');
    });
  });
});
