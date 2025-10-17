import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Observable, switchMap } from 'rxjs';

import { Incident } from '../../models/incident.model';
import { IncidentsService } from '../../services/incidents.service';

@Component({
  selector: 'app-incident-details',
  imports: [],
  templateUrl: './incident-details.html',
  styleUrl: './incident-details.scss'
})
export class IncidentDetails implements OnInit {
  route = inject(ActivatedRoute);
  incidentsService = inject(IncidentsService);
  location = inject(Location);
  incident$!: Observable<Incident | undefined>;

  ngOnInit(): void {
    this.incident$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        return this.incidentsService.getIncidentById(id);
      })
    );
  }

  goBack(): void {
    this.location.back();
  }
}

