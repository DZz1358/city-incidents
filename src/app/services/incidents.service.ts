import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

import { map, Observable } from 'rxjs';

import { Incident } from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentsService {
  private incidentsUrl = 'assets/incidents.json';
  http = inject(HttpClient)

  getIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>(this.incidentsUrl);
  }

  getIncidentById(id: number): Observable<Incident | undefined> {
    return this.getIncidents().pipe(
      map((incidents: Incident[]) => incidents.find(incident => incident.id === id))
    );
  }

}
