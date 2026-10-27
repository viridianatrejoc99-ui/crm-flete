import type { CRMState, Lead, Stage, User } from '@/types/crm';
import { canAdminister, canComment, canEditLead } from '@/lib/permissions';
import { stageFacts } from '@/lib/commercial';

export type LeadEdit = Pick<Lead, 'stage' | 'lossReason' | 'nextFollowUp'>;
export type ProfileEdit = Pick<
  Lead,
  | 'name'
  | 'company'
  | 'phone'
  | 'email'
  | 'city'
  | 'estimatedLoads'
  | 'channel'
  | 'campaign'
  | 'utmSource'
  | 'utmMedium'
  | 'utmCampaign'
  | 'utmTerm'
  | 'utmContent'
>;
export type Action =
  | { type: 'workflow'; id: string; values: LeadEdit }
  | { type: 'profile'; id: string; values: ProfileEdit }
  | { type: 'comment'; id: string; text: string }
  | { type: 'contact'; id: string; result: string }
  | { type: 'assign'; id: string; ownerId: string }
  | { type: 'toggle-user'; id: string }
  | { type: 'rules'; alertMinutes: number };

export function applyAction(
  state: CRMState,
  user: User,
  action: Action,
  now = new Date().toISOString(),
): CRMState {
  if (!user.active) throw new Error('Este usuario está inactivo.');
  if (action.type === 'toggle-user' || action.type === 'rules') {
    if (!canAdminister(user))
      throw new Error('Solo administración puede realizar esta acción.');
    if (action.type === 'rules') {
      if (
        !Number.isInteger(action.alertMinutes) ||
        action.alertMinutes < 1 ||
        action.alertMinutes > 480
      )
        throw new Error('Ingresa entre 1 y 480 minutos laborales.');
      return {
        ...state,
        rules: { ...state.rules, alertMinutes: action.alertMinutes },
      };
    }
    if (!state.users.some((u) => u.id === action.id && u.role === 'advisor'))
      throw new Error('Selecciona un asesor.');
    return {
      ...state,
      users: state.users.map((u) =>
        u.id === action.id ? { ...u, active: !u.active } : u,
      ),
    };
  }
  const lead = state.leads.find((l) => l.id === action.id);
  if (!lead) throw new Error('No se encontró el lead.');
  let updated = { ...lead };
  let text = '';
  let kind: Lead['activities'][number]['kind'] = 'change';
  if (action.type === 'comment') {
    if (!canComment(user)) throw new Error('Tu rol no puede comentar.');
    text = action.text.trim();
    if (!text || text.length > 2000)
      throw new Error('Escribe un comentario de 1 a 2000 caracteres.');
    kind = 'comment';
  } else if (action.type === 'assign') {
    if (!canAdminister(user))
      throw new Error('Solo administración puede reasignar.');
    const target = state.users.find(
      (u) => u.id === action.ownerId && u.active && u.role === 'advisor',
    );
    if (!target) throw new Error('Selecciona un asesor activo.');
    updated.ownerId = target.id;
    text = `Responsable reasignado a ${target.name}.`;
    kind = 'assignment';
  } else if (action.type === 'profile') {
    if (!canAdminister(user))
      throw new Error(
        'Solo administración puede editar los datos del prospecto.',
      );
    if (
      !action.values.name.trim() ||
      !action.values.company.trim() ||
      action.values.estimatedLoads < 0
    )
      throw new Error('Revisa el nombre, la empresa y las cargas.');
    updated = { ...updated, ...action.values };
    text = 'Datos del prospecto actualizados.';
  } else {
    if (!canEditLead(user, lead))
      throw new Error('Solo puedes actualizar tus propios leads.');
    if (action.type === 'contact') {
      if (!action.result.trim())
        throw new Error('Selecciona el resultado del contacto.');
      updated.lastContactResult = action.result;
      updated.firstContactAt ||= now;
      text = action.result;
      kind = 'contact';
    } else {
      if (action.values.stage === 'Perdido' && !action.values.lossReason.trim())
        throw new Error('El motivo de pérdida es obligatorio.');
      const stage: Stage = action.values.stage;
      updated = {
        ...updated,
        ...action.values,
        lossReason: stage === 'Perdido' ? action.values.lossReason.trim() : '',
      };
      if (stage !== 'Perdido') {
        const facts = stageFacts(stage);
        updated = { ...updated, ...facts, activeCustomer: facts.hasPaid };
        if (facts.hasPaid) {
          updated.paidAt ||= now;
          updated.collectedAmount ||= 300;
          updated.renewalDueAt ||= new Date(
            Date.parse(now) + 30 * 86400000,
          ).toISOString();
        }
      } else updated.activeCustomer = false;
      const reached: Stage[] =
        stage === 'Nuevo'
          ? ['Nuevo']
          : stage === 'Contactado'
            ? ['Nuevo', 'Contactado']
            : stage === 'Perdido'
              ? ['Perdido']
              : ['Nuevo', 'Contactado', 'Interesado', stage];
      updated.reached = [...new Set([...lead.reached, ...reached])];
      text = `Etapa: ${stage}. Seguimiento ${updated.nextFollowUp ? 'programado' : 'sin fecha'}.${stage === 'Perdido' ? ` Motivo: ${updated.lossReason}` : ''}`;
    }
  }
  updated.activities = [
    { id: crypto.randomUUID(), authorId: user.id, text, createdAt: now, kind },
    ...lead.activities,
  ];
  return {
    ...state,
    leads: state.leads.map((l) => (l.id === lead.id ? updated : l)),
  };
}
