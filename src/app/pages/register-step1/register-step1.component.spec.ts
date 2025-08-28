import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterStep1Component } from './register-step1.component';

describe('RegisterStep1Component', () => {
  let component: RegisterStep1Component;
  let fixture: ComponentFixture<RegisterStep1Component>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegisterStep1Component]
    });
    fixture = TestBed.createComponent(RegisterStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
