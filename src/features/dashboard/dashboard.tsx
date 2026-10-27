'use client';
import { useState } from 'react';
import {
  BadgeCheck,
  Banknote,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  Layers3,
  RefreshCcw,
  UsersRound,
} from 'lucide-react';
import { useCRM } from '@/components/crm-provider';
import { PageHeading, EmptyState } from '@/components/ui/primitives';
import { ExportButton } from '@/components/ui/export-button';
import { filterLeads, EMPTY_FILTERS } from '@/lib/commercial';
import { money } from '@/lib/formatting';
import { downloadWorkbook, leadSheet } from '@/lib/export';
import { metrics } from './metrics';

export function Dashboard() {
  const { state, now } = useCRM();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [owner, setOwner] = useState('');
  const leads = filterLeads(
    state.leads,
    { ...EMPTY_FILTERS, from, to, owner },
    now,
  );
  const m = metrics(leads, state.users, now);
  const advisors = m.advisors.filter((a) => !owner || a.id === owner);
  const cards = [
    {
      label: 'Leads nuevos',
      value: m.total,
      detail: `${m.newStage} en etapa Nuevo · cohorte seleccionada`,
      icon: UsersRound,
      color: 'blue',
    },
    {
      label: 'Clientes ganados',
      value: m.won,
      detail: 'Pagaron y publicaron cargas',
      icon: BadgeCheck,
      color: 'green',
    },
    {
      label: 'Suscripciones nuevas',
      value: m.subscriptions,
      detail: 'Con primer pago registrado · incluye Ganado',
      icon: Layers3,
      color: 'blue',
    },
    {
      label: 'Tiempo a primer contacto',
      value:
        m.firstContactMinutes === null ? '—' : `${m.firstContactMinutes} min`,
      detail: `Promedio natural · ${m.contactedCount} con intento registrado`,
      icon: Clock3,
      color: 'amber',
    },
  ];
  async function exportReport() {
    await downloadWorkbook('flete-reporte-mexico-demo', [
      {
        name: 'Resumen',
        headers: ['Indicador · datos ficticios', 'Valor', 'Definición'],
        rows: [
          [
            'Fecha entrada desde',
            from || 'Sin límite',
            'Hora de Ciudad de México',
          ],
          [
            'Fecha entrada hasta',
            to || 'Sin límite',
            'Hora de Ciudad de México',
          ],
          [
            'Asesor',
            state.users.find((u) => u.id === owner)?.name ?? 'Todos',
            'Responsable actual',
          ],
          ['Leads nuevos', m.total, 'Cohorte por fecha de entrada'],
          ['Clientes ganados', m.won, 'Pagó y publicó'],
          [
            'Suscripciones nuevas',
            m.subscriptions,
            'Primer pago registrado en la cohorte',
          ],
          ['Cobrado demo MXN', m.collected, 'Pagos ficticios registrados'],
          [
            'Valor estimado MXN',
            m.pipeline,
            '$300 por lead único desde Interesado, incluye Ganado, excluye Perdido',
          ],
          [
            'Tiempo primer contacto min',
            m.firstContactMinutes ?? 'Sin datos',
            'Promedio de minutos naturales al primer intento',
          ],
          ['Suscriptores activos', m.active, `De ${m.paidCount} con pago`],
          [
            'Renovaciones',
            m.renewed,
            `De ${m.renewalEligible} con vencimiento alcanzado`,
          ],
        ],
      },
      {
        name: 'Resultados por asesor',
        headers: [
          'Asesor',
          'Leads',
          'Ganados',
          'Suscripciones',
          'Cobrado demo MXN',
          'Estimado MXN',
        ],
        rows: advisors.map((a) => [
          a.name,
          a.total,
          a.won,
          a.subscriptions,
          a.collected,
          a.pipeline,
        ]),
      },
      {
        name: 'Canales',
        headers: ['Canal', 'Leads'],
        rows: m.channels.map((c) => [c.label, c.count]),
      },
      {
        name: 'Conversión acumulada',
        headers: ['Hito', 'Leads que alcanzaron el hito'],
        rows: m.milestones.map((s) => [s.label, s.count]),
      },
      leadSheet(leads, state.users),
    ]);
  }
  return (
    <>
      <PageHeading
        eyebrow="RESULTADOS DE MÉXICO"
        title="Dashboard comercial"
        description="Una mirada clara al avance de tu equipo. Todos los importes son ficticios."
      >
        <ExportButton disabled={!leads.length} onExport={exportReport} />
      </PageHeading>
      <section
        className="dashboard-filters panel"
        aria-label="Filtros del dashboard"
      >
        <div className="dashboard-filter-fields">
          <label>
            Entrada desde
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            Entrada hasta
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label>
            Asesor
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="">Todos los asesores</option>
              {state.users
                .filter((u) => u.role === 'advisor')
                .map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </label>
          {(from || to || owner) && (
            <button
              className="text-button"
              onClick={() => {
                setFrom('');
                setTo('');
                setOwner('');
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <p>
          Todos los indicadores usan la cohorte por fecha de entrada del lead y
          su responsable actual. Horario: Ciudad de México.
        </p>
      </section>
      {!leads.length ? (
        <EmptyState title="No hay resultados para este periodo" />
      ) : (
        <>
          <div className="metric-grid">
            {cards.map((c) => (
              <article className="metric-card" key={c.label}>
                <div className="metric-top">
                  <span>{c.label}</span>
                  <span className={`stat-icon ${c.color}`}>
                    <c.icon size={18} />
                  </span>
                </div>
                <strong>{c.value}</strong>
                <small>{c.detail}</small>
              </article>
            ))}
          </div>
          <div className="finance-grid">
            <article className="finance-card collected">
              <div>
                <span className="finance-label">
                  <Banknote size={17} />
                  COBRADO · DATOS DE DEMOSTRACIÓN
                </span>
                <strong>
                  {money(m.collected)} <small>MXN</small>
                </strong>
                <p>Pagos ficticios registrados. No son ingresos reales.</p>
              </div>
              <span className="finance-chip">Registrado</span>
            </article>
            <article className="finance-card projected">
              <div>
                <span className="finance-label">
                  <CircleDollarSign size={17} />
                  VALOR ESTIMADO DEL PIPELINE
                </span>
                <strong>
                  {money(m.pipeline)} <small>MXN</small>
                </strong>
                <p>
                  $300 por lead único desde Interesado. Incluye Ganado; excluye
                  Perdido.
                </p>
              </div>
              <span className="finance-chip">Proyección</span>
            </article>
          </div>
          <div className="chart-grid">
            <section className="panel">
              <div className="panel-heading">
                <h2>
                  <ChartNoAxesCombined size={18} />
                  Conversión entre etapas
                </h2>
                <span className="channel-tag">Histórico acumulado</span>
              </div>
              <p className="chart-description">
                Hitos alcanzados por la cohorte. Suscrito y Publicó cargas son
                rutas alternativas.
              </p>
              <div className="funnel">
                {m.milestones.map((s, i) => {
                  const previous = m.milestones[i - 1]?.count;
                  const conversion = previous
                    ? Math.round((s.count / previous) * 100)
                    : 0;
                  return (
                    <div className="funnel-step" key={s.label}>
                      <div className="bar-label">
                        <span>{s.label}</span>
                        <strong>
                          {s.count}
                          <small>
                            {i === 0
                              ? ' base'
                              : ` · ${conversion}% del hito anterior`}
                          </small>
                        </strong>
                      </div>
                      <div className="bar-track">
                        <div
                          style={{
                            width: `${(s.count / m.total) * 100}%`,
                            opacity: 1 - i * 0.12,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="chart-footnote">
                Cada prospecto cuenta una vez por hito, aunque cambie de etapa
                después.
              </p>
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>Leads por canal</h2>
                <span className="count-badge">{m.total}</span>
              </div>
              <p className="chart-description">
                Origen de los prospectos de la selección.
              </p>
              <div className="channel-bars">
                {m.channels.map((c, i) => (
                  <div className="channel-row" key={c.label}>
                    <div className="bar-label">
                      <span>
                        <i
                          style={{
                            background: [
                              '#128779',
                              '#6c9eab',
                              '#9eabce',
                              '#d4b578',
                              '#88b995',
                              '#bac7c8',
                            ][i],
                          }}
                        />
                        {c.label}
                      </span>
                      <strong>
                        {c.count}
                        <small>
                          {' '}
                          · {Math.round((c.count / m.total) * 100)}%
                        </small>
                      </strong>
                    </div>
                    <div className="bar-track">
                      <div
                        style={{
                          width: `${(c.count / m.total) * 100}%`,
                          background: [
                            '#128779',
                            '#6c9eab',
                            '#9eabce',
                            '#d4b578',
                            '#88b995',
                            '#bac7c8',
                          ][i],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="panel results-panel">
            <div className="panel-heading">
              <h2>Resultados por asesor</h2>
              <span className="channel-tag">México</span>
            </div>
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  Resultados comerciales de la cohorte seleccionada por asesor
                </caption>
                <thead>
                  <tr>
                    <th>Asesor</th>
                    <th>Leads</th>
                    <th>Ganados</th>
                    <th>Suscripciones</th>
                    <th>Cobrado demo</th>
                    <th>Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {advisors.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="owner">
                          <span className="mini-avatar">{a.name[0]}</span>
                          <strong>{a.name}</strong>
                          {!a.active && <small>Inactivo</small>}
                        </span>
                      </td>
                      <td>{a.total}</td>
                      <td>{a.won}</td>
                      <td>{a.subscriptions}</td>
                      <td>{money(a.collected)}</td>
                      <td>{money(a.pipeline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="retention-panel panel">
            <div className="panel-heading">
              <h2>
                <RefreshCcw size={18} />
                Retención · indicadores básicos
              </h2>
              <span className="channel-tag">Datos ficticios</span>
            </div>
            <div className="retention-grid">
              <div>
                <span>Suscriptores activos</span>
                <strong>
                  {m.active} <small>/ {m.paidCount}</small>
                </strong>
                <p>
                  {m.paidCount ? Math.round((m.active / m.paidCount) * 100) : 0}
                  % de quienes tienen primer pago registrado.
                </p>
              </div>
              <div>
                <span>Renovaciones registradas</span>
                <strong>
                  {m.renewed} <small>/ {m.renewalEligible}</small>
                </strong>
                <p>
                  {m.renewalEligible
                    ? `${Math.round((m.renewed / m.renewalEligible) * 100)}% de las suscripciones con vencimiento alcanzado.`
                    : 'Sin vencimientos alcanzados en esta cohorte.'}
                </p>
              </div>
            </div>
            <p className="chart-footnote">
              Señales de actividad y renovación de ejemplo. No representan una
              medición de retención por cohortes mensuales.
            </p>
          </section>
        </>
      )}
    </>
  );
}
