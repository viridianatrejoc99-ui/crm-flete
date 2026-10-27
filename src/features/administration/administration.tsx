'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Clock3,
  MapPin,
  Play,
  RotateCw,
  Save,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { useCRM } from '@/components/crm-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  PageHeading,
  Notice,
  EmptyState,
  StageBadge,
} from '@/components/ui/primitives';
import { ExportButton } from '@/components/ui/export-button';
import { LeadFilters } from '@/features/leads/lead-filters';
import { assignment, EMPTY_FILTERS, filterLeads } from '@/lib/commercial';
import { canAdminister } from '@/lib/permissions';
import { downloadWorkbook, leadSheet } from '@/lib/export';
import type { Lead, User } from '@/types/crm';

export function Administration() {
  const { user } = useCRM();
  if (!canAdminister(user))
    return (
      <EmptyState title="Acceso exclusivo de administración">
        <span>
          Tu perfil puede consultar leads y resultados.{' '}
          <Link className="text-button" href="/mis-leads">
            Volver a leads
          </Link>
        </span>
      </EmptyState>
    );
  return <AdminContent />;
}
function AdminContent() {
  const { state, user, dispatch, now } = useCRM();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState(false);
  const [minutes, setMinutes] = useState(state.rules.alertMinutes);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [city, setCity] = useState('Ciudad de México');
  const [existing, setExisting] = useState('');
  const [simCount, setSimCount] = useState(0);
  const [simulation, setSimulation] = useState('');
  const [confirmation, setConfirmation] = useState<User | null>(null);
  const advisors = state.users.filter((u) => u.role === 'advisor');
  const leads = filterLeads(state.leads, filters, now);
  function run(fn: () => void, message: string) {
    try {
      fn();
      setNotice(message);
      setError(false);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'No se pudo guardar.');
      setError(true);
    }
  }
  function simulate() {
    const result = assignment(
      {
        ...state,
        rules: {
          ...state.rules,
          rotationCursor: state.rules.rotationCursor + simCount,
        },
      },
      city,
      state.leads.find((l) => l.id === existing),
      now,
    );
    setSimulation(
      `${result.ownerId ? state.users.find((u) => u.id === result.ownerId)?.name : 'Pendiente de asignación manual'} · ${result.reason}`,
    );
    if (result.advances) setSimCount((n) => n + 1);
  }
  return (
    <>
      <PageHeading
        eyebrow="CONTROL DE LA OPERACIÓN"
        title="Administración"
        description="Gestiona al equipo, las asignaciones y las reglas comerciales de México."
      >
        <ExportButton
          onExport={() =>
            downloadWorkbook('flete-administracion-demo', [
              {
                name: 'Usuarios',
                headers: ['Nombre', 'Rol', 'Estado', 'Leads asignados'],
                rows: state.users.map((u) => [
                  u.name,
                  u.role === 'admin'
                    ? 'Administrador'
                    : u.role === 'director'
                      ? 'Directivo'
                      : 'Asesor',
                  u.active ? 'Activo' : 'Inactivo',
                  state.leads.filter((l) => l.ownerId === u.id).length,
                ]),
              },
              {
                name: 'Reglas comerciales',
                headers: ['Regla', 'Configuración'],
                rows: [
                  ['Guadalajara', 'Gabriel'],
                  ['Monterrey', 'Tania'],
                  [
                    'Resto de México',
                    state.rules.rotationIds
                      .map(
                        (id) =>
                          state.users.find((u) => u.id === id)?.name ?? id,
                      )
                      .join(' → '),
                  ],
                  ['Reingreso', 'Antes de 90 días conserva responsable'],
                  ['Clientes activos', 'No se reasignan automáticamente'],
                  [
                    'Alerta sin contacto',
                    `${state.rules.alertMinutes} minutos laborales`,
                  ],
                  [
                    'Horario provisional',
                    'Lunes a viernes, 09:00–18:00, America/Mexico_City',
                  ],
                ],
              },
              leadSheet(leads, state.users),
            ])
          }
        />
      </PageHeading>
      <Notice text={notice} error={error} />
      <div className="info-strip">
        <ShieldCheck size={19} />
        <p>
          Estás en una demostración. Las reglas y los cambios se guardan
          únicamente en este navegador.
        </p>
      </div>
      <section className="panel results-panel">
        <div className="panel-heading">
          <h2>
            <UsersRound size={18} />
            Equipo de asesores
          </h2>
          <span className="channel-tag">
            {advisors.filter((u) => u.active).length} activos
          </span>
        </div>
        <p className="chart-description">
          Desactivar un asesor lo excluye de nuevas asignaciones. Sus leads
          actuales conservan responsable.
        </p>
        <div className="advisor-grid">
          {advisors.map((u) => (
            <article className="advisor-card" key={u.id}>
              <div className="advisor-top">
                <span className="avatar">
                  {u.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>{u.name}</strong>
                  <small>
                    {state.leads.filter((l) => l.ownerId === u.id).length} leads
                    asignados
                  </small>
                </div>
              </div>
              <div className="advisor-bottom">
                <span className={`status-pill ${u.active ? 'enabled' : ''}`}>
                  <i />
                  {u.active ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  className="text-button"
                  onClick={() => setConfirmation(u)}
                >
                  {u.active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="admin-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <RotateCw size={18} />
              Reglas de asignación
            </h2>
          </div>
          <div className="city-rules">
            <div>
              <MapPin size={16} />
              <span>Guadalajara</span>
              <strong>Gabriel</strong>
            </div>
            <div>
              <MapPin size={16} />
              <span>Monterrey</span>
              <strong>Tania</strong>
            </div>
          </div>
          <span className="small muted">
            Resto de México · orden de rotación
          </span>
          <div className="rotation-flow">
            {state.rules.rotationIds.map((id, i) => {
              const u = state.users.find((u) => u.id === id);
              return (
                <div className="rotation-item" key={id}>
                  <span className={!u?.active ? 'inactive-rotation' : ''}>
                    {u?.name}
                    {!u?.active && <small>Inactivo · excluido</small>}
                  </span>
                  {i < state.rules.rotationIds.length - 1 && (
                    <ArrowRight size={14} />
                  )}
                </div>
              );
            })}
          </div>
          <ul className="rule-notes">
            <li>Reingresos antes de 90 días conservan al responsable.</li>
            <li>Clientes activos no se reasignan automáticamente.</li>
            <li>
              Si el asesor fijo de una ciudad está inactivo, la asignación queda
              para revisión manual.
            </li>
          </ul>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Clock3 size={18} />
              Alerta por falta de contacto
            </h2>
          </div>
          <p className="chart-description">
            Alerta visual para leads sin primer intento de contacto. No se
            envían notificaciones.
          </p>
          <form
            className="stack-form"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => dispatch({ type: 'rules', alertMinutes: minutes }),
                'Tiempo de alerta actualizado.',
              );
            }}
          >
            <label>
              Tiempo de alerta · minutos laborales
              <input
                required
                type="number"
                min={1}
                max={480}
                step={1}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
            <div className="working-hours">
              <strong>Horario provisional</strong>
              <span>Lunes a viernes · 09:00 a 18:00</span>
              <small>Ciudad de México · sin ajuste por días festivos</small>
            </div>
            <button className="button primary">
              <Save size={16} />
              Guardar configuración
            </button>
          </form>
        </section>
      </div>
      <section className="panel simulation-panel">
        <div className="panel-heading">
          <h2>
            <Play size={18} />
            Simulador de asignación
          </h2>
          <span className="channel-tag">No modifica leads</span>
        </div>
        <p className="chart-description">
          Prueba una llegada ficticia o un reingreso. La rotación avanza solo
          dentro de esta simulación.
        </p>
        <div className="simulation-fields">
          <label>
            Escenario
            <select
              value={existing}
              onChange={(e) => {
                setExisting(e.target.value);
                setSimulation('');
              }}
            >
              <option value="">Nuevo prospecto ficticio</option>
              {state.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} · {l.name}
                  {l.activeCustomer ? ' · cliente activo' : ' · reingreso'}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ciudad
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setSimulation('');
              }}
            >
              <option>Ciudad de México</option>
              <option>Guadalajara</option>
              <option>Monterrey</option>
              <option>Querétaro</option>
              <option>Puebla</option>
              <option>Otra ciudad de México</option>
            </select>
          </label>
          <button className="button secondary" onClick={simulate}>
            <Play size={15} />
            Simular llegada
          </button>
        </div>
        {simulation && (
          <div className="simulation-result" role="status">
            <strong>Responsable simulado</strong>
            <p>{simulation}</p>
          </div>
        )}
      </section>
      <div className="section-title admin-section-title">
        <h2>Reasignación de leads</h2>
        <span className="count-badge">{leads.length}</span>
      </div>
      <p className="results-context">
        Las reasignaciones manuales requieren confirmación. El Excel incluye
        este conjunto filtrado.
      </p>
      <LeadFilters value={filters} onChange={setFilters} users={state.users} />
      {leads.length ? (
        <div className="reassignment-list">
          {leads.map((lead) => (
            <Reassignment
              key={`${lead.id}-${lead.ownerId}`}
              lead={lead}
              users={state.users}
              onAssign={(ownerId) =>
                run(
                  () => dispatch({ type: 'assign', id: lead.id, ownerId }),
                  `${lead.id} reasignado correctamente.`,
                )
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
      {confirmation && (
        <ConfirmDialog
          title={`${confirmation.active ? 'Desactivar' : 'Activar'} a ${confirmation.name}`}
          description={
            confirmation.active
              ? 'Quedará fuera de nuevas asignaciones y del selector de demostración. Sus leads actuales no se reasignarán automáticamente.'
              : 'Podrá recibir nuevas asignaciones según las reglas de su ciudad o rotación.'
          }
          confirmLabel="Confirmar"
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            run(
              () => dispatch({ type: 'toggle-user', id: confirmation.id }),
              `Estado de ${confirmation.name} actualizado por ${user.name}.`,
            );
            setConfirmation(null);
          }}
        />
      )}
    </>
  );
}
function Reassignment({
  lead,
  users,
  onAssign,
}: {
  lead: Lead;
  users: User[];
  onAssign: (id: string) => void;
}) {
  const [target, setTarget] = useState(lead.ownerId);
  const [confirm, setConfirm] = useState(false);
  return (
    <article className="reassignment-row">
      <div>
        <Link href={`/leads/${lead.id}`}>
          <strong>{lead.name}</strong>
          <span>
            {lead.id} · {lead.city}
          </span>
        </Link>
        <StageBadge stage={lead.stage} />
      </div>
      <div className="reassignment-control">
        <label>
          Asesor responsable
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setConfirm(false);
            }}
          >
            <option value={lead.ownerId}>
              {users.find((u) => u.id === lead.ownerId)?.name} · actual
            </option>
            {users
              .filter(
                (u) =>
                  u.active && u.role === 'advisor' && u.id !== lead.ownerId,
              )
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </label>
        <button
          disabled={target === lead.ownerId}
          className="button secondary"
          onClick={() => setConfirm(true)}
        >
          Reasignar
        </button>
      </div>
      {confirm && (
        <div className="reassignment-confirm">
          <p>¿Reasignar a {users.find((u) => u.id === target)?.name}?</p>
          <button
            className="button secondary"
            onClick={() => setConfirm(false)}
          >
            Cancelar
          </button>
          <button
            className="button primary"
            onClick={() => {
              onAssign(target);
              setConfirm(false);
            }}
          >
            Confirmar reasignación
          </button>
        </div>
      )}
    </article>
  );
}
