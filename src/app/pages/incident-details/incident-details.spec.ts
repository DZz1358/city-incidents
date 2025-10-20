import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentDetails } from './incident-details';

describe('IncidentDetails', () => {
  let component: IncidentDetails;
  let fixture: ComponentFixture<IncidentDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(IncidentDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
