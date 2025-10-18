import { AfterViewInit, Component, DestroyRef, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import * as L from 'leaflet';

import { debounceTime, delay, of, switchMap, tap } from 'rxjs';

import { incidentSeverity } from '../../const/incident.const';
import { IncidentCategory } from '../../models/incident.enums';
import { Incident } from '../../models/incident.model';
import { IncidentsService } from '../../services/incidents.service';
import { Loader } from '../../components/loader/loader';

@Component({
  selector: 'app-incidents-list',
  imports: [ReactiveFormsModule, MatSidenavModule, MatIcon, MatButtonModule, MatFormFieldModule, MatInputModule, MatOption, MatSelectModule, MatDatepickerModule, MatNativeDateModule, Loader],
  templateUrl: './incidents-list.html',
  styleUrl: './incidents-list.scss'
})
export class IncidentsList implements OnInit, AfterViewInit, OnDestroy {
  fb = inject(FormBuilder);
  incidentsService = inject(IncidentsService);
  destroyRef = inject(DestroyRef);
  snackbar = inject(MatSnackBar);

  allIncidents = signal<Incident[]>([]);
  isLoading = signal(true);

  filtersForm = this.fb.group({
    category: [[] as string[]],
    severity: [''],
    dateFrom: [],
    dateTo: []
  });

  incidentCategories = Object.values(IncidentCategory);
  incidentSeverity = incidentSeverity;

  private map?: L.Map;
  private markers: L.Marker[] = [];
  filteredIncidents = signal<Incident[]>([]);

  constructor() {
    effect(() => {
      const incidents = this.filteredIncidents();
      if (this.map) {
        this.updateMapMarkers();
        if (!incidents.length) {
          this.openSnackBar('За поточними фільтрами інцидентів не знайдено');
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadIncidents();

    this.filtersForm.valueChanges.pipe(
      tap(() => this.isLoading.set(true)),
      debounceTime(1000),
      switchMap(() => {
        return of(null).pipe(delay(500));
      }),
      takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateFilteredIncidents();
        this.isLoading.set(false)
      });
  }

  private updateFilteredIncidents(): void {
    const { category, severity, dateFrom, dateTo } = this.filtersForm.value;
    const incidents = this.allIncidents();

    const filtered = incidents
      .filter(i => !category?.length || category.includes(i.category))
      .filter(i => !severity || severity === i.severity)
      .filter(i => this.filterByDate(
        i.createdAt,
        dateFrom ?? null,
        dateTo ?? null
      ))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    this.filteredIncidents.set(filtered);
  }

  private loadIncidents(): void {
    this.isLoading.set(true);

    this.incidentsService.getIncidents().pipe(
      delay(2000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        this.allIncidents.set(data);
        this.isLoading.set(false);
        this.updateFilteredIncidents();
        if (!this.map) {
          this.initMap();
        }
      },
      error: () => {
        this.openSnackBar('Помилка завантаження даних');
        this.isLoading.set(false);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.isLoading()) {
      this.initMap();
    }
  }

  private initMap(): void {
    try {
      this.map = L.map('map').setView([50.4501, 30.5234], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.updateMapMarkers();
    } catch (error) {
      this.openSnackBar('Помилка ініціалізації карти');
    }
  }

  private updateMapMarkers(): void {
    if (!this.map) return;

    this.clearMarkers();
    const incidents = this.filteredIncidents();

    incidents.forEach((incident) => {
      const lat = +incident.location?.lat;
      const lng = +incident.location?.lng;

      if (isNaN(lat) || isNaN(lng)) {
        this.openSnackBar(`Некоректні координати для інціденту: ${incident.id}`)
        return;
      }

      const marker = L.marker([lat, lng])
        .addTo(this.map!)
        .bindPopup(this.createPopupContent(incident));

      this.markers.push(marker);
    });

    if (this.markers.length > 0) {
      const group = L.featureGroup(this.markers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private clearMarkers(): void {
    this.markers.forEach(m => this.map?.removeLayer(m));
    this.markers = [];
  }


  private createPopupContent(incident: Incident): string {
    return `
      <div class="incident-popup">
        <h4>${incident.title}</h4>
        <p><strong>Категорія:</strong> ${incident.category}</p>
        <p><strong>Рівень небезпеки:</strong> ${incident.severity}/5</p>
        <p>${incident.description ?? ''}</p>
        <em>${new Date(incident.createdAt).toLocaleDateString()}</em>
      </div>
    `;
  }

  private filterByDate(incidentDate: string, dateFrom: Date | null, dateTo: Date | null): boolean {
    const incidentDateObj = new Date(incidentDate);

    if (dateFrom && incidentDateObj < dateFrom) {
      return false;
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);

      if (incidentDateObj > endOfDay) {
        return false;
      }
    }

    return true;
  }

  refreshData(): void {
    this.loadIncidents();
  }

  resetFilters() {
    this.filtersForm.patchValue({
      category: [],
      severity: '',
      dateFrom: null,
      dateTo: null
    });
  }

  public openSnackBar(message: string, status = '') {
    this.snackbar.open(message, status, {
      duration: 15000
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
