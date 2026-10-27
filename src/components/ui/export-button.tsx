'use client';
import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
export function ExportButton({
  onExport,
  disabled = false,
}: {
  onExport: () => Promise<void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <button
        className="button secondary"
        disabled={busy || disabled}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            await onExport();
          } catch {
            setError('No se pudo descargar el archivo. Intenta de nuevo.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {busy ? 'Preparando…' : 'Descargar Excel'}
      </button>
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
