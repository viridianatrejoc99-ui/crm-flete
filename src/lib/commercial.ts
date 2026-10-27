import type { CRMState, Lead, LeadFilters, Stage } from '@/types/crm';
import { localDate } from '@/lib/formatting';

export function businessMinutes(
  start: string,
  end = new Date().toISOString(),
): number {
  if (!start) return 0;
  const a = new Date(start).getTime(),
    b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  const offset = 6 * 3600000,
    day = 86400000;
  let total = 0;
  for (let d = Math.floor((a - offset) / day) * day + offset; d < b; d += day) {
    const weekday = new Date(d - offset).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    total +=
      Math.max(
        0,
        Math.min(b, d + 18 * 3600000) - Math.max(a, d + 9 * 3600000),
      ) / 60000;
  }
  return Math.floor(total);
}

export function stageFacts(stage: Stage) {
  return {
    hasPaid: stage === 'Suscrito' || stage === 'Ganado',
    hasPublished: stage === 'Publicó cargas' || stage === 'Ganado',
  };
}

export function filterLeads(
  leads: Lead[],
  filters: LeadFilters,
  now = Date.now(),
) {
  const query = filters.query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const digits = query.replace(/\D/g, '');
  return leads.filter((lead) => {
    const haystack = `${lead.name} ${lead.company} ${lead.phone}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const matchesQuery =
      !query ||
      haystack.includes(query) ||
      (digits.length >= 3 && lead.phone.replace(/\D/g, '').includes(digits));
    const day = localDate(lead.enteredAt);
    return (
      matchesQuery &&
      (!filters.channel || lead.channel === filters.channel) &&
      (!filters.stage || lead.stage === filters.stage) &&
      (!filters.owner || lead.ownerId === filters.owner) &&
      (!filters.from || day >= filters.from) &&
      (!filters.to || day <= filters.to) &&
      (!filters.pending ||
        (!!lead.nextFollowUp &&
          Date.parse(lead.nextFollowUp) <= now &&
          !['Ganado', 'Perdido'].includes(lead.stage)))
    );
  });
}

export const EMPTY_FILTERS: LeadFilters = {
  query: '',
  channel: '',
  stage: '',
  owner: '',
  from: '',
  to: '',
  pending: false,
};

export function assignment(
  state: CRMState,
  city: string,
  existing?: Lead,
  now = Date.now(),
): { ownerId: string | null; reason: string; advances: boolean } {
  if (existing?.activeCustomer)
    return {
      ownerId: existing.ownerId,
      reason: 'Cliente activo: conserva responsable.',
      advances: false,
    };
  if (existing && now - Date.parse(existing.enteredAt) < 90 * 86400000)
    return {
      ownerId: existing.ownerId,
      reason: 'Reingreso antes de 90 días: conserva responsable.',
      advances: false,
    };
  const normalized = city
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const fixed =
    normalized === 'guadalajara'
      ? 'gabriel'
      : normalized === 'monterrey'
        ? 'tania'
        : null;
  if (fixed) {
    const available = state.users.find((u) => u.id === fixed && u.active);
    return {
      ownerId: available?.id ?? null,
      reason: available
        ? 'Asignación por ciudad.'
        : 'Asesor de ciudad inactivo: requiere asignación manual.',
      advances: false,
    };
  }
  const available = state.rules.rotationIds.filter((id) =>
    state.users.some((u) => u.id === id && u.active && u.role === 'advisor'),
  );
  return {
    ownerId: available.length
      ? available[state.rules.rotationCursor % available.length]
      : null,
    reason: available.length
      ? 'Rotación de asesores activos.'
      : 'No hay asesores activos en la rotación.',
    advances: available.length > 0,
  };
}

export function pipelineValue(leads: Lead[]) {
  return (
    new Map(
      leads
        .filter((l) =>
          ['Interesado', 'Suscrito', 'Publicó cargas', 'Ganado'].includes(
            l.stage,
          ),
        )
        .map((l) => [l.id, l]),
    ).size * 300
  );
}
