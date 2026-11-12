import { expect, test, type Page } from '@playwright/test'

const CLAVE = 'avicola-prueba-2026'

async function ingresar(page: Page, email: string) {
  await page.goto('/ingresar')
  await page.getByLabel('Usuario o email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

test.describe.configure({ mode: 'serial' })

test('caja: se ingresa y se cargan ventas con el teclado, sin abrir ni cerrar el día', async ({
  page,
}) => {
  await ingresar(page, 'mostrador@avicola.test')

  // No hay que abrir el día: la caja ya está lista
  await expect(page.getByRole('heading', { name: 'Caja de hoy' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Cerrar el día' })).toHaveCount(0)

  // Tres ventas: importe + Enter (efectivo) o + (digital); el cursor vuelve solo al campo
  const importe = page.getByLabel('Importe', { exact: true })
  await expect(importe).toBeFocused()
  await importe.fill('12500')
  await expect(importe).toHaveValue('12.500')
  await importe.press('Enter')
  await expect(page.getByText(/Venta guardada/)).toBeVisible()

  // Calculadora de vuelto: pagó con $ 20.000
  await page.getByRole('button', { name: '$ 20.000' }).click()
  await expect(page.getByText(/Vuelto:\s*\$\s7\.500/)).toBeVisible()
  await importe.focus()
  await expect(importe).toHaveValue('')
  await expect(importe).toBeFocused()

  await importe.fill('8300')
  await importe.press('+')
  await expect(page.getByText(/Venta guardada · Digital/)).toBeVisible()

  await importe.fill('4000')
  await page.getByRole('button', { name: 'Guardar venta en efectivo' }).click()
  await expect(page.getByText('$ 24.800').first()).toBeVisible()

  // Un importe alto pide confirmación; Esc vuelve sin borrar
  await importe.fill('600000')
  await importe.press('Enter')
  await expect(page.getByText(/Es un importe alto/)).toBeVisible()
  await importe.press('Escape')
  await expect(page.getByText(/Es un importe alto/)).toHaveCount(0)
  await expect(importe).toHaveValue('600.000')
  await importe.press('Escape')
  await expect(importe).toHaveValue('')

  // Anular la última venta con motivo
  await page.getByRole('button', { name: 'Anular' }).first().click()
  await page.getByRole('button', { name: 'Error de tipeo' }).click()
  await page.getByRole('button', { name: 'Anular venta' }).click()
  await expect(page.getByText('$ 20.800').first()).toBeVisible()
})

test('el cajero no ve las secciones de administración', async ({ page }) => {
  await ingresar(page, 'mostrador@avicola.test')
  await expect(page.getByRole('heading', { name: 'Caja de hoy' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Gastos' })).toHaveCount(0)
  await page.goto('/egresos')
  await expect(page.getByText('Esta sección es solo para administradores')).toBeVisible()
})

test('login con contraseña incorrecta muestra un error claro', async ({ page }) => {
  await page.goto('/ingresar')
  await page.getByLabel('Usuario o email').fill('mostrador@avicola.test')
  await page.getByLabel('Contraseña').fill('cualquiera-mal')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText('El usuario o la contraseña no coinciden.')).toBeVisible()
})

test('con clave temporal, el primer ingreso obliga a elegir una nueva', async ({ page }) => {
  await page.goto('/ingresar')
  await page.getByLabel('Usuario o email').fill('temporal@avicola.test')
  await page.getByLabel('Contraseña').fill('pollo-asado-1234')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText('Hola Lucía: elegí tu contraseña')).toBeVisible()
  await page.getByLabel('Contraseña nueva').fill('corta')
  await page.getByLabel('Repetí la contraseña').fill('corta')
  await page.getByRole('button', { name: 'Guardar contraseña' }).click()
  await expect(page.getByText('Tiene que tener al menos 10 caracteres')).toBeVisible()
  await page.getByLabel('Contraseña nueva').fill('milanesa con papas')
  await page.getByLabel('Repetí la contraseña').fill('milanesa con papas')
  await page.getByRole('button', { name: 'Guardar contraseña' }).click()
  await expect(page.getByRole('heading', { name: 'Caja de hoy' })).toBeVisible()
})
