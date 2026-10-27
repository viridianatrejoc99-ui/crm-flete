import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>No encontramos esta página</h1>
      <p>Vuelve a tu espacio comercial para continuar.</p>
      <Link className="button primary" href="/mis-leads">
        Ir a Mis leads
      </Link>
    </div>
  );
}
