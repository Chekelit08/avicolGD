import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/ingresar')
  await page.getByLabel('Email').fill('gabriel@avicola.test')
  await page.getByLabel('Contraseña').fill('avicola-prueba-2026')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('link', { name: 'Egresos' })).toBeVisible()
})

test('el admin carga un egreso y lo ve en el listado', async ({ page }) => {
  const descripcion = `Bolsas ${Date.now()}`
  await page.getByRole('link', { name: 'Egresos' }).click()
  await page.getByLabel('Categoría').first().selectOption({ label: 'Otros' })
  await page.getByLabel('Qué se pagó').fill(descripcion)
  await page.getByLabel('Monto').fill('15.000')
  await page.getByRole('button', { name: 'Guardar egreso' }).click()
  await expect(page.getByText('Elegí si se pagó en efectivo o digital')).toBeVisible()
  await page.getByText('Efectivo', { exact: true }).first().click()
  await page.getByRole('button', { name: 'Guardar egreso' }).click()
  await expect(page.getByText(`✓ Egreso guardado: ${descripcion}`)).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: descripcion })).toBeVisible()
})

test('el panel muestra indicadores y gráficos con su tabla', async ({ page }) => {
  await page.getByRole('link', { name: 'Panel' }).click()
  await expect(page.getByRole('heading', { name: 'Facturación por día' })).toBeVisible()
  await expect(page.getByText('Ticket promedio')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Horas pico' })).toBeVisible()
  await expect(page.getByText('Hoy vas')).toBeVisible()
  await page.getByText('Ver los datos').first().click()
  await expect(page.getByRole('columnheader', { name: 'Efectivo' }).first()).toBeVisible()
})

test('personal y auditoría cargan', async ({ page }) => {
  await page.getByRole('link', { name: 'Personal' }).click()
  await expect(page.getByRole('heading', { name: /Costo de personal de/ })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Marcos Ríos' })).toBeVisible()
  await page.getByRole('link', { name: 'Auditoría' }).click()
  await expect(page.getByRole('heading', { name: 'Auditoría' })).toBeVisible()
})

test('en Ajustes se guarda el WhatsApp del dueño y se ve Mercado Pago', async ({ page }) => {
  await page.getByRole('link', { name: 'Ajustes' }).click()
  await expect(page.getByRole('heading', { name: 'Mercado Pago' })).toBeVisible()
  await expect(page.getByText('Cargar solos los cobros en la caja')).toBeVisible()
  const numero = page.getByLabel('WhatsApp del dueño')
  await numero.fill('11 15 2233')
  await expect(
    page.getByText('Escribí el número con característica, sin el 0 ni el 15.'),
  ).toBeVisible()
  await numero.fill('11 2233 4455')
  await expect(page.getByText('Se manda a +5491122334455')).toBeVisible()
  await page.getByRole('button', { name: 'Guardar número' }).click()
  await expect(page.getByRole('button', { name: 'Guardar número' })).toBeDisabled()
})
