import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayMapComponent } from './display-map.component';

describe('DisplayMapComponent', () => {
  let component: DisplayMapComponent;
  let fixture: ComponentFixture<DisplayMapComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayMapComponent]
    });
    fixture = TestBed.createComponent(DisplayMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
