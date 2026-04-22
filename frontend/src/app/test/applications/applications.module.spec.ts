/**
 * Unit tests for ApplicationsModule.
 */

import { TestBed } from '@angular/core/testing';
import { ApplicationsModule } from 'src/app/applications/applications.module';
import { ApplicationFormComponent } from 'src/app/applications/form/application-form.component';
import { ApplicationFormFieldWidget } from 'src/app/applications/widgets/application-form-field-widget/application-form-field.widget';

describe('ApplicationsModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsModule]
    }).compileComponents();
  });

  it('should create', () => {
    const module = new ApplicationsModule();
    expect(module).toBeTruthy();
  });

  it('declares application form and form field widget components', () => {
    const declarations: any[] = (ApplicationsModule as any).ɵmod.declarations;

    expect(declarations).toContain(ApplicationFormComponent);
    expect(declarations).toContain(ApplicationFormFieldWidget);
  });
});
