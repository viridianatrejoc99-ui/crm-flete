import { CHANNELS, type Lead, type User } from '@/types/crm';
import { pipelineValue } from '@/lib/commercial';
export function metrics(leads: Lead[], users: User[], now: number) {
  const contacted = leads.filter((l) => l.firstContactAt);
  const paid = leads.filter((l) => l.paidAt);
  const renewalEligible = paid.filter(
    (l) => l.renewalDueAt && Date.parse(l.renewalDueAt) <= now,
  );
  const renewed = renewalEligible.filter(
    (l) => l.renewedAt && Date.parse(l.renewedAt) <= now,
  );
  const count = (stage: Lead['stage']) =>
    leads.filter((l) => l.reached.includes(stage)).length;
  const milestones = [
    { label: 'Nuevo', count: leads.length },
    { label: 'Contactado', count: count('Contactado') },
    { label: 'Interesado', count: count('Interesado') },
    {
      label: 'Pagó o publicó',
      count: leads.filter((l) =>
        l.reached.some((s) =>
          ['Suscrito', 'Publicó cargas', 'Ganado'].includes(s),
        ),
      ).length,
    },
    { label: 'Ganado', count: count('Ganado') },
  ];
  return {
    total: leads.length,
    newStage: leads.filter((l) => l.stage === 'Nuevo').length,
    won: leads.filter((l) => l.stage === 'Ganado').length,
    subscriptions: paid.length,
    pipeline: pipelineValue(leads),
    collected: leads.reduce((sum, l) => sum + l.collectedAmount, 0),
    firstContactMinutes: contacted.length
      ? Math.round(
          contacted.reduce(
            (sum, l) =>
              sum +
              Math.max(
                0,
                Date.parse(l.firstContactAt) - Date.parse(l.enteredAt),
              ) /
                60000,
            0,
          ) / contacted.length,
        )
      : null,
    contactedCount: contacted.length,
    active: paid.filter((l) => l.activeCustomer).length,
    paidCount: paid.length,
    renewalEligible: renewalEligible.length,
    renewed: renewed.length,
    milestones,
    channels: CHANNELS.map((channel) => ({
      label: channel,
      count: leads.filter((l) => l.channel === channel).length,
    })),
    advisors: users
      .filter((u) => u.role === 'advisor')
      .map((u) => {
        const own = leads.filter((l) => l.ownerId === u.id);
        return {
          id: u.id,
          name: u.name,
          active: u.active,
          total: own.length,
          won: own.filter((l) => l.stage === 'Ganado').length,
          subscriptions: own.filter((l) => l.paidAt).length,
          collected: own.reduce((s, l) => s + l.collectedAmount, 0),
          pipeline: pipelineValue(own),
        };
      }),
  };
}
