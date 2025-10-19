import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';

import * as L from 'leaflet';

import { catchError, delay, map, of, switchMap } from 'rxjs';

import { SeverityColorPipe } from '../../pipes/severity-color.pipe';
import { SeverityTextPipe } from '../../pipes/severity-text.pipe';
import { IncidentsService } from '../../services/incidents.service';
import { Loader } from '../../components/loader/loader';


@Component({
  selector: 'app-incident-details',
  imports: [MatIcon, Loader, MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, DatePipe, MatButton, SeverityColorPipe, SeverityTextPipe],
  templateUrl: './incident-details.html',
  styleUrl: './incident-details.scss'
})
export class IncidentDetails {
  route = inject(ActivatedRoute);
  router = inject(Router);
  incidentsService = inject(IncidentsService);
  snackbar = inject(MatSnackBar);

  map?: L.Map;
  markers: L.Marker[] = [];

  isLoading = computed<boolean>(() => this.incident() === null);
  incidentId = toSignal<string | null>(this.route.paramMap.pipe(
    map(params => params.get('id'))
  ));

  incident = toSignal(
    toObservable(this.incidentId).pipe(
      switchMap(id => this.incidentsService.getIncidentById(Number(id))
        .pipe(
          delay(2000),
          catchError(() => {
            this.openSnackBar('Не вдалося завантажити дані інцеденту');
            return of(null);
          })
        ),
      )
    ),
    { initialValue: null }
  );

  mapEffect = effect(() => {
    if (!this.isLoading() && this.incident()) {
      this.initMap();
    }
  });

  initMap(): void {
    const currentIncident = this.incident();
    if (!currentIncident?.location) {
      return;
    }
    try {
      this.map = L.map('map').setView([currentIncident.location.lat, currentIncident.location.lng], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
      this.updateMapMarkers()
    } catch (error) {
      this.openSnackBar('Помилка ініціалізації карти');
    }
  }

  updateMapMarkers(): void {
    if (!this.map) return;

    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    const currentIncident = this.incident();
    if (!currentIncident) return;

    const lat = +currentIncident.location?.lat;
    const lng = +currentIncident.location?.lng;
    if (isNaN(lat) || isNaN(lng)) {
      this.openSnackBar(`Некоректні координати для інціденту: ${currentIncident.id}`)
      return;
    }
    const marker = L.marker([lat, lng])
      .addTo(this.map!)
    this.markers.push(marker);
  }

  goBack() {
    this.router.navigate(['/incidents']);
  }

  openSnackBar(message: string) {
    this.snackbar.open(message, 'Закрити', {
      duration: 5000
    });
  }
}
