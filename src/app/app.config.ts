import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './core/routes/app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'uk-UA' },
  ],
};
