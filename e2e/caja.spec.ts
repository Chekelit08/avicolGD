import { expect, test, type Page } from '@playwright/test'

const CLAVE = 'avicola-prueba-2026'

async function ingresar(page: Page, email: string) {
  await page.goto('/ingresar')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Contraseña').fill(CLAVE)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

async function tipear(page: Page, importe: string) {
  for (const digito of importe) {
    await page.getByRole('button', { name: digito, exact: true }).click()
  }
}

test.describe.configure({ mode: 'serial' })

test('flujo del día: ingresar, abrir, cargar 3 ventas, cerrar y ver el resumen', async ({
  page,
}) => {
  await ingresar(page, 'mostrador@avicola.test')

  // Abrir el día con fondo de caja
  await expect(page.getByRole('heading', { name: 'Abrir el día' })).toBeVisible()
  await page.getByLabel('Fondo de caja inicial (opcional)').fill('10000')
  await page.getByRole('button', { name: 'Abrir el día' }).click()

  // Tres ventas: importe + un toque en el tipo
  await expect(page.getByLabel('Importe: $ 0')).toBeVisible()
  await tipear(page, '12500')
  await page.getByRole('button', { name: 'Guardar venta en efectivo' }).click()
  await expect(page.getByText(/Guardada · Efectivo/)).toBeVisible()

  await tipear(page, '8300')
  await page.getByRole('button', { name: 'Guardar venta digital' }).click()
  await expect(page.getByText(/Guardada · Digital/)).toBeVisible()

  await tipear(page, '4')
  await page.getByRole('button', { name: 'Tres ceros' }).click()
  await page.getByRole('button', { name: 'Guardar venta en efectivo' }).click()
  await expect(page.getByText('Guardada').first()).toBeVisible()
  await expect(page.getByText('$ 24.800').first()).toBeVisible()

  // Cerrar el día con un faltante de $ 500
  await page.getByRole('link', { name: 'Cerrar el día →' }).click()
  await expect(page.getByText('$ 26.500,00').first()).toBeVisible() // esperado = 10.000 + 16.500
  await tipear(page, '26000')
  await expect(page.getByText(/Faltan \$\s500,00/)).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar el día' }).click()
  await expect(
    page.getByText('Vas a cerrar el día. Después no se puede modificar sin un administrador.'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Sí, cerrar el día' }).click()
  await expect(page.getByRole('heading', { name: 'Día cerrado' })).toBeVisible()

  // Ver el resumen: el día queda bloqueado
  await page.getByRole('link', { name: 'Volver al inicio' }).click()
  await expect(page.getByRole('heading', { name: 'El día de hoy ya se cerró' })).toBeVisible()
  await expect(page.getByText('$ 24.800,00')).toBeVisible()
  await expect(page.getByText('3', { exact: true })).toBeVisible()
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
  await expect(page.getByText('Caja de hoy')).toBeVisible()
})
