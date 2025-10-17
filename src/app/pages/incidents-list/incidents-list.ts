import { AfterViewInit, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { BehaviorSubject, combineLatest, debounceTime, map, Observable, startWith, tap } from 'rxjs';

import * as L from 'leaflet';

import { IncidentCategory } from '../../models/incident.enums';
import { Incident } from '../../models/incident.model';
import { IncidentsService } from '../../services/incidents.service';

@Component({
  selector: 'app-incidents-list',
  imports: [],
  templateUrl: './incidents-list.html',
  styleUrl: './incidents-list.scss'
})
export class IncidentsList implements OnInit, AfterViewInit, OnDestroy {

  fb = inject(FormBuilder);
  incidentsService = inject(IncidentsService);
  filtersForm: FormGroup;
  incidentCategories = Object.values(IncidentCategory);

  private allIncidents$!: Observable<Incident[]>;
  filteredIncidents$!: Observable<Incident[]>;
  private sortConfig$ = new BehaviorSubject<{ key: keyof Incident; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

  private map!: L.Map;
  private markers: L.Marker[] = [];


  constructor() {
    this.filtersForm = this.fb.group({
      search: [''],
      category: [[]],
      severity: []
    });
  }

  ngOnInit(): void {
    this.allIncidents$ = this.incidentsService.getIncidents();

    const filters$ = this.filtersForm.valueChanges.pipe(
      startWith(this.filtersForm.value),
      debounceTime(300)
    );

    this.filteredIncidents$ = combineLatest([this.allIncidents$, filters$, this.sortConfig$]).pipe(
      map(([incidents, filters, sortConfig]) => {
        let filtered = incidents.filter(incident => {
          const searchMatch = incident.title.toLowerCase().includes(filters.search.toLowerCase());
          const categoryMatch = filters.category.length === 0 || filters.category.includes(incident.category);
          const severityMatch = incident.severity <= filters.severity;
          return searchMatch && categoryMatch && severityMatch;
        });

        filtered.sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
        return filtered;
      }),
      tap(incidents => {
        if (this.map) {
          this.updateMapMarkers(incidents);
        }
      })
    );
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.filteredIncidents$.pipe(tap(incidents => this.updateMapMarkers(incidents))).subscribe();
  }

  private initMap(): void {
    this.map = L.map('map').setView([50.4501, 30.5234], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }

  private updateMapMarkers(incidents: Incident[]): void {
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    incidents.forEach(incident => {
      const marker = L.marker([incident.location.lat, incident.location.lng]).addTo(this.map);
      marker.bindPopup(`<b>${incident.title}</b><br>Категорія: ${incident.category}`);
      this.markers.push(marker);
    });
  }

  setSort(key: keyof Incident): void {
    const currentConfig = this.sortConfig$.value;
    const direction = (currentConfig.key === key && currentConfig.direction === 'desc') ? 'asc' : 'desc';
    this.sortConfig$.next({ key, direction });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}


