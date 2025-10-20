import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'severityText',
})
export class SeverityTextPipe implements PipeTransform {
  private severityMap: { [key: number]: string } = {
    1: 'Низький',
    2: 'Помірний',
    3: 'Середній',
    4: 'Високий',
    5: 'Критичний',
  };

  transform(severity: number): string {
    return this.severityMap[severity] || 'Невідомо';
  }
}
