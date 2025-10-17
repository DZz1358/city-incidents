export interface Incident {
  id: number;
  title: string;
  category: string;
  severity: number;
  createdAt: string;
  location: Location;
  description: string;
}

export interface Location {
  lat: number;
  lng: number;

}
