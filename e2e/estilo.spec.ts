import { expect, test } from '@playwright/test'

test('en el muestrario, el importe se tipea con el teclado y + guarda digital', async ({
  page,
}) => {
  await page.goto('/estilo')
  const importe = page.getByLabel('Importe', { exact: true })
  await importe.fill('125000')
  await expect(importe).toHaveValue('125.000')
  await importe.press('+')
  await expect(page.getByText(/Guardada · Digital \$\s125\.000/)).toBeVisible()
  await expect(importe).toHaveValue('')
  await importe.fill('9abc9')
  await expect(importe).toHaveValue('99')
})
