// Plano de zonas comerciales 2026.10. Un estado pertenece a una sola zona;
// los estados que el plano no menciona caen en "Sin zona asignada" y van a la
// rotación.
export const MX_STATES = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de México',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
] as const;
export type MxState = (typeof MX_STATES)[number];

export interface Zone {
  id: string;
  base: string;
  territory: string;
  states: MxState[];
  // Asesor fijo de la zona; null significa rotación.
  ownerId: string | null;
}

export const ZONES: Zone[] = [
  {
    id: 'valle-mexico',
    base: 'CDMX',
    territory: 'Valle de México',
    states: ['Ciudad de México', 'Estado de México'],
    ownerId: null,
  },
  {
    id: 'bajio',
    base: 'León',
    territory: 'Bajío',
    states: ['Guanajuato', 'Aguascalientes', 'Zacatecas'],
    ownerId: null,
  },
  {
    id: 'occidente',
    base: 'Guadalajara',
    territory: 'Guadalajara / Occidente',
    states: ['Jalisco', 'Nayarit', 'Michoacán'],
    ownerId: 'gabriel',
  },
  {
    id: 'pacifico',
    base: 'Manzanillo',
    territory: 'Pacífico Portuario',
    states: ['Colima'],
    ownerId: 'gabriel',
  },
  {
    id: 'noroeste',
    base: 'Tijuana',
    territory: 'Noroeste',
    states: ['Baja California', 'Baja California Sur', 'Sonora', 'Sinaloa'],
    ownerId: 'gabriel',
  },
  {
    id: 'golfo-sureste',
    base: 'Veracruz',
    territory: 'Golfo y Sureste',
    states: [
      'Veracruz',
      'Tabasco',
      'Campeche',
      'Yucatán',
      'Quintana Roo',
      'Chiapas',
    ],
    ownerId: null,
  },
  {
    id: 'noreste',
    base: 'Monterrey 1',
    territory: 'Noreste Industrial',
    states: ['Nuevo León', 'Tamaulipas', 'San Luis Potosí'],
    ownerId: 'tania',
  },
  {
    id: 'norte',
    base: 'Monterrey 2',
    territory: 'Norte Industrial',
    states: ['Coahuila', 'Chihuahua', 'Durango'],
    ownerId: 'tania',
  },
];

export const UNASSIGNED_ZONE: Zone = {
  id: 'sin-zona',
  base: '—',
  territory: 'Sin zona asignada',
  states: [],
  ownerId: null,
};

const normalize = (text: string) =>
  text
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function zoneForState(state: string): Zone {
  const key = normalize(state);
  if (!key) return UNASSIGNED_ZONE;
  return (
    ZONES.find((z) => z.states.some((s) => normalize(s) === key)) ??
    UNASSIGNED_ZONE
  );
}

export function placeLabel(city: string, state: string) {
  return state && state !== city ? `${city}, ${state}` : city;
}
