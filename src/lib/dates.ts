/**
 * Utilidades de fecha con zona horaria oficial de Perú (America/Lima, UTC-5).
 * Evita saltos de fecha incorrectos causados por servidores en UTC (Vercel, Docker).
 */

export const PERU_TIMEZONE = 'America/Lima';

/**
 * Retorna la fecha de hoy en Perú en formato 'YYYY-MM-DD'
 */
export function getPeruTodayString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PERU_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Suma o resta días a una fecha en formato 'YYYY-MM-DD'
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayStr = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayStr}`;
}

/**
 * Retorna una fecha con desplazamiento de días respecto a hoy en Perú
 */
export function getPeruDateWithOffset(days: number): string {
  const today = getPeruTodayString();
  return addDaysToDate(today, days);
}
