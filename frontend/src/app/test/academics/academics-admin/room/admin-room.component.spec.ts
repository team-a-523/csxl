import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminRoomComponent } from 'src/app/academics/academics-admin/room/admin-room.component';
import { AcademicsService } from 'src/app/academics/academics.service';

const MOCK_ROOM = {
  id: 'SN014',
  nickname: 'Sitterson 014',
  building: 'SN',
  room: '014',
  capacity: 100,
  reservable: true,
  seats: []
};

describe('AdminRoomComponent', () => {
  let fixture: ComponentFixture<AdminRoomComponent>;
  let component: AdminRoomComponent;
  let routerMock: { navigate: jest.Mock };
  let snackBarMock: { open: jest.Mock };
  let academicsServiceMock: {
    getRooms: jest.Mock;
    deleteRoom: jest.Mock;
  };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    snackBarMock = { open: jest.fn() };
    academicsServiceMock = {
      getRooms: jest.fn().mockReturnValue(of([MOCK_ROOM])),
      deleteRoom: jest.fn().mockReturnValue(of({}))
    };
    snackBarMock.open.mockReturnValue({ onAction: jest.fn().mockReturnValue(of(true)) });

    await TestBed.configureTestingModule({
      declarations: [AdminRoomComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AcademicsService, useValue: academicsServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminRoomComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.rooms()).toHaveLength(1);
  });

  it('createRoom and updateRoom navigate to room editor', () => {
    component.createRoom();
    component.updateRoom(MOCK_ROOM);

    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'room',
      'edit',
      'new'
    ]);
    expect(routerMock.navigate).toHaveBeenCalledWith([
      'academics',
      'room',
      'edit',
      'SN014'
    ]);
  });

  it('deleteRoom removes room and shows success snackbar', () => {
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.deleteRoom(MOCK_ROOM, event);

    expect(academicsServiceMock.deleteRoom).toHaveBeenCalledWith(MOCK_ROOM);
    expect(component.rooms()).toEqual([]);
    expect(snackBarMock.open).toHaveBeenCalledWith('This room has been deleted.', '', {
      duration: 2000
    });
  });

  it('deleteRoom shows error snackbar when API fails', () => {
    academicsServiceMock.deleteRoom.mockReturnValueOnce(
      throwError(() => new Error('delete failed'))
    );
    const event = { stopPropagation: jest.fn() } as unknown as Event;
    component.deleteRoom(MOCK_ROOM, event);

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Delete failed because this room is being used elsewhere.',
      '',
      { duration: 2000 }
    );
  });
});
