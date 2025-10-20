import {
  AfterViewInit,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';

import { catchError, delay, finalize, of } from 'rxjs';

import { incidentSeverity, initialFilterValue } from '../../core/const/incident.const';
import { IFilters } from '../../core/models/filters.model';
import { IncidentCategory } from '../../core/models/incident.enums';
import { Incident } from '../../core/models/incident.model';
import { SeverityColorPipe } from '../../core/pipes/severity-color.pipe';
import { SeverityTextPipe } from '../../core/pipes/severity-text.pipe';
import { IncidentsService } from '../../core/services/incidents.service';
import { SnackBarService } from '../../core/services/snack-bar.service';
import { filterByDate } from '../../shared/utils/filter-by-date';
import { Filters } from '../../shared/components/filters/filters';
import { Loader } from '../../shared/components/loader/loader';

@Component({
  selector: 'app-incidents-table',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SeverityColorPipe,
    SeverityTextPipe,
    MatSelectModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIcon,
    DatePipe,
    Loader,
    Filters,
  ],
  templateUrl: './incidents-table.html',
  styleUrl: './incidents-table.scss',
})
export class IncidentsTable implements AfterViewInit {
  private incidentsService = inject(IncidentsService);
  private snackBarService = inject(SnackBarService);
  private router = inject(Router);

  protected displayedColumns: string[] = [
    'id',
    'title',
    'category',
    'severity',
    'createdAt',
    'location',
    'settings',
  ];
  protected dataSource = new MatTableDataSource<Incident>([]);
  protected filter = signal<IFilters>(initialFilterValue);
  protected originalData = signal<Incident[]>([]);
  protected isLoading = signal<boolean>(true);
  protected incidentCategories = signal(Object.values(IncidentCategory));
  protected incidentSeverity = signal(incidentSeverity);
  protected search = signal('');

  readonly paginator = viewChild.required<MatPaginator>('paginator');
  readonly sort = viewChild.required<MatSort>('sort');

  protected filteredIncidents = computed(() => {
    const { category, severity, dateFrom, dateTo } = this.filter();
    const searchTerm = this.search().toLowerCase().trim();

    return this.originalData().filter((item) => {
      const matchesCategory = !category?.length || category.includes(item.category);
      const matchesSeverity = !severity || item.severity === severity;
      const matchesDate = filterByDate(item.createdAt, dateFrom, dateTo);
      const matchesSearch = !searchTerm || item.title.toLowerCase().includes(searchTerm);

      return matchesCategory && matchesSeverity && matchesDate && matchesSearch;
    });
  });

  private dataSourceUpdateEffect = effect(() => {
    const filteredData = this.filteredIncidents();
    this.dataSource.data = filteredData;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  });

  private syncOriginalDataEffect = effect(() => {
    this.originalData.set(this.allIncidents());
  });

  private allIncidents = toSignal(
    this.incidentsService.getIncidents().pipe(
      delay(2000),
      catchError(() => {
        this.snackBarService.openSnackBar('Не вдалося завантажити дані інцеденту');
        return of([] as Incident[]);
      }),
      finalize(() => {
        this.isLoading.set(false);
      }),
    ),
    { initialValue: [] as Incident[] },
  );

  ngAfterViewInit(): void {
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
  }

  onFilterChange(newFilter: IFilters): void {
    this.filter.set(newFilter);
  }

  applyFilter(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }
  navigateToDetailsIncident(id: number): void {
    this.router.navigate([`/incidents/${id}`]);
  }

}
