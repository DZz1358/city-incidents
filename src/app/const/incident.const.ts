import { IncidentSeverity } from "../models/incident.enums";

export const incidentSeverity = [
  { value: '', label: IncidentSeverity.All },
  { value: 1, label: IncidentSeverity.Low },
  { value: 2, label: IncidentSeverity.Minor },
  { value: 3, label: IncidentSeverity.Medium },
  { value: 4, label: IncidentSeverity.High },
  { value: 5, label: IncidentSeverity.Critical }
];
