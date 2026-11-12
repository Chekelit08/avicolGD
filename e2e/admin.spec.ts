import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/ingresar')
  await page.getByLabel('Usuario o email').fill('gabriel@avicola.test')
  await page.getByLabel('Contraseña').fill('avicola-prueba-2026')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByRole('link', { name: 'Gastos' })).toBeVisible()
})

test('el admin carga un egreso y lo ve en el listado', async ({ page }) => {
  const descripcion = `Bolsas ${Date.now()}`
  await page.getByRole('link', { name: 'Gastos' }).click()
  await page.getByLabel('Categoría').first().selectOption({ label: 'Otros' })
  await page.getByLabel('Qué se pagó').fill(descripcion)
  await page.getByLabel('Monto').fill('15.000')
  await page.getByRole('button', { name: 'Guardar gasto' }).click()
  await expect(page.getByText('Elegí si se pagó en efectivo o digital')).toBeVisible()
  await page.getByText('Efectivo', { exact: true }).first().click()
  await page.getByRole('button', { name: 'Guardar gasto' }).click()
  await expect(page.getByText(`✓ Gasto guardado: ${descripcion}`)).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: descripcion })).toBeVisible()
})

test('el panel muestra indicadores y gráficos con su tabla', async ({ page }) => {
  await page.getByRole('link', { name: 'Resumen', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Facturación por día' })).toBeVisible()
  await expect(page.getByText('Ticket promedio')).toBeVisible()
  await expect(page.getByText('Hoy vas')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resumen de la semana' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mandar resumen por WhatsApp' })).toHaveAttribute(
    'href',
    /^https:\/\/wa\.me\/.*semana%20del/,
  )
  await page.getByText('Ver los datos').first().click()
  await expect(page.getByRole('columnheader', { name: 'Efectivo' }).first()).toBeVisible()
})

test('el menú del dueño es corto y el historial muestra un día', async ({ page }) => {
  for (const fuera of ['Personal', 'Auditoría', 'Ajustes', 'Consulta', 'Panel'])
    await expect(page.getByRole('link', { name: fuera, exact: true })).toHaveCount(0)
  await page.getByRole('link', { name: 'Historial' }).click()
  await expect(page.getByRole('heading', { name: 'Historial' })).toBeVisible()
})

test('el admin crea la cuenta Mostrador con un clic y entra con usuario simple', async ({
  page,
  browser,
}) => {
  await page.getByRole('link', { name: 'Usuarios' }).click()
  await page.getByRole('button', { name: 'Nueva cuenta' }).click()
  const usuario = `caja${Date.now() % 100000}`
  await page.getByLabel('Nombre').fill('Caja de prueba')
  await page.getByLabel('Usuario para entrar').fill(usuario)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText('✓ Cuenta de Caja de prueba creada')).toBeVisible()
  const clave = await page.locator('dd').nth(1).innerText()
  await expect(page.getByRole('link', { name: 'Mandar por WhatsApp' })).toBeVisible()

  // La persona entra escribiendo solo el usuario
  const otra = await browser.newPage()
  await otra.goto('/ingresar')
  await otra.getByLabel('Usuario o email').fill(usuario)
  await otra.getByLabel('Contraseña').fill(clave)
  await otra.getByRole('button', { name: 'Ingresar' }).click()
  await expect(otra.getByText(/elegí tu contraseña/)).toBeVisible()
  await otra.close()

  // El admin le pone una contraseña elegida por él, sin pedir que la cambie
  await page.getByRole('button', { name: 'Listo' }).click()
  const fila = page.getByRole('listitem').filter({ hasText: `Usuario: ${usuario}` })
  await fila.getByRole('button', { name: 'Cambiar contraseña' }).click()
  await fila.getByLabel(/Contraseña nueva para/).fill('milanesa napolitana')
  await fila.getByLabel('Que elija una propia la primera vez que entre').uncheck()
  await fila.getByRole('button', { name: 'Guardar contraseña' }).click()
  await expect(fila.getByText('✓ Contraseña nueva para Caja de prueba')).toBeVisible()

  const tercera = await browser.newPage()
  await tercera.goto('/ingresar')
  await tercera.getByLabel('Usuario o email').fill(usuario)
  await tercera.getByLabel('Contraseña').fill('milanesa napolitana')
  await tercera.getByRole('button', { name: 'Ingresar' }).click()
  await expect(tercera.getByRole('heading', { name: 'Caja de hoy' })).toBeVisible()
  await tercera.close()
})
