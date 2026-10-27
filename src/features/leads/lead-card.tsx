'use client';
import Link from 'next/link';
import { useCRM } from '@/components/crm-provider';
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { StageBadge } from '@/components/ui/primitives';
import { dateTime } from '@/lib/formatting';
import { businessMinutes } from '@/lib/commercial';
import type { Lead, User } from '@/types/crm';
export function LeadCard({
  lead,
  owner,
  alertMinutes,
  onContact,
}: {
  lead: Lead;
  owner?: User;
  alertMinutes: number;
  onContact: (type: string) => void;
}) {
  const { now } = useCRM();
  const overdue =
    !!lead.nextFollowUp &&
    Date.parse(lead.nextFollowUp) < now &&
    !['Ganado', 'Perdido'].includes(lead.stage);
  const noContact =
    !['Ganado', 'Perdido'].includes(lead.stage) &&
    !lead.firstContactAt &&
    businessMinutes(lead.enteredAt, new Date(now).toISOString()) >=
      alertMinutes;
  return (
    <article className="lead-card">
      <div className="card-top">
        <StageBadge stage={lead.stage} />
        <span className="lead-id">{lead.id}</span>
      </div>
      <Link href={`/leads/${lead.id}`} className="lead-title">
        <h3>{lead.name}</h3>
        <ArrowUpRight size={18} />
      </Link>
      <p className="company">
        <Building2 size={15} />
        {lead.company}
      </p>
      <div className="lead-meta">
        <span>
          <MapPin size={14} />
          {lead.city}
        </span>
        <span className="channel-tag">{lead.channel}</span>
      </div>
      <div className={`followup ${overdue || noContact ? 'overdue' : ''}`}>
        <CalendarClock size={16} />
        <div>
          <span>
            {overdue
              ? 'Seguimiento vencido'
              : noContact
                ? 'Sin primer contacto'
                : 'Próximo seguimiento'}
          </span>
          <strong>
            {noContact && !overdue
              ? `Supera ${alertMinutes} min laborales`
              : lead.nextFollowUp
                ? dateTime(lead.nextFollowUp)
                : 'Sin seguimiento programado'}
          </strong>
        </div>
        {overdue && <Clock3 size={14} />}
      </div>
      <div className="card-footer">
        <span className="owner">
          <span className="mini-avatar">{owner?.name.slice(0, 1)}</span>
          {owner?.name}
        </span>
        <div className="contact-actions">
          <button
            className="icon-button whatsapp"
            aria-label={`WhatsApp con ${lead.name} (simulado)`}
            onClick={() => onContact('WhatsApp')}
          >
            <MessageCircle size={18} />
          </button>
          <button
            className="icon-button"
            aria-label={`Llamar a ${lead.name} (simulado)`}
            onClick={() => onContact('Llamada')}
          >
            <Phone size={17} />
          </button>
          <Link
            className="icon-button"
            aria-label={`Ver detalle de ${lead.name}`}
            href={`/leads/${lead.id}`}
          >
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
