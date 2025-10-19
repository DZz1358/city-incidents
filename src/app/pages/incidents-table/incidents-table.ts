import { AfterViewInit, Component, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOption } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';

import { debounceTime, delay, distinctUntilChanged, Subject, tap } from 'rxjs';

import { incidentSeverity } from '../../const/incident.const';
import { IFilters } from '../../models/filters.model';
import { IncidentCategory } from '../../models/incident.enums';
import { Incident } from '../../models/incident.model';
import { SeverityColorPipe } from '../../pipes/severity-color.pipe';
import { SeverityTextPipe } from '../../pipes/severity-text.pipe';
import { IncidentsService } from '../../services/incidents.service';
import { Filters } from '../../components/filters/filters';
import { Loader } from '../../components/loader/loader';

@Component({
  selector: 'app-incidents-table',
  imports: [FormsModule, ReactiveFormsModule, SeverityColorPipe, SeverityTextPipe, MatSelectModule, MatDatepickerModule, MatFormFieldModule, MatInputModule, MatSidenavModule, MatButtonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatIcon, DatePipe, Loader, Filters],
  templateUrl: './incidents-table.html',
  styleUrl: './incidents-table.scss'
})
export class IncidentsTable implements AfterViewInit, OnInit {
  fb = inject(FormBuilder);
  incidentsService = inject(IncidentsService);
  destroyRef = inject(DestroyRef);
  snackbar = inject(MatSnackBar);
  router = inject(Router);


  displayedColumns: string[] = ['id', 'title', 'category', 'severity', 'createdAt', 'location', 'settings'];
  dataSource = new MatTableDataSource<Incident>([]);
  searchSubject = new Subject<string>();
  filter = signal<IFilters>({ category: [], severity: null, dateFrom: null, dateTo: null });
  originalData = signal<Incident[]>([]);
  isLoading = signal(true);
  incidentCategories = signal(Object.values(IncidentCategory));
  incidentSeverity = signal(incidentSeverity);

  readonly paginator = viewChild.required<MatPaginator>('paginator');
  readonly sort = viewChild.required<MatSort>('sort');

  ngOnInit() {
    this.loadIncidents();

    this.searchSubject.pipe(
      tap(() => this.isLoading.set(true)),
      debounceTime(500),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(filterValue => {
      this.dataSource.filter = filterValue.trim().toLowerCase();
      this.isLoading.set(false);
    });
  }

  onFilterChange(newFilter: IFilters) {
    this.filter.set(newFilter);
    this.updateFilteredIncidents();
  }
  private updateFilteredIncidents(): void {
    const { category, severity, dateFrom, dateTo } = this.filter();
    const filteredData = this.originalData().filter(item => {
      const matchesCategory = !category?.length || category.includes(item.category);
      const matchesSeverity = !severity || item.severity === severity;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const incidentDate = new Date(item.createdAt);
        incidentDate.setHours(0, 0, 0, 0);

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && incidentDate >= fromDate;
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && incidentDate <= toDate;
        }
      }

      return matchesCategory && matchesSeverity && matchesDate;
    });

    this.dataSource.data = filteredData;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort();
    this.dataSource.paginator = this.paginator();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'createdAt':
          return new Date(item.createdAt).getTime();
        case 'severity':
          return item.severity;
        default:
          return (item as any)[property];
      }
    };

    this.dataSource.filterPredicate = (data: Incident, filter: string) => {
      const searchStr = filter.toLowerCase();
      return data.title.toLowerCase().includes(searchStr);
    };
  }

  private loadIncidents(): void {
    this.isLoading.set(true);

    this.incidentsService.getIncidents().pipe(
      delay(2000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.originalData.set(data);
        this.dataSource.data = data;
        this.isLoading.set(false);
      },
      error: () => {
        this.openSnackBar('Помилка завантаження даних');
        this.isLoading.set(false);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  navigateToDetailsIncident(id: number) {
    this.router.navigate([`/incidents/${id}`])
  }

  public openSnackBar(message: string) {
    this.snackbar.open(message, 'Закрити', {
      duration: 5000
    });
  }
}
