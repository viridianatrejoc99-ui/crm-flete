'use client';
import { useId, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  CHANNELS,
  STAGES,
  type LeadFilters as Filters,
  type User,
} from '@/types/crm';
import { EMPTY_FILTERS } from '@/lib/commercial';
export function LeadFilters({
  value,
  onChange,
  users,
  showOwner = true,
}: {
  value: Filters;
  onChange: (filters: Filters) => void;
  users: User[];
  showOwner?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();
  const filterCount = Object.entries(value).filter(
    ([key, val]) => key !== 'query' && !!val,
  ).length;
  const update = (key: keyof Filters, next: string | boolean) =>
    onChange({ ...value, [key]: next });
  const active = Object.values(value).some(Boolean);
  return (
    <section className="filter-panel" aria-label="Filtros de leads">
      <div className="search-row">
        <div className="search-input">
          <Search size={19} />
          <input
            aria-label="Buscar por nombre, empresa o teléfono"
            placeholder="Buscar por nombre, empresa o teléfono…"
            value={value.query}
            onChange={(e) => update('query', e.target.value)}
          />
          {value.query && (
            <button
              className="icon-button"
              aria-label="Limpiar búsqueda"
              onClick={() => update('query', '')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className="mobile-filter-toggle"
          aria-label="Mostrar filtros de leads"
          aria-expanded={expanded}
          aria-controls={controlsId}
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal size={18} />
          {filterCount > 0 && <span>{filterCount}</span>}
        </button>
        <span className="filter-label">
          <SlidersHorizontal size={16} />
          Filtros
        </span>
      </div>
      <div
        id={controlsId}
        className={`advanced-filters ${expanded ? 'expanded' : ''}`}
      >
        <div className="filter-grid">
          <label>
            Etapa
            <select
              value={value.stage}
              onChange={(e) => update('stage', e.target.value)}
            >
              <option value="">Todas las etapas</option>
              {STAGES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Canal
            <select
              value={value.channel}
              onChange={(e) => update('channel', e.target.value)}
            >
              <option value="">Todos los canales</option>
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {showOwner && (
            <label>
              Asesor
              <select
                value={value.owner}
                onChange={(e) => update('owner', e.target.value)}
              >
                <option value="">Todos los asesores</option>
                {users
                  .filter((u) => u.role === 'advisor')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {!u.active ? ' · inactivo' : ''}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label>
            Entrada desde
            <input
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(e) => update('from', e.target.value)}
            />
          </label>
          <label>
            Entrada hasta
            <input
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(e) => update('to', e.target.value)}
            />
          </label>
        </div>
        <div className="filter-bottom">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value.pending}
              onChange={(e) => update('pending', e.target.checked)}
            />
            Solo seguimientos vencidos
          </label>
          {active && (
            <button
              className="text-button"
              onClick={() => onChange({ ...EMPTY_FILTERS })}
            >
              Limpiar filtros <X size={14} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
