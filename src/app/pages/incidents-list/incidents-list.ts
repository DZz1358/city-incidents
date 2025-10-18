import { AfterViewInit, Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { debounceTime } from 'rxjs';

import * as L from 'leaflet';

import { IncidentCategory } from '../../models/incident.enums';
import { Incident } from '../../models/incident.model';
import { IncidentsService } from '../../services/incidents.service';

@Component({
  selector: 'app-incidents-list',
  imports: [ReactiveFormsModule],
  templateUrl: './incidents-list.html',
  styleUrl: './incidents-list.scss'
})
export class IncidentsList implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private incidentsService = inject(IncidentsService);

  allIncidents = signal<Incident[]>([]);
  errorMessage = signal('');
  isLoading = signal(true);

  filtersForm = this.fb.group({
    search: [''],
    category: [''],
    severity: [5]
  });

  incidentCategories = Object.values(IncidentCategory);

  private map?: L.Map;
  private markers: L.Marker[] = [];
  filteredIncidents = signal<Incident[]>([]);

  constructor() {
    effect(() => {
      const incidents = this.filteredIncidents();
      if (this.map && incidents.length > 0) {
        this.updateMapMarkers();
      }
    });
  }

  ngOnInit(): void {
    this.loadIncidents();

    this.filtersForm.valueChanges.subscribe(() => {
      this.updateFilteredIncidents();
    });
  }

  private updateFilteredIncidents(): void {
    const { search, category, severity } = this.filtersForm.value;
    const incidents = this.allIncidents();

    const filtered = incidents
      .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()))
      .filter(i => !category?.length || category.includes(i.category))
      .filter(i => !severity || i.severity <= severity)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.filteredIncidents.set(filtered);
    this.updateMapMarkers();
  }

  private loadIncidents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.incidentsService.getIncidents().subscribe({
      next: (data) => {
        this.allIncidents.set(data);
        this.isLoading.set(false);
        this.updateFilteredIncidents();
      },
      error: (err) => {
        this.errorMessage.set('Помилка завантаження даних');
        this.isLoading.set(false);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    try {
      this.map = L.map('map').setView([50.4501, 30.5234], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);

      this.updateMapMarkers();
    } catch (error) {
      this.errorMessage.set('Помилка ініціалізації карти');
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
        console.warn('Некоректні координати для інціденту:', incident.id);
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

  refreshData(): void {
    this.loadIncidents();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
