import { test, expect, type Page } from '@playwright/test';

test('los filtros móviles se despliegan y combinan con la búsqueda', async ({
  page,
}) => {
  await page.goto('/buscador');
  const toggle = page.getByRole('button', { name: 'Mostrar filtros de leads' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page
    .getByRole('combobox', { name: 'Asesor', exact: true })
    .selectOption('alberto');
  await expect(page.locator('.lead-card')).toHaveCount(5);
  await page
    .getByRole('combobox', { name: 'Etapa', exact: true })
    .selectOption('Nuevo');
  await expect(page.locator('.lead-card')).toHaveCount(2);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.getByLabel('Buscar por nombre, empresa o teléfono').fill('Ana');
  await expect(page.locator('.lead-card')).toHaveCount(1);
});
async function role(page: Page, name: string) {
  await page.getByRole('button', { name: 'Cambiar perfil' }).click();
  await page.getByLabel('Ver como').selectOption(name);
}
test('asesor gestiona un lead propio y conserva cambios al recargar', async ({
  page,
}) => {
  await page.goto('/mis-leads');
  await expect(
    page.getByRole('heading', { name: 'Mis leads', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.lead-card')).toHaveCount(5);
  await page.getByRole('link', { name: 'Ver detalle de Ana Torres' }).click();
  await page.getByLabel('Etapa comercial').selectOption('Interesado');
  await page
    .getByLabel('Próximo seguimiento', { exact: true })
    .fill('2026-12-01T10:30');
  await page.getByRole('button', { name: 'Guardar seguimiento' }).click();
  await page
    .getByLabel('Agregar un comentario')
    .fill('Seguimiento ficticio desde celular');
  await page.getByRole('button', { name: 'Comentar', exact: true }).click();
  await page.reload();
  await expect(page.getByLabel('Etapa comercial')).toHaveValue('Interesado');
  await expect(
    page.getByText('Seguimiento ficticio desde celular', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Próximo seguimiento', { exact: true }),
  ).toHaveValue('2026-12-01T10:30');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test('un asesor comenta en otro lead y un directivo solo consulta', async ({
  page,
}) => {
  await page.goto('/leads/MX-1002');
  await expect(page.getByLabel('Etapa comercial')).toBeDisabled();
  await page
    .getByLabel('Agregar un comentario')
    .fill('Comentario en lead ajeno');
  await page.getByRole('button', { name: 'Comentar', exact: true }).click();
  await expect(
    page.getByText('Comentario en lead ajeno', { exact: true }),
  ).toBeVisible();
  await role(page, 'marco');
  await expect(page.getByLabel('Agregar un comentario')).toHaveCount(0);
  await expect(page.getByLabel('Etapa comercial')).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Descargar Excel' }),
  ).toBeVisible();
});
