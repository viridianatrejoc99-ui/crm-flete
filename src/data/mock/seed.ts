import type { CRMState, Lead, Stage } from '@/types/crm';
import { CHANNELS } from '@/types/crm';
import { stageFacts } from '@/lib/commercial';

export function createDemoState(now = Date.now()): CRMState {
  const ago = (hours: number) => new Date(now - hours * 3600000).toISOString();
  const users: CRMState['users'] = [
    { id: 'admin', name: 'Administrador', role: 'admin', active: true },
    ...['Alberto', 'Yoss', 'Rodrigo', 'Gabriel', 'Tania'].map((name) => ({
      id: name.toLowerCase(),
      name,
      role: 'advisor' as const,
      active: true,
    })),
    ...['Marco', 'Bruno'].map((name) => ({
      id: name.toLowerCase(),
      name,
      role: 'director' as const,
      active: true,
    })),
  ];
  const names = [
    'Ana Torres',
    'Luis Mendoza',
    'Sofía Ramírez',
    'Carlos Vega',
    'Mariana López',
    'Diego Castro',
    'Valeria Ruiz',
    'Jorge Salas',
    'Daniela Ríos',
    'Miguel Luna',
    'Paola Soto',
    'Andrés Gil',
    'Lucía Flores',
    'Pedro Mora',
    'Elena Cruz',
    'Raúl León',
    'Camila Ortiz',
    'Óscar Peña',
    'Renata Silva',
    'Hugo Lara',
    'Isabel Solís',
    'Tomás Díaz',
    'Julia Reyes',
    'Emilio Cano',
    'Clara Vidal',
  ];
  const companies = [
    'Carga Horizonte',
    'Comercial del Bajío',
    'Distribuidora Norte',
    'Transportes Olivo',
    'Logística del Sol',
    'Abastos Central',
    'Grupo Sierra',
    'Envíos del Pacífico',
    'Insumos Aurora',
    'Comercio del Valle',
  ];
  const stages: Stage[] = [
    'Nuevo',
    'Contactado',
    'Interesado',
    'Suscrito',
    'Publicó cargas',
    'Ganado',
    'Perdido',
  ];
  const owners = ['alberto', 'yoss', 'rodrigo', 'gabriel', 'tania'];
  const cities = [
    'Ciudad de México',
    'Querétaro',
    'Puebla',
    'Guadalajara',
    'Monterrey',
  ];
  const leads: Lead[] = names.map((name, i) => {
    const stage = stages[Math.floor(i / 5) === 0 ? i % 3 : (i + 2) % 7];
    const enteredHours =
      i === 0 ? 1 : i >= 22 ? 24 * (100 + i - 22) : 6 + i * 21;
    const contacted = stage !== 'Nuevo';
    const facts = stageFacts(stage);
    const paidAt = facts.hasPaid ? ago(Math.max(1, enteredHours - 48)) : '';
    return {
      id: `MX-${String(1001 + i)}`,
      name,
      company: `${companies[i % companies.length]} (demo)`,
      phone: `+52 000 000 ${String(1000 + i)}`,
      email: `prospecto${i + 1}@example.com`,
      city: cities[i % 5],
      estimatedLoads: 4 + (i % 9) * 3,
      channel: CHANNELS[i % CHANNELS.length],
      campaign: i % 6 < 3 ? 'México · transporta más' : 'Captación orgánica',
      utmSource: CHANNELS[i % CHANNELS.length].toLowerCase(),
      utmMedium: i % 6 < 3 ? 'paid_social' : 'organic',
      utmCampaign: 'demo_mx',
      utmTerm: '',
      utmContent: 'prototipo',
      enteredAt: ago(enteredHours),
      ownerId: owners[i % 5],
      stage,
      lastContactResult: !contacted
        ? ''
        : i % 3 === 0
          ? 'No contestó'
          : 'Conversación realizada',
      lossReason:
        stage === 'Perdido' ? 'Sin necesidad de transporte por el momento' : '',
      nextFollowUp: ['Ganado', 'Perdido'].includes(stage)
        ? ''
        : ago(i % 3 === 0 ? 3 : -((i % 4) + 1) * 5),
      firstContactAt: contacted ? ago(enteredHours - ((i % 4) + 1) / 4) : '',
      reentries: i % 6 === 0 ? 1 : 0,
      ...facts,
      paidAt,
      collectedAmount: facts.hasPaid ? 300 : 0,
      activeCustomer: facts.hasPaid && i % 4 !== 0,
      renewalDueAt: facts.hasPaid ? ago(i % 4 === 0 ? 24 : -24 * 20) : '',
      renewedAt: facts.hasPaid && i % 2 === 0 ? ago(4) : '',
      reached:
        stage === 'Nuevo'
          ? ['Nuevo']
          : stage === 'Contactado' || stage === 'Perdido'
            ? ['Nuevo', 'Contactado', stage]
            : ['Nuevo', 'Contactado', 'Interesado', stage],
      activities: contacted
        ? [
            {
              id: `seed-${i}`,
              authorId: owners[i % 5],
              text: 'Registro ficticio de contacto inicial.',
              createdAt: ago(enteredHours - ((i % 4) + 1) / 4),
              kind: 'contact',
            },
          ]
        : [],
    };
  });
  return {
    version: 1,
    users,
    leads,
    rules: {
      alertMinutes: 30,
      rotationIds: ['alberto', 'yoss', 'rodrigo'],
      rotationCursor: 0,
    },
    currentUserId: 'alberto',
  };
}
