import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class SnackBarService {
  private snackbar = inject(MatSnackBar);

  public openSnackBar(message: string, status = '') {
    this.snackbar.open(message, status, {
      duration: 15000,
    });
  }
}
