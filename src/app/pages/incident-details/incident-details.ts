import { AfterViewInit, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { DatePipe } from '@angular/common';
import { MatButton } from '@angular/material/button';

import * as L from 'leaflet';

import { delay } from 'rxjs';

import { Incident } from '../../models/incident.model';
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
export class IncidentDetails implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private incidentsService = inject(IncidentsService);
  private snackbar = inject(MatSnackBar);
  destroyRef = inject(DestroyRef);

  private map?: L.Map;
  private markers: L.Marker[] = [];

  incident = signal<Incident | null>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.loadIncident();
  }

  ngAfterViewInit(): void {
    if (!this.isLoading()) {
      this.initMap();
    }
  }

  private loadIncident(): void {
    this.isLoading.set(true);

    const incidentId = this.route.snapshot.paramMap.get('id');

    if (!incidentId) {
      this.openSnackBar('ID інциденту не знайдено');
      this.isLoading.set(false);
      return;
    }

    this.incidentsService.getIncidentById(+incidentId).pipe(
      delay(2000),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (incident) => {
        this.incident.set(incident!);
        this.isLoading.set(false);
        if (!this.map) {
          this.initMap();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.openSnackBar('Не вдалося завантажити дані інцеденту');
      }
    });
  }

  private initMap(): void {
    const currentIncident = this.incident();
    if (!currentIncident?.location) {
      return;
    }

    try {
      this.map = L.map('map').setView([50.4501, 30.5234], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
      this.updateMapMarkers()
    } catch (error) {
      this.openSnackBar('Помилка ініціалізації карти');
    }
  }

  private updateMapMarkers(): void {
    if (!this.map) return;

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

  private openSnackBar(message: string) {
    this.snackbar.open(message, 'Закрити', {
      duration: 5000
    });
  }
}
