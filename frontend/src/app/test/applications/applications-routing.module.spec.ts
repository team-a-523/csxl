/**
 * Unit tests for ApplicationsRoutingModule.
 */

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { ApplicationsRoutingModule } from 'src/app/applications/applications-routing.module';
import { ApplicationFormComponent } from 'src/app/applications/form/application-form.component';

describe('ApplicationsRoutingModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ApplicationsRoutingModule],
      providers: [provideRouter([])]
    });
  });

  it('should create', () => {
    const module = new ApplicationsRoutingModule();
    expect(module).toBeTruthy();
  });

  it('registers the application form route from ApplicationFormComponent.Route', () => {
    const router = TestBed.inject(Router);
    const route = router.config.find(
      (candidate) => candidate.component === ApplicationFormComponent
    );

    expect(route).toBeTruthy();
    expect(route?.path).toBe(ApplicationFormComponent.Route.path);
    expect(route?.title).toBe(ApplicationFormComponent.Route.title);
  });
});
