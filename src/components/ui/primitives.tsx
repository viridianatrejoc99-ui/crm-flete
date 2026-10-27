import type { ReactNode } from 'react';
import { Inbox, LoaderCircle } from 'lucide-react';
import type { Stage } from '@/types/crm';
export function StageBadge({ stage }: { stage: Stage }) {
  const colors: Record<Stage, string> = {
    Nuevo: 'badge-blue',
    Contactado: 'badge-violet',
    Interesado: 'badge-amber',
    Suscrito: 'badge-teal',
    'Publicó cargas': 'badge-teal',
    Ganado: 'badge-green',
    Perdido: 'badge-gray',
  };
  return (
    <span className={`badge ${colors[stage]}`}>
      <span className="badge-dot" />
      {stage}
    </span>
  );
}
export function EmptyState({
  title = 'No hay leads con estos filtros',
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={32} />
      <h2>{title}</h2>
      <p>{children ?? 'Prueba otra búsqueda o limpia los filtros.'}</p>
    </div>
  );
}
export function Loading() {
  return (
    <div className="empty-state" role="status">
      <LoaderCircle className="animate-spin" />
      <p>Preparando tu espacio…</p>
    </div>
  );
}
export function Notice({
  text,
  error = false,
}: {
  text: string;
  error?: boolean;
}) {
  return text ? (
    <div
      role={error ? 'alert' : 'status'}
      className={`notice ${error ? 'notice-error' : ''}`}
    >
      {text}
    </div>
  ) : null;
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
