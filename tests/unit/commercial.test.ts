import { describe, expect, it } from 'vitest';
import { createDemoState } from '@/data/mock/seed';
import { applyAction } from '@/features/leads/mutations';
import {
  assignment,
  businessMinutes,
  EMPTY_FILTERS,
  filterLeads,
  pipelineValue,
  stageFacts,
} from '@/lib/commercial';
import { stateSchema } from '@/data/contracts/storage';
const now = '2026-10-27T18:00:00.000Z';
const seed = () => createDemoState(Date.parse(now));
describe('Permisos y persistencia de demostración', () => {
  it('valida el contrato de los datos iniciales y rechaza datos corruptos', () => {
    expect(stateSchema.safeParse(seed()).success).toBe(true);
    expect(stateSchema.safeParse({ version: 1 }).success).toBe(false);
  });
  it('permite comentarios en leads ajenos pero rechaza cambios comerciales', () => {
    const state = seed(),
      user = state.users.find((u) => u.id === 'alberto')!,
      other = state.leads.find((l) => l.ownerId === 'yoss')!;
    const next = applyAction(
      state,
      user,
      { type: 'comment', id: other.id, text: 'Comentario ficticio' },
      now,
    );
    expect(next.leads.find((l) => l.id === other.id)?.activities[0].text).toBe(
      'Comentario ficticio',
    );
    expect(() =>
      applyAction(state, user, {
        type: 'workflow',
        id: other.id,
        values: { stage: 'Ganado', nextFollowUp: '', lossReason: '' },
      }),
    ).toThrow();
    expect(() =>
      applyAction(state, user, {
        type: 'assign',
        id: other.id,
        ownerId: user.id,
      }),
    ).toThrow();
  });
  it('mantiene directivos en solo lectura incluso al invocar acciones directamente', () => {
    const state = seed(),
      user = state.users.find((u) => u.id === 'marco')!;
    expect(() =>
      applyAction(state, user, {
        type: 'comment',
        id: state.leads[0].id,
        text: 'Intento',
      }),
    ).toThrow();
    expect(() =>
      applyAction(state, user, { type: 'rules', alertMinutes: 40 }),
    ).toThrow();
  });
  it('exige motivo de pérdida y separa resultado de contacto de la etapa', () => {
    const state = seed(),
      user = state.users.find((u) => u.id === 'alberto')!,
      lead = state.leads[0];
    expect(() =>
      applyAction(state, user, {
        type: 'workflow',
        id: lead.id,
        values: { stage: 'Perdido', nextFollowUp: '', lossReason: ' ' },
      }),
    ).toThrow(/motivo/);
    const next = applyAction(
      state,
      user,
      { type: 'contact', id: lead.id, result: 'No contestó' },
      now,
    ).leads[0];
    expect(next.stage).toBe(lead.stage);
    expect(next.firstContactAt).toBe(now);
    expect(next.lastContactResult).toBe('No contestó');
  });
  it('administración puede reasignar cualquier lead pero no hacia un asesor inactivo', () => {
    const state = seed(),
      admin = state.users[0];
    const disabled = applyAction(state, admin, {
      type: 'toggle-user',
      id: 'tania',
    });
    expect(() =>
      applyAction(disabled, admin, {
        type: 'assign',
        id: state.leads[0].id,
        ownerId: 'tania',
      }),
    ).toThrow();
    expect(
      applyAction(state, admin, {
        type: 'assign',
        id: state.leads[0].id,
        ownerId: 'tania',
      }).leads[0].ownerId,
    ).toBe('tania');
  });
});
describe('Reglas comerciales', () => {
  it('distingue pago, publicación y ganado', () => {
    expect(stageFacts('Suscrito')).toEqual({
      hasPaid: true,
      hasPublished: false,
    });
    expect(stageFacts('Publicó cargas')).toEqual({
      hasPaid: false,
      hasPublished: true,
    });
    expect(stageFacts('Ganado')).toEqual({ hasPaid: true, hasPublished: true });
  });
  it('cuenta $300 por prospecto elegible sin duplicar ni incluir pérdidas', () => {
    const state = seed();
    const eligible = state.leads.filter((l) =>
      ['Interesado', 'Suscrito', 'Publicó cargas', 'Ganado'].includes(l.stage),
    );
    expect(pipelineValue([...state.leads, ...eligible])).toBe(
      eligible.length * 300,
    );
  });
  it('busca por nombre, empresa y teléfono normalizado y combina filtros', () => {
    const state = seed();
    expect(
      filterLeads(state.leads, { ...EMPTY_FILTERS, query: 'Sofia' })[0].name,
    ).toBe('Sofía Ramírez');
    expect(
      filterLeads(state.leads, { ...EMPTY_FILTERS, query: '520000001000' })[0]
        .id,
    ).toBe('MX-1001');
    expect(
      filterLeads(state.leads, {
        ...EMPTY_FILTERS,
        query: 'horizonte',
        owner: 'alberto',
      }).length,
    ).toBeGreaterThan(0);
    expect(
      filterLeads(state.leads, { ...EMPTY_FILTERS, from: '2099-01-01' }),
    ).toHaveLength(0);
  });
  it('descuenta noches y fines de semana de la alerta laboral', () => {
    expect(
      businessMinutes('2026-10-23T23:45:00Z', '2026-10-26T15:15:00Z'),
    ).toBe(30);
    expect(
      businessMinutes('2026-10-27T15:00:00Z', '2026-10-27T15:30:00Z'),
    ).toBe(30);
  });
  it('respeta ciudad, rotación activa, reingresos y clientes activos', () => {
    const state = seed();
    expect(assignment(state, 'Guadalajara').ownerId).toBe('gabriel');
    expect(assignment(state, 'Monterrey').ownerId).toBe('tania');
    state.users.find((u) => u.id === 'alberto')!.active = false;
    expect(assignment(state, 'Puebla').ownerId).toBe('yoss');
    const existing = {
      ...state.leads[0],
      ownerId: 'rodrigo',
      activeCustomer: false,
    };
    expect(
      assignment(state, 'Guadalajara', existing, Date.parse(now)).ownerId,
    ).toBe('rodrigo');
    existing.enteredAt = '2026-01-01T00:00:00Z';
    existing.activeCustomer = true;
    expect(
      assignment(state, 'Monterrey', existing, Date.parse(now)).ownerId,
    ).toBe('rodrigo');
    existing.activeCustomer = false;
    expect(
      assignment(state, 'Monterrey', existing, Date.parse(now)).ownerId,
    ).toBe('tania');
  });
});
