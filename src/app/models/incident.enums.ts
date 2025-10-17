export enum IncidentCategory {
  CommunalAccident = 'Комунальна аварія',
  TrafficAccident = 'ДТП',
  Fire = 'Пожежа',
  Vandalism = 'Вандалізм',
  PowerOutage = 'Відключення електроенергії',
  GasLeak = 'Витік газу',
  Flooding = 'Підтоплення',
  RoadWork = 'Дорожні роботи',
  Protest = 'Мітинг/Протест',
  Theft = 'Крадіжка',
  BuildingCollapse = 'Обвал будівлі',
  PublicDisturbance = 'Громадський безлад',
  AnimalAttack = 'Напад тварини',
  HazardousMaterial = 'Небезпечні речовини',
  WeatherAlert = 'Негода',
  MissingPerson = 'Зникла людина',
  InfrastructureFailure = 'Поломка інфраструктури',
  Explosion = 'Вибух',
  TransportDisruption = 'Збій транспорту',
  MedicalEmergency = 'Медична надзвичайна ситуація'
}

export enum IncidentSeverity {
  Low = 1,
  Minor = 2,
  Medium = 3,
  High = 4,
  Critical = 5,
}
