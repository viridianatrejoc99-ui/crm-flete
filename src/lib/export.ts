import type { Lead, User } from '@/types/crm';
import { dateTime } from '@/lib/formatting';
export async function downloadWorkbook(
  filename: string,
  sheets: { name: string; headers: string[]; rows: (string | number)[][] }[],
) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Flete CRM · Demostración';
  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);
    ws.addRow(sheet.headers);
    sheet.rows.forEach((row) => ws.addRow(row));
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF12665B' },
    };
    ws.columns.forEach((column) => {
      column.width = 25;
    });
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, ws.rowCount), column: sheet.headers.length },
    };
  }
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function leadSheet(leads: Lead[], users: User[]) {
  return {
    name: 'Leads ficticios',
    headers: [
      'ID',
      'Nombre',
      'Empresa',
      'Teléfono',
      'Email',
      'Ciudad',
      'Cargas en 4 semanas',
      'Canal',
      'Campaña',
      'UTM source',
      'UTM medium',
      'UTM campaign',
      'UTM term',
      'UTM content',
      'Entrada (CDMX)',
      'Asesor',
      'Etapa',
      'Último contacto',
      'Motivo de pérdida',
      'Próximo seguimiento (CDMX)',
      'Primer contacto (CDMX)',
      'Reingresos',
      'Pagó',
      'Publicó cargas',
      'Cobrado demo MXN',
    ],
    rows: leads.map((l) => [
      l.id,
      l.name,
      l.company,
      l.phone,
      l.email,
      l.city,
      l.estimatedLoads,
      l.channel,
      l.campaign,
      l.utmSource,
      l.utmMedium,
      l.utmCampaign,
      l.utmTerm,
      l.utmContent,
      dateTime(l.enteredAt),
      users.find((u) => u.id === l.ownerId)?.name ?? '',
      l.stage,
      l.lastContactResult,
      l.lossReason,
      dateTime(l.nextFollowUp),
      dateTime(l.firstContactAt),
      l.reentries,
      l.hasPaid ? 'Sí' : 'No',
      l.hasPublished ? 'Sí' : 'No',
      l.collectedAmount,
    ]),
  };
}
