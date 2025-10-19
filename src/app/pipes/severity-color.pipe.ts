import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'severityColor'
})
export class SeverityColorPipe implements PipeTransform {

  transform(severity: number): string {
    switch (severity) {
      case 1: return 'low';
      case 2: return 'minor';
      case 3: return 'medium';
      case 4: return 'high';
      case 5: return 'critical';
      default: return 'low';
    }
  }
}
