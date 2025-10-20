import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import * as L from 'leaflet';

import { Header } from './shared/components/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('city-incidents');

  constructor() {
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/assets/leaflet/images/marker-icon-2x.png',
      iconUrl: '/assets/leaflet/images/marker-icon.png',
      shadowUrl: '/assets/leaflet/images/marker-shadow.png',
    });
  }
}
