import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';

import * as L from 'leaflet';

import { catchError, delay, map, of, switchMap } from 'rxjs';

import { SeverityColorPipe } from '../../core/pipes/severity-color.pipe';
import { SeverityTextPipe } from '../../core/pipes/severity-text.pipe';
import { IncidentsService } from '../../core/services/incidents.service';
import { SnackBarService } from '../../core/services/snack-bar.service';
import { Loader } from '../../shared/components/loader/loader';

@Component({
  selector: 'app-incident-details',
  imports: [
    MatIcon,
    Loader,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    DatePipe,
    MatButton,
    SeverityColorPipe,
    SeverityTextPipe,
  ],
  templateUrl: './incident-details.html',
  styleUrl: './incident-details.scss',
})
export class IncidentDetails {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private incidentsService = inject(IncidentsService);
  private snackBarService = inject(SnackBarService);

  private map?: L.Map = undefined;
  private markers = signal<L.Marker[]>([]);

  protected isLoading = computed<boolean>(() => this.incident() === null);
  private incidentId = toSignal<string | null>(
    this.route.paramMap.pipe(map((params) => params.get('id'))),
  );

  protected incident = toSignal(
    toObservable(this.incidentId).pipe(
      switchMap((id) =>
        this.incidentsService.getIncidentById(Number(id)).pipe(
          delay(2000),
          catchError(() => {
            this.snackBarService.openSnackBar('Не вдалося завантажити дані інцеденту');
            return of(null);
          }),
        ),
      ),
    ),
    { initialValue: null },
  );

  private mapEffect = effect(() => {
    if (!this.isLoading() && this.incident() && !this.map) {
      const currentIncident = this.incident();
      if (!currentIncident?.location) {
        return;
      }
      try {
        this.map = L.map('map').setView(
          [currentIncident.location.lat, currentIncident.location.lng],
          12,
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(this.map);
        this.updateMapMarkers();
      } catch (error) {
        this.snackBarService.openSnackBar('Помилка ініціалізації карти');
      }
    }
  });

  updateMapMarkers(): void {
    if (!this.map) return;
    this.clearMarkers();
    this.addMarker();
  }

  private addMarker(): void {
    const currentIncident = this.incident();
    if (!currentIncident) return;

    const lat = +currentIncident.location?.lat;
    const lng = +currentIncident.location?.lng;
    if (isNaN(lat) || isNaN(lng)) {
      this.snackBarService.openSnackBar(`Некоректні координати для інціденту: ${currentIncident.id}`);
      return;
    }
    const marker = L.marker([lat, lng])
      .addTo(this.map!)
    this.markers.set([...this.markers(), marker]);
  }

  private clearMarkers(): void {
    this.markers().forEach((marker) => marker.remove());
    this.markers.set([]);
  }

  goBack() {
    this.router.navigate(['/incidents']);
  }
}
