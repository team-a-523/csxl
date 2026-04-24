import { AcademicsModule } from 'src/app/academics/academics.module';

describe('AcademicsModule', () => {
  it('should create', () => {
    expect(new AcademicsModule()).toBeTruthy();
  });

  it('should expose module class', () => {
    expect(AcademicsModule.name).toBe('AcademicsModule');
  });

  it('should keep module constructor defined', () => {
    expect(typeof AcademicsModule).toBe('function');
  });
});
