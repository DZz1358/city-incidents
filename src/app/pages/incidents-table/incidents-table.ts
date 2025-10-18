import { AfterViewInit, Component, DestroyRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

import { debounceTime, delay, distinctUntilChanged, Subject, tap } from 'rxjs';

import { Incident } from '../../models/incident.model';
import { IncidentsService } from '../../services/incidents.service';
import { Loader } from '../../components/loader/loader';

@Component({
  selector: 'app-incidents-table',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSidenavModule, MatButtonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatIcon, DatePipe, Loader],
  templateUrl: './incidents-table.html',
  styleUrl: './incidents-table.scss'
})
export class IncidentsTable implements AfterViewInit, OnInit {
  incidentsService = inject(IncidentsService);
  destroyRef = inject(DestroyRef);
  snackbar = inject(MatSnackBar);

  displayedColumns: string[] = ['id', 'title', 'category', 'severity', 'createdAt', 'location', 'settings'];
  dataSource = new MatTableDataSource<Incident>([]);
  private searchSubject = new Subject<string>();

  isLoading = signal(true);

  readonly paginator = viewChild.required<MatPaginator>('paginator');
  readonly sort = viewChild.required<MatSort>('sort');

  ngOnInit() {
    this.loadIncidents();

    this.searchSubject.pipe(
      tap(() => this.isLoading.set(true)),
      debounceTime(1000),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(filterValue => {
      this.dataSource.filter = filterValue.trim().toLowerCase();
      this.isLoading.set(false);
    });
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
    console.log('Navigate to incident:', id);
  }

  getSeverityColor(severity: number): string {
    switch (severity) {
      case 1: return 'low';
      case 2: return 'minor';
      case 3: return 'medium';
      case 4: return 'high';
      case 5: return 'critical';
      default: return 'low';
    }
  }


  public openSnackBar(message: string) {
    this.snackbar.open(message, 'Закрити', {
      duration: 5000
    });
  }
}
