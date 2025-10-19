import { Component, DestroyRef, inject, input, model, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOption, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { debounceTime, tap } from 'rxjs';

import { incidentSeverity } from '../../const/incident.const';
import { IFilters } from '../../models/Filters';
import { IncidentCategory } from '../../models/incident.enums';



@Component({
  selector: 'app-filters',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatOption, MatSelectModule, MatDatepickerModule, MatNativeDateModule,],
  templateUrl: './filters.html',
  styleUrl: './filters.scss'
})
export class Filters {
  fb = inject(FormBuilder);
  destroyRef = inject(DestroyRef);

  readonly initialFilter = input<IFilters>({ category: [], severity: null, dateFrom: null, dateTo: null });

  readonly filterChange = output<IFilters>();
  readonly isLoading = model(false);

  incidentCategories = Object.values(IncidentCategory);
  incidentSeverity = incidentSeverity;

  filtersForm = this.fb.group({
    category: [[] as string[]],
    severity: [null as number | null],
    dateFrom: [null as Date | null],
    dateTo: [null as Date | null]
  });


  constructor() {
    this.filtersForm.valueChanges.pipe(
      tap(() => this.isLoading.set(true)),
      debounceTime(1000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(val => {
      console.log('val', val);
      this.filterChange.emit({
        severity: val.severity != null ? Number(val.severity) : null,
        category: val.category ?? [],
        dateFrom: val.dateFrom ?? null,
        dateTo: val.dateTo ?? null
      });
      this.isLoading.set(false);
    });
  }

  resetFilters() {
    this.filtersForm.patchValue({
      category: [],
      severity: null,
      dateFrom: null,
      dateTo: null
    });
  }
}
