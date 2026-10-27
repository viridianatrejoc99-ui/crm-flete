'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  FlaskConical,
  Menu,
  RotateCcw,
  Search,
  Settings2,
  Truck,
  X,
} from 'lucide-react';
import { useCRM } from '@/components/crm-provider';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loading, Notice } from '@/components/ui/primitives';

const navigation = [
  { href: '/mis-leads', label: 'Mis leads', icon: ClipboardList },
  {
    href: '/buscador',
    label: 'Buscador general',
    mobile: 'Buscador',
    icon: Search,
  },
  {
    href: '/dashboard',
    label: 'Dashboard comercial',
    mobile: 'Dashboard',
    icon: ChartNoAxesCombined,
  },
  {
    href: '/administracion',
    label: 'Administración',
    mobile: 'Admin',
    icon: Settings2,
  },
];
export function AppShell({ children }: { children: ReactNode }) {
  const { state, user, ready, storageWarning, switchUser, reset } = useCRM();
  const path = usePathname();
  const [confirmReset, setConfirmReset] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const nav = navigation.filter(
    (n) => n.href !== '/administracion' || user.role === 'admin',
  );
  const roleLabel =
    user.role === 'admin'
      ? 'Administrador'
      : user.role === 'director'
        ? 'Directivo · lectura'
        : 'Asesor comercial';
  const active = (href: string) =>
    path === href || (href === '/mis-leads' && path.startsWith('/leads/'));
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link
          href="/mis-leads"
          className="brand"
          aria-label="Flete CRM, inicio"
        >
          <div className="brand-mark">
            <Truck size={22} />
          </div>
          <div>
            <strong>
              flete<span>.</span>
            </strong>
            <small>CRM MÉXICO</small>
          </div>
        </Link>
        <div className="workspace-label">ESPACIO COMERCIAL</div>
        <nav aria-label="Navegación principal">
          {nav.map((n) => (
            <Link
              className={`nav-link ${active(n.href) ? 'active' : ''}`}
              href={n.href}
              key={n.href}
            >
              <n.icon size={19} />
              {n.href === '/mis-leads' && user.role === 'director'
                ? 'Leads de México'
                : n.label}
              {active(n.href) && <span className="nav-indicator" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="country">
            <span>MX</span>
            <div>
              <strong>Operación México</strong>
              <small>America/Mexico_City</small>
            </div>
          </div>
          <p>Identidad visual provisional</p>
          <button className="text-button" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} /> Restaurar demo
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-context">
            <span className="mobile-brand">
              <Truck size={23} />
            </span>
            <span className="desktop-only">
              Espacio de trabajo <span className="breadcrumb-slash">/</span>
            </span>
            <strong>Flete CRM</strong>
            <span className="country-pill">México</span>
          </div>
          <div className="user-area">
            <span className="avatar">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="user-info">
              <strong>{user.name}</strong>
              <small>{roleLabel}</small>
            </div>
            <button
              className="icon-button"
              aria-label="Opciones de demostración"
              onClick={() => setDemoOpen(!demoOpen)}
            >
              {demoOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </header>
        <div className="demo-banner">
          <span>
            <FlaskConical size={15} />
            <strong>Modo demostración</strong>
            <span className="desktop-only">
              {' '}
              · Datos ficticios, guardados en este navegador.
            </span>
          </span>
          <button onClick={() => setDemoOpen(!demoOpen)}>
            Cambiar perfil <ChevronDown size={14} />
          </button>
        </div>
        {demoOpen && (
          <section
            className="demo-controls"
            aria-label="Controles de demostración"
          >
            <label>
              Ver como
              <select
                value={user.id}
                onChange={(e) => switchUser(e.target.value)}
              >
                {state.users
                  .filter((u) => u.active)
                  .map((u) => (
                    <option value={u.id} key={u.id}>
                      {u.name} ·{' '}
                      {u.role === 'admin'
                        ? 'Administrador'
                        : u.role === 'director'
                          ? 'Directivo'
                          : 'Asesor'}
                    </option>
                  ))}
              </select>
            </label>
            <p>
              Este selector simula permisos. No es autenticación. No ingreses
              información real.
            </p>
            <button
              className="button secondary"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={16} />
              Restaurar datos
            </button>
          </section>
        )}
        <main id="contenido" className="main-content">
          <Notice text={storageWarning} error />
          {ready ? children : <Loading />}
        </main>
        <footer className="app-footer">
          <span>Flete CRM · México · Identidad provisional</span>
          <span>
            Hecho para mantenerte en movimiento <ArrowUpRight size={13} />
          </span>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Navegación móvil">
        {nav.map((n) => (
          <Link
            href={n.href}
            key={n.href}
            className={active(n.href) ? 'active' : ''}
          >
            <n.icon size={21} />
            <span>
              {n.mobile ?? (user.role === 'director' ? 'Leads' : n.label)}
            </span>
          </Link>
        ))}
      </nav>
      {confirmReset && (
        <ConfirmDialog
          title="¿Restaurar la demostración?"
          description="Se eliminarán tus cambios ficticios en este navegador y se cargarán los ejemplos iniciales."
          confirmLabel="Restaurar datos"
          danger
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            reset();
            setConfirmReset(false);
          }}
        />
      )}
    </div>
  );
}
