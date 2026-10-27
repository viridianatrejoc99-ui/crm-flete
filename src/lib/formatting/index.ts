export const money = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);
export const dateTime = (value: string) =>
  value
    ? new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Mexico_City',
      }).format(new Date(value))
    : 'Sin registrar';
export const localDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(value))
    : '';
export const toInputDate = (value: string) =>
  value
    ? new Date(new Date(value).getTime() - 6 * 3600000)
        .toISOString()
        .slice(0, 16)
    : '';
export const fromInputDate = (value: string) =>
  value ? new Date(`${value}:00-06:00`).toISOString() : '';
