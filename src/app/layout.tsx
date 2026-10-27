import type { Metadata } from 'next';
import { CRMProvider } from '@/components/crm-provider';
import { AppShell } from '@/components/layout/app-shell';
import './globals.css';
export const metadata: Metadata = {
  title: 'Flete CRM · México',
  description: 'Prototipo comercial de Flete CRM. Solo datos ficticios.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>
        <a className="skip-link" href="#contenido">
          Saltar al contenido
        </a>
        <CRMProvider>
          <AppShell>{children}</AppShell>
        </CRMProvider>
      </body>
    </html>
  );
}
