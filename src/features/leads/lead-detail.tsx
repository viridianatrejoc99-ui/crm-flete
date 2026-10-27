'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  Clock3,
  MessageCircle,
  Pencil,
  Phone,
  Save,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useCRM } from '@/components/crm-provider';
import { EmptyState, Notice, StageBadge } from '@/components/ui/primitives';
import { ExportButton } from '@/components/ui/export-button';
import { canAdminister, canComment, canEditLead } from '@/lib/permissions';
import { dateTime, fromInputDate, toInputDate } from '@/lib/formatting';
import { downloadWorkbook, leadSheet } from '@/lib/export';
import { CHANNELS, STAGES, type Lead } from '@/types/crm';
import type { ProfileEdit } from './mutations';

export function LeadDetail({ id }: { id: string }) {
  const { state } = useCRM();
  const lead = state.leads.find((l) => l.id === id);
  return lead ? (
    <LeadDetailContent key={id} lead={lead} />
  ) : (
    <EmptyState title="Este lead no existe">
      <Link href="/mis-leads">Volver a Mis leads</Link>
    </EmptyState>
  );
}
function LeadDetailContent({ lead }: { lead: Lead }) {
  const { state, user, dispatch } = useCRM();
  const [stage, setStage] = useState(lead.stage);
  const [lossReason, setLossReason] = useState(lead.lossReason);
  const [followup, setFollowup] = useState(toInputDate(lead.nextFollowUp));
  const [result, setResult] = useState('');
  const [comment, setComment] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newOwner, setNewOwner] = useState(lead.ownerId);
  const editable = canEditLead(user, lead);
  const admin = canAdminister(user);
  const owner = state.users.find((u) => u.id === lead.ownerId);
  function run(fn: () => void, message: string) {
    try {
      fn();
      setNotice(message);
      setError(false);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'No fue posible guardar.');
      setError(true);
    }
  }
  const values: [string, string | number][] = [
    ['Nombre', lead.name],
    ['Empresa', lead.company],
    ['Teléfono', lead.phone],
    ['Email', lead.email],
    ['Ciudad', lead.city],
    ['Cargas estimadas · 4 semanas', lead.estimatedLoads],
    ['Canal de adquisición', lead.channel],
    ['Fecha de entrada', dateTime(lead.enteredAt)],
    ['Primer contacto', dateTime(lead.firstContactAt)],
    ['Número de reingresos', lead.reentries],
  ];
  return (
    <>
      <Link className="back-link" href="/mis-leads">
        <ArrowLeft size={16} />
        Volver a leads
      </Link>
      <div className="detail-heading">
        <div>
          <div className="inline-row">
            <span className="eyebrow">{lead.id}</span>
            <StageBadge stage={lead.stage} />
          </div>
          <h1>{lead.name}</h1>
          <p className="page-description">
            {lead.company} · {lead.city}
          </p>
        </div>
        <ExportButton
          onExport={() =>
            downloadWorkbook(`flete-${lead.id}-demo`, [
              leadSheet([lead], state.users),
            ])
          }
        />
      </div>
      <Notice text={notice} error={error} />
      <div className="detail-actions">
        <button
          className="button primary"
          onClick={() => {
            setNotice(
              'WhatsApp simulado. El teléfono es ficticio; no se abrió ningún servicio externo.',
            );
            setError(false);
          }}
        >
          <MessageCircle size={18} />
          WhatsApp
        </button>
        <button
          className="button secondary"
          onClick={() => {
            setNotice(
              'Llamada simulada. No se realizará ninguna llamada a los teléfonos ficticios.',
            );
            setError(false);
          }}
        >
          <Phone size={17} />
          Llamar
        </button>
        {canComment(user) && (
          <a className="button secondary" href="#actividad">
            <MessageCircle size={16} />
            Comentar
          </a>
        )}
        <span className="demo-note">Acciones de contacto simuladas</span>
      </div>
      {!editable && (
        <div className="info-strip">
          <ShieldCheck size={18} />
          <p>
            {user.role === 'director'
              ? 'Acceso de lectura. Puedes consultar y descargar reportes.'
              : 'Este lead pertenece a otro asesor. Puedes consultar y comentar; su etapa y seguimiento son de solo lectura.'}
          </p>
        </div>
      )}
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <UserRound size={18} />
                Datos del prospecto
              </h2>
              {admin && (
                <button
                  className="text-button"
                  onClick={() => setEditing(!editing)}
                >
                  <Pencil size={15} />
                  {editing ? 'Cancelar' : 'Editar'}
                </button>
              )}
            </div>
            {editing && admin ? (
              <ProfileForm
                lead={lead}
                onSave={(profile) =>
                  run(() => {
                    dispatch({ type: 'profile', id: lead.id, values: profile });
                    setEditing(false);
                  }, 'Datos del prospecto actualizados.')
                }
              />
            ) : (
              <dl className="data-grid">
                {values.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Adquisición y atribución</h2>
              <span className="channel-tag">{lead.channel}</span>
            </div>
            <dl className="data-grid">
              {[
                ['Campaña', lead.campaign],
                ['UTM source', lead.utmSource],
                ['UTM medium', lead.utmMedium],
                ['UTM campaign', lead.utmCampaign],
                ['UTM term', lead.utmTerm],
                ['UTM content', lead.utmContent],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value || 'Sin registrar'}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="panel" id="actividad">
            <div className="panel-heading">
              <h2>
                <MessageCircle size={18} />
                Actividad y comentarios
              </h2>
              <span className="count-badge">{lead.activities.length}</span>
            </div>
            {canComment(user) && (
              <form
                className="comment-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => {
                    dispatch({ type: 'comment', id: lead.id, text: comment });
                    setComment('');
                  }, 'Comentario guardado.');
                }}
              >
                <label htmlFor="comment">Agregar un comentario</label>
                <textarea
                  id="comment"
                  required
                  maxLength={2000}
                  placeholder="Escribe el contexto que ayudará al próximo seguimiento…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="comment-footer">
                  <small>
                    Visible para el equipo · solo información ficticia
                  </small>
                  <button className="button primary" type="submit">
                    <Send size={15} />
                    Comentar
                  </button>
                </div>
              </form>
            )}
            {lead.activities.length ? (
              <ol className="timeline">
                {lead.activities.map((a) => (
                  <li key={a.id}>
                    <span className={`timeline-dot ${a.kind}`} />{' '}
                    <div>
                      <div className="activity-meta">
                        <strong>
                          {state.users.find((u) => u.id === a.authorId)?.name ??
                            'Equipo'}
                        </strong>
                        <span>
                          {a.kind === 'comment'
                            ? 'Comentario'
                            : a.kind === 'contact'
                              ? 'Contacto'
                              : a.kind === 'assignment'
                                ? 'Asignación'
                                : 'Actualización'}
                        </span>
                      </div>
                      <p>{a.text}</p>
                      <time dateTime={a.createdAt}>
                        {dateTime(a.createdAt)}
                      </time>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted panel-empty">
                Aún no hay actividad. Tu primer seguimiento empieza aquí.
              </p>
            )}
          </section>
        </div>
        <aside className="detail-aside">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <CalendarClock size={18} />
                Gestión comercial
              </h2>
            </div>
            <form
              className="stack-form"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () =>
                    dispatch({
                      type: 'workflow',
                      id: lead.id,
                      values: {
                        stage,
                        lossReason,
                        nextFollowUp: fromInputDate(followup),
                      },
                    }),
                  'Etapa y seguimiento guardados.',
                );
              }}
            >
              <label>
                Etapa comercial
                <select
                  disabled={!editable}
                  value={stage}
                  onChange={(e) => setStage(e.target.value as Lead['stage'])}
                >
                  {STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {stage === 'Perdido' && (
                <label>
                  Motivo de pérdida <span className="required">*</span>
                  <textarea
                    disabled={!editable}
                    required
                    value={lossReason}
                    maxLength={500}
                    onChange={(e) => setLossReason(e.target.value)}
                  />
                </label>
              )}
              <div className="stage-explainer">
                <Check size={15} />
                <span>
                  {stage === 'Suscrito'
                    ? 'Pagó y todavía no publicó cargas.'
                    : stage === 'Publicó cargas'
                      ? 'Publicó cargas y todavía no pagó.'
                      : stage === 'Ganado'
                        ? 'Pagó y publicó cargas.'
                        : stage === 'Perdido'
                          ? 'El motivo de pérdida es obligatorio.'
                          : 'El resultado de contacto se registra por separado.'}
                </span>
              </div>
              <label>
                Próximo seguimiento
                <input
                  type="datetime-local"
                  disabled={!editable}
                  value={followup}
                  onChange={(e) => setFollowup(e.target.value)}
                />
              </label>
              <small className="muted">Hora de Ciudad de México (UTC−6).</small>
              {editable && (
                <button type="submit" className="button primary full-width">
                  <Save size={16} />
                  Guardar seguimiento
                </button>
              )}
            </form>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>
                <Phone size={18} />
                Último contacto
              </h2>
            </div>
            <p className="last-contact">
              {lead.lastContactResult || 'Aún sin contacto registrado'}
            </p>
            <p className="small muted">
              Primer intento: {dateTime(lead.firstContactAt)}
            </p>
            {editable && (
              <form
                className="stack-form spaced"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => {
                    dispatch({ type: 'contact', id: lead.id, result });
                    setResult('');
                  }, 'Resultado registrado. La etapa comercial no cambió.');
                }}
              >
                <label>
                  Resultado del contacto
                  <select
                    required
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                  >
                    <option value="">Selecciona un resultado</option>
                    {[
                      'No contestó',
                      'Conversación realizada',
                      'Pidió contacto después',
                      'Número incorrecto',
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <button className="button secondary full-width">
                  Registrar contacto
                </button>
              </form>
            )}
            <small className="muted spaced">
              <Clock3 size={13} /> Tiempo a primer contacto medido desde el
              primer intento.
            </small>
          </section>
          <section className="panel">
            <div className="panel-heading">
              <h2>Asesor responsable</h2>
            </div>
            <div className="owner large">
              <span className="avatar">
                {owner?.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <strong>{owner?.name}</strong>
                <small>
                  {owner?.active ? 'Asesor activo' : 'Asesor inactivo'}
                </small>
              </div>
            </div>
            {admin && (
              <form
                className="stack-form spaced"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(
                    () =>
                      dispatch({
                        type: 'assign',
                        id: lead.id,
                        ownerId: newOwner,
                      }),
                    'Lead reasignado.',
                  );
                }}
              >
                <label>
                  Reasignar a
                  <select
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                  >
                    <option value={lead.ownerId}>{owner?.name} · actual</option>
                    {state.users
                      .filter(
                        (u) =>
                          u.role === 'advisor' &&
                          u.active &&
                          u.id !== lead.ownerId,
                      )
                      .map((u) => (
                        <option value={u.id} key={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </label>
                <button className="button secondary">
                  Confirmar reasignación
                </button>
              </form>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
function ProfileForm({
  lead,
  onSave,
}: {
  lead: Lead;
  onSave: (profile: ProfileEdit) => void;
}) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (key: string) => String(data.get(key) ?? '').trim();
    onSave({
      name: get('name'),
      company: get('company'),
      phone: get('phone'),
      email: get('email'),
      city: get('city'),
      estimatedLoads: Number(get('estimatedLoads')),
      channel: get('channel') as Lead['channel'],
      campaign: get('campaign'),
      utmSource: get('utmSource'),
      utmMedium: get('utmMedium'),
      utmCampaign: get('utmCampaign'),
      utmTerm: get('utmTerm'),
      utmContent: get('utmContent'),
    });
  }
  const fields: [keyof ProfileEdit, string, string][] = [
    ['name', 'Nombre', 'text'],
    ['company', 'Empresa', 'text'],
    ['phone', 'Teléfono', 'tel'],
    ['email', 'Email', 'email'],
    ['city', 'Ciudad', 'text'],
    ['estimatedLoads', 'Cargas en 4 semanas', 'number'],
    ['campaign', 'Campaña', 'text'],
    ['utmSource', 'UTM source', 'text'],
    ['utmMedium', 'UTM medium', 'text'],
    ['utmCampaign', 'UTM campaign', 'text'],
    ['utmTerm', 'UTM term', 'text'],
    ['utmContent', 'UTM content', 'text'],
  ];
  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        {fields.map(([key, label, type]) => (
          <label key={key}>
            {label}
            <input
              name={key}
              type={type}
              min={type === 'number' ? 0 : undefined}
              required={['name', 'company', 'phone'].includes(key)}
              defaultValue={lead[key]}
            />
          </label>
        ))}
        <label>
          Canal
          <select name="channel" defaultValue={lead.channel}>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <button className="button primary spaced">
        <Save size={16} />
        Guardar datos
      </button>
    </form>
  );
}
