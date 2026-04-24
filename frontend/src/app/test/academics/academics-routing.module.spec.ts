import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { AcademicsRoutingModule } from 'src/app/academics/academics-routing.module';
import { AcademicsAdminComponent } from 'src/app/academics/academics-admin/academics-admin.component';
import { CourseEditorComponent } from 'src/app/academics/academics-admin/course/course-editor/course-editor.component';

describe('AcademicsRoutingModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AcademicsRoutingModule],
      providers: [provideRouter([])]
    });
  });

  it('should create', () => {
    expect(new AcademicsRoutingModule()).toBeTruthy();
  });

  it('registers admin route', () => {
    const router = TestBed.inject(Router);
    const adminRoute = router.config.find(
      (candidate) => candidate.component === AcademicsAdminComponent
    );

    expect(adminRoute?.path).toBe('admin');
    expect(adminRoute?.children?.length).toBe(4);
  });

  it('registers editor route definitions', () => {
    const router = TestBed.inject(Router);
    const courseEditor = router.config.find(
      (candidate) => candidate.component === CourseEditorComponent
    );

    expect(courseEditor?.path).toBe(CourseEditorComponent.Route.path);
    expect(courseEditor?.title).toBe(CourseEditorComponent.Route.title);
  });
});
