import { expect, it } from 'vitest';
import { createDemoState } from '@/data/mock/seed';
import { metrics } from '@/features/dashboard/metrics';
import { applyAction } from '@/features/leads/mutations';
const now = Date.parse('2026-10-27T18:00:00Z');
it('separa cobros de proyecciones y conserva el cobro histórico al perder un cliente', () => {
  const state = createDemoState(now),
    admin = state.users[0];
  const won = state.leads.find((l) => l.stage === 'Ganado')!;
  const before = metrics(state.leads, state.users, now);
  const next = applyAction(state, admin, {
    type: 'workflow',
    id: won.id,
    values: {
      stage: 'Perdido',
      nextFollowUp: '',
      lossReason: 'Pérdida ficticia',
    },
  });
  const after = metrics(next.leads, state.users, now);
  expect(after.collected).toBe(before.collected);
  expect(after.pipeline).toBe(before.pipeline - 300);
  expect(after.won).toBe(before.won - 1);
  expect(after.milestones[4].count).toBe(before.milestones[4].count);
});
it('genera indicadores vacíos sin NaN ni divisiones por cero', () => {
  const result = metrics([], [], now);
  expect(result.pipeline).toBe(0);
  expect(result.firstContactMinutes).toBeNull();
  expect(result.renewalEligible).toBe(0);
});
it('computa rutas alternativas una sola vez en el hito de conversión', () => {
  const state = createDemoState(now),
    lead = state.leads[0];
  lead.reached = [
    'Nuevo',
    'Contactado',
    'Interesado',
    'Suscrito',
    'Publicó cargas',
    'Ganado',
  ];
  const m = metrics([lead], state.users, now);
  expect(m.milestones[3].count).toBe(1);
});
