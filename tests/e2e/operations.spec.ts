import { test, expect, type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
async function admin(page: Page) {
  await page.goto('/mis-leads');
  await page.getByRole('button', { name: 'Cambiar perfil' }).click();
  await page.getByLabel('Ver como').selectOption('admin');
  await page.goto('/administracion');
  await expect(
    page.getByRole('heading', { name: 'Administración', exact: true }),
  ).toBeVisible();
}
test('busca todos los leads y exporta exclusivamente los resultados filtrados a Excel', async ({
  page,
}) => {
  await page.goto('/buscador');
  await expect(page.locator('.lead-card')).toHaveCount(25);
  await page.getByLabel('Buscar por nombre, empresa o teléfono').fill('Sofía');
  await expect(page.locator('.lead-card')).toHaveCount(1);
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar Excel' }).click();
  const file = await downloadEvent;
  expect(file.suggestedFilename()).toMatch(/\.xlsx$/);
  const path = await file.path();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path!);
  const sheet = workbook.getWorksheet('Leads ficticios')!;
  expect(sheet.rowCount).toBe(2);
  expect(sheet.getCell('B2').value).toBe('Sofía Ramírez');
});
test('dashboard filtra y descarga indicadores junto con su cohorte', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await page
    .getByRole('combobox', { name: 'Asesor', exact: true })
    .selectOption('alberto');
  await expect(
    page.locator('.metric-card').first().locator('strong'),
  ).toHaveText('5');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar Excel' }).click();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await (await downloadEvent).path())!);
  expect(workbook.getWorksheet('Leads ficticios')!.rowCount).toBe(6);
  expect(workbook.getWorksheet('Resultados por asesor')!.rowCount).toBe(2);
  await page.getByLabel('Entrada desde').fill('2099-01-01');
  await expect(
    page.getByRole('heading', { name: 'No hay resultados para este periodo' }),
  ).toBeVisible();
});
test('administración desactiva asesores, simula asignación, configura alertas y reasigna', async ({
  page,
}) => {
  await admin(page);
  const alberto = page.locator('.advisor-card').filter({ hasText: 'Alberto' });
  await alberto.getByRole('button', { name: 'Desactivar' }).click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Confirmar', exact: true })
    .click();
  await expect(alberto.getByText('Inactivo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Simular llegada' }).click();
  await expect(page.locator('.simulation-result')).toContainText('Yoss');
  await page.getByLabel('Tiempo de alerta · minutos laborales').fill('45');
  await page.getByRole('button', { name: 'Guardar configuración' }).click();
  const first = page.locator('.reassignment-row').first();
  await first.getByLabel('Asesor responsable').selectOption('tania');
  await first.getByRole('button', { name: 'Reasignar', exact: true }).click();
  await first.getByRole('button', { name: 'Confirmar reasignación' }).click();
  await expect(
    page.locator('.reassignment-row').first().getByLabel('Asesor responsable'),
  ).toHaveValue('tania');
  await page.reload();
  await expect(
    page.getByLabel('Tiempo de alerta · minutos laborales'),
  ).toHaveValue('45');
  await expect(
    page
      .locator('.advisor-card')
      .filter({ hasText: 'Alberto' })
      .getByText('Inactivo', { exact: true }),
  ).toBeVisible();
});
test('bloquea administración para un asesor y permite restaurar los datos', async ({
  page,
}) => {
  await page.goto('/administracion');
  await expect(
    page.getByRole('heading', { name: 'Acceso exclusivo de administración' }),
  ).toBeVisible();
  await page.goto('/leads/MX-1001');
  await page.getByLabel('Agregar un comentario').fill('Eliminar al restaurar');
  await page.getByRole('button', { name: 'Comentar', exact: true }).click();
  await page.getByRole('button', { name: 'Cambiar perfil' }).click();
  await page
    .getByRole('button', { name: 'Restaurar datos', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Restaurar datos', exact: true })
    .click();
  await expect(
    page.getByText('Eliminar al restaurar', { exact: true }),
  ).toHaveCount(0);
});
test('todas las vistas se adaptan a 360px y escritorio sin errores de JavaScript', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await admin(page);
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      '/mis-leads',
      '/buscador',
      '/leads/MX-1001',
      '/dashboard',
      '/administracion',
    ]) {
      await page.goto(route);
      await expect(page.locator('main h1')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${route} en ${width}px`,
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
