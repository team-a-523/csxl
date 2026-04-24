import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AcademicsAdminComponent } from 'src/app/academics/academics-admin/academics-admin.component';
import { ProfileService } from 'src/app/profile/profile.service';

const MOCK_PROFILE = {
  id: 7,
  pid: 7,
  onyen: 'student',
  first_name: 'Test',
  last_name: 'User',
  email: 'test@unc.edu',
  pronouns: '',
  github: null,
  github_id: null,
  github_avatar: null,
  linkedin: null,
  website: null,
  biography: null
};

describe('AcademicsAdminComponent', () => {
  let fixture: ComponentFixture<AcademicsAdminComponent>;
  let component: AcademicsAdminComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AcademicsAdminComponent],
      providers: [{ provide: ProfileService, useValue: { profile$: of(MOCK_PROFILE) } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AcademicsAdminComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('exposes admin navigation links', () => {
    expect(component.links).toHaveLength(4);
    expect(component.links.map((link) => link.label)).toEqual([
      'Sections',
      'Courses',
      'Rooms',
      'Terms'
    ]);
  });

  it('keeps profile stream from service', (done) => {
    component.profile$.subscribe((profile) => {
      expect(profile?.onyen).toBe('student');
      done();
    });
  });
});
