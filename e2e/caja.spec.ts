import { expect, test, type Page } from '@playwright/test'

const CLAVE = 'avicola-prueba-2026'

async function ingresar(page: Page, email: string) {
  await page.goto('/ingresar')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

test.describe.configure({ mode: 'serial' })

test('flujo del día: ingresar, abrir, cargar 3 ventas con el teclado, cerrar y ver el resumen', async ({
  page,
}) => {
  await ingresar(page, 'mostrador@avicola.test')

  // Abrir el día con fondo de caja: se tipea y Enter
  await expect(page.getByRole('heading', { name: 'Abrir el día' })).toBeVisible()
  await page.getByLabel('Fondo de caja inicial').fill('10000')
  await page.getByLabel('Fondo de caja inicial').press('Enter')

  // Tres ventas: importe + Enter (efectivo) o + (digital); el cursor vuelve solo al campo
  const importe = page.getByLabel('Importe', { exact: true })
  await expect(importe).toBeFocused()
  await importe.fill('12500')
  await expect(importe).toHaveValue('12.500')
  await importe.press('Enter')
  await expect(page.getByText(/Venta guardada · Efectivo/)).toBeVisible()
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

  // Cerrar el día con un faltante de $ 500: Enter para revisar, Enter para cerrar
  await page.getByRole('link', { name: 'Cerrar el día' }).click()
  await expect(page.getByText('$ 26.500,00').first()).toBeVisible() // esperado = 10.000 + 16.500
  const contado = page.getByLabel('Efectivo contado')
  await contado.fill('26000')
  await expect(page.getByText(/Faltan \$\s500,00/)).toBeVisible()
  await contado.press('Enter')
  await expect(
    page.getByText('Vas a cerrar el día. Después no se puede modificar sin un administrador.'),
  ).toBeVisible()
  await contado.press('Enter')
  await expect(page.getByRole('heading', { name: 'Día cerrado' })).toBeVisible()

  // Ver el resumen: el día queda bloqueado
  await page.getByRole('link', { name: 'Volver al inicio' }).click()
  await expect(page.getByRole('heading', { name: 'El día de hoy ya se cerró' })).toBeVisible()
  await expect(page.getByText('$ 24.800,00')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reabrir el día' })).toHaveCount(0)
})

test('el cajero no ve las secciones de administración', async ({ page }) => {
  await ingresar(page, 'mostrador@avicola.test')
  await expect(page.getByRole('heading', { name: 'El día de hoy ya se cerró' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Egresos' })).toHaveCount(0)
  await page.goto('/egresos')
  await expect(page.getByText('Esta sección es solo para administradores')).toBeVisible()
})

test('login con contraseña incorrecta muestra un error claro', async ({ page }) => {
  await page.goto('/ingresar')
  await page.getByLabel('Email').fill('mostrador@avicola.test')
  await page.getByLabel('Contraseña').fill('cualquiera-mal')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page.getByText('El email o la contraseña no coinciden.')).toBeVisible()
})

test('con clave temporal, el primer ingreso obliga a elegir una nueva', async ({ page }) => {
  await page.goto('/ingresar')
  await page.getByLabel('Email').fill('temporal@avicola.test')
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
  await expect(page.getByRole('heading', { name: 'El día de hoy ya se cerró' })).toBeVisible()
})
