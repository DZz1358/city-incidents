import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';

import * as L from 'leaflet';

import { catchError, debounceTime, delay, finalize, of, tap } from 'rxjs';

import { initialFilterValue } from '../../core/const/incident.const';
import { IFilters } from '../../core/models/filters.model';
import { Incident } from '../../core/models/incident.model';
import { IncidentsService } from '../../core/services/incidents.service';
import { SnackBarService } from '../../core/services/snack-bar.service';
import { filterByDate } from '../../shared/utils/filter-by-date';
import { Filters } from '../../shared/components/filters/filters';
import { Loader } from '../../shared/components/loader/loader';

@Component({
  selector: 'app-incidents-list',
  imports: [MatSidenavModule, MatIcon, Loader, Filters, MatButtonModule],
  templateUrl: './incidents-list.html',
  styleUrl: './incidents-list.scss',
})
export class IncidentsList {
  private snackBarService = inject(SnackBarService);
  private incidentsService = inject(IncidentsService);
  private destroyRef = inject(DestroyRef);

  protected isLoading = signal(true);
  protected filter = signal<IFilters>(initialFilterValue);

  private map?: L.Map = undefined;
  private markers = signal<L.Marker[]>([]);

  private filteredIncidents = computed(() => {
    const { category, severity, dateFrom, dateTo } = this.filter();
    return this.allIncidents()
      .filter((i) => !category?.length || category.includes(i.category))
      .filter((i) => !severity || severity === i.severity)
      .filter((i) => filterByDate(i.createdAt, dateFrom ?? null, dateTo ?? null))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
        if (!this.map) {
          this.initMap();
        }
      }),
    ),
    { initialValue: [] as Incident[] },
  );

  private subscribeOnUpdate = toObservable(this.filteredIncidents).pipe(
    debounceTime(300),
    tap((incidents: Incident[]) => {
      this.updateMapMarkers();

      if (this.map) {
        this.updateMapMarkers();

        if (!incidents.length) {
          this.snackBarService.openSnackBar('За поточними фільтрами інцидентів не знайдено');
        }
      }
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  constructor() {
    this.subscribeOnUpdate.subscribe();
    this.destroyRef.onDestroy(() => {
      this.map?.remove();
    });
  }

  protected onFilterChange(newFilter: IFilters): void {
    this.filter.set(newFilter);
  }

  private initMap(): void {
    try {
      this.map = L.map('map').setView([50.4501, 30.5234], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);

      this.updateMapMarkers();
    } catch (error) {
      this.snackBarService.openSnackBar('Помилка ініціалізації карти');
    }
  }

  private updateMapMarkers(): void {
    if (!this.map) return;

    this.clearMarkers();
    this.addMarkers();
    this.checkMarkers();
  }

  private addMarkers(): void {
    this.filteredIncidents().forEach((incident: Incident) => {
      const lat = +incident.location?.lat;
      const lng = +incident.location?.lng;

      if (isNaN(lat) || isNaN(lng)) {
        this.snackBarService.openSnackBar(`Некоректні координати для інціденту: ${incident.id}`);
        return;
      }

      const marker = L.marker([lat, lng])
        .addTo(this.map!)
        .bindPopup(this.createPopupContent(incident));
      this.markers.set([...this.markers(), marker]);
    });
  }

  private checkMarkers(): void {
    if (this.markers().length > 0 && this.map) {
      const group = L.featureGroup(this.markers());
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private clearMarkers(): void {
    this.markers().forEach((m) => this.map?.removeLayer(m));
    this.markers.set([]);
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
}
