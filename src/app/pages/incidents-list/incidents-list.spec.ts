import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentsList } from './incidents-list';

describe('IncidentsList', () => {
  let component: IncidentsList;
  let fixture: ComponentFixture<IncidentsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
