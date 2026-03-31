/**
 * Date picker on "New Reservation" — drives ReservationTableService selected date.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { DateSelector } from '../../../../coworking/widgets/date-selector/date-selector.widget';
import { ReservationTableService } from '../../../../coworking/room-reservation/reservation-table.service';

describe('DateSelector (hallway room booking)', () => {
  let fixture: ComponentFixture<DateSelector>;
  let component: DateSelector;

  const tableServiceMock = {
    setMinDate: jest.fn(() => new Date('2024-01-10')),
    setMaxDate: jest.fn(() => new Date('2024-01-20')),
    setSelectedDate: jest.fn()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DateSelector],
      providers: [
        { provide: ReservationTableService, useValue: tableServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(DateSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sets min and max from ReservationTableService', () => {
    expect(tableServiceMock.setMinDate).toHaveBeenCalled();
    expect(tableServiceMock.setMaxDate).toHaveBeenCalled();
    expect(component.minDate).toEqual(new Date('2024-01-10'));
    expect(component.maxDate).toEqual(new Date('2024-01-20'));
  });

  it('onDateChange formats date and updates selected date', () => {
    const d = new Date(2024, 5, 15);
    component.onDateChange({ value: d } as any);
    expect(tableServiceMock.setSelectedDate).toHaveBeenCalledWith(
      d.toLocaleDateString()
    );
  });
});
