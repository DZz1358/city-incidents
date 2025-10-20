export function filterByDate(
  incidentDate: string,
  dateFrom: Date | null,
  dateTo: Date | null,
): boolean {
  const incidentDateObj = new Date(incidentDate);

  if (dateFrom && incidentDateObj < dateFrom) {
    return false;
  }

  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);

    if (incidentDateObj > endOfDay) {
      return false;
    }
  }

  return true;
}
