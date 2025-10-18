import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IncidentsTable } from './incidents-table';

describe('IncidentsTable', () => {
  let component: IncidentsTable;
  let fixture: ComponentFixture<IncidentsTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncidentsTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IncidentsTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
