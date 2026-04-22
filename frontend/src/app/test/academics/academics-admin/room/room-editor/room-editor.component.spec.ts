import { DatePipe } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { RoomEditorComponent } from 'src/app/academics/academics-admin/room/room-editor/room-editor.component';
import { AcademicsService } from 'src/app/academics/academics.service';

const MOCK_PROFILE = { onyen: 'admin' };
const MOCK_ROOM = {
  id: 'SN014',
  nickname: 'Sitterson 014',
  building: 'SN',
  room: '014',
  capacity: 100,
  reservable: true,
  seats: []
};

describe('RoomEditorComponent', () => {
  let fixture: ComponentFixture<RoomEditorComponent>;
  let component: RoomEditorComponent;
  let routerMock: { navigate: jest.Mock };
  let snackBarMock: { open: jest.Mock };
  let academicsServiceMock: {
    createRoom: jest.Mock;
    updateRoom: jest.Mock;
  };

  beforeEach(async () => {
    routerMock = { navigate: jest.fn() };
    snackBarMock = { open: jest.fn() };
    academicsServiceMock = {
      createRoom: jest.fn().mockReturnValue(of(MOCK_ROOM)),
      updateRoom: jest.fn().mockReturnValue(of(MOCK_ROOM))
    };

    await TestBed.configureTestingModule({
      declarations: [RoomEditorComponent],
      imports: [ReactiveFormsModule],
      providers: [
        DatePipe,
        { provide: Router, useValue: routerMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AcademicsService, useValue: academicsServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { profile: MOCK_PROFILE, room: MOCK_ROOM },
              params: { id: 'SN014' }
            }
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(RoomEditorComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => jest.clearAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.roomForm.value.nickname).toBe('Sitterson 014');
  });

  it('onSubmit updates existing room', () => {
    component.roomId = 'SN014';
    component.roomForm.patchValue({ nickname: 'Updated Room' });

    component.onSubmit();

    expect(academicsServiceMock.updateRoom).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/academics/admin/room']);
    expect(snackBarMock.open).toHaveBeenCalledWith('Room Updated', '', {
      duration: 2000
    });
  });

  it('onSubmit creates new room', () => {
    component.roomId = 'new';
    component.room = { ...MOCK_ROOM, id: 'SN999' };

    component.onSubmit();

    expect(academicsServiceMock.createRoom).toHaveBeenCalled();
    expect(snackBarMock.open).toHaveBeenCalledWith('Room Created', '', {
      duration: 2000
    });
  });

  it('onSubmit shows error snackbar when create fails', () => {
    component.roomId = 'new';
    academicsServiceMock.createRoom.mockReturnValueOnce(
      throwError(() => new Error('create failed'))
    );

    component.onSubmit();

    expect(snackBarMock.open).toHaveBeenCalledWith('Error: Room Not Created', '', {
      duration: 2000
    });
  });
});
