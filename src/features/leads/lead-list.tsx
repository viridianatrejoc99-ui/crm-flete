'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  CalendarCheck2,
  CheckCheck,
  Clock3,
  Layers3,
  Search,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '@/components/crm-provider';
import { PageHeading, EmptyState, Notice } from '@/components/ui/primitives';
import { ExportButton } from '@/components/ui/export-button';
import { LeadFilters } from './lead-filters';
import { LeadCard } from './lead-card';
import { EMPTY_FILTERS, filterLeads } from '@/lib/commercial';
import { downloadWorkbook, leadSheet } from '@/lib/export';

export function LeadList({ general = false }: { general?: boolean }) {
  const { state, user, now } = useCRM();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [notice, setNotice] = useState('');
  const ownOnly = !general && user.role === 'advisor';
  const base = ownOnly
    ? state.leads.filter((l) => l.ownerId === user.id)
    : state.leads;
  const leads = filterLeads(base, filters, now).sort(
    (a, b) => Date.parse(b.enteredAt) - Date.parse(a.enteredAt),
  );
  const pending = base.filter(
    (l) =>
      l.nextFollowUp &&
      Date.parse(l.nextFollowUp) < now &&
      !['Ganado', 'Perdido'].includes(l.stage),
  ).length;
  const won = base.filter((l) => l.stage === 'Ganado').length;
  return (
    <>
      <PageHeading
        eyebrow={general ? 'EXPLORA TU OPERACIÓN' : 'TU ESPACIO COMERCIAL'}
        title={
          general
            ? 'Buscador general'
            : ownOnly
              ? 'Mis leads'
              : 'Leads de México'
        }
        description={
          general
            ? 'Encuentra cualquier prospecto. Toda la operación, en un solo lugar.'
            : ownOnly
              ? `Hola, ${user.name}. Cada seguimiento es una nueva oportunidad.`
              : 'Una vista completa de los prospectos y su avance comercial.'
        }
      >
        <ExportButton
          disabled={!leads.length}
          onExport={() =>
            downloadWorkbook(
              general ? 'flete-buscador-demo' : 'flete-mis-leads-demo',
              [leadSheet(leads, state.users)],
            )
          }
        />
      </PageHeading>
      {!general && (
        <>
          <section className="welcome-panel">
            <div>
              <span className="welcome-tag">
                <Sparkles size={13} /> CADA CONVERSACIÓN CUENTA
              </span>
              <h2>
                Tu siguiente oportunidad
                <br />
                empieza con un seguimiento.
              </h2>
              <p>
                {pending
                  ? `Tienes ${pending} seguimiento${pending > 1 ? 's' : ''} pendiente${pending > 1 ? 's' : ''}. Retoma la conversación hoy.`
                  : 'Todo listo para conectar con tus próximos clientes.'}
              </p>
              <button
                onClick={() => setFilters({ ...EMPTY_FILTERS, pending: true })}
                className="button light"
              >
                Ver pendientes <ArrowRight size={16} />
              </button>
            </div>
            <div className="welcome-art" aria-hidden="true">
              <div className="art-orbit orbit-one" />
              <div className="art-orbit orbit-two" />
              <div className="art-card">
                <CheckCheck size={27} />
                <span>Más conexiones.</span>
                <strong>Más movimiento.</strong>
                <div className="art-line" />
                <div className="art-line short" />
              </div>
              <span className="art-dot dot-one" />
              <span className="art-dot dot-two" />
            </div>
          </section>
          <div className="summary-grid">
            <div className="summary-card">
              <span className="stat-icon blue">
                <Layers3 size={19} />
              </span>
              <div>
                <span>Leads en tu vista</span>
                <strong>{base.length}</strong>
              </div>
            </div>
            <div className="summary-card">
              <span className="stat-icon amber">
                <Clock3 size={19} />
              </span>
              <div>
                <span>Seguimientos vencidos</span>
                <strong>
                  {pending}
                  <small> por retomar</small>
                </strong>
              </div>
            </div>
            <div className="summary-card">
              <span className="stat-icon green">
                <CalendarCheck2 size={19} />
              </span>
              <div>
                <span>Clientes ganados</span>
                <strong>
                  {won}
                  <small> este conjunto</small>
                </strong>
              </div>
            </div>
          </div>
        </>
      )}
      {general && (
        <div className="info-strip">
          <Search size={18} />
          <p>
            Todos los roles pueden consultar los leads de México. La edición
            depende de tu rol y de la asignación.
          </p>
        </div>
      )}
      <Notice text={notice} />
      <LeadFilters
        value={filters}
        onChange={setFilters}
        users={state.users}
        showOwner={!ownOnly}
      />
      <div className="section-title">
        <h2>
          {general ? 'Resultados de búsqueda' : 'Tu cartera de prospectos'}{' '}
          <span className="count-badge">{leads.length}</span>
        </h2>
        {!general && ownOnly && (
          <Link className="text-button" href="/buscador">
            Ver todos los leads <ArrowRight size={15} />
          </Link>
        )}
      </div>
      <p className="results-context">
        {leads.length} de {base.length} leads · Fechas de entrada en hora de
        Ciudad de México
      </p>
      {leads.length ? (
        <div className="lead-grid">
          {leads.map((l) => (
            <LeadCard
              key={l.id}
              lead={l}
              owner={state.users.find((u) => u.id === l.ownerId)}
              alertMinutes={state.rules.alertMinutes}
              onContact={(type) =>
                setNotice(
                  `${type} simulada: los teléfonos de esta demo son ficticios. No se contactó a ninguna persona.`,
                )
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </>
  );
}
