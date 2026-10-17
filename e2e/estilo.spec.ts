import { expect, test } from '@playwright/test'

test('el visor muestra lo que se tipea y los botones de tipo guardan', async ({ page }) => {
  await page.goto('/estilo')

  const efectivo = page.getByRole('button', { name: 'Guardar venta en efectivo' })
  await expect(efectivo).toBeDisabled()

  for (const tecla of ['1', '2', '5']) {
    await page.getByRole('button', { name: tecla, exact: true }).click()
  }
  await page.getByRole('button', { name: 'Tres ceros' }).click()
  await expect(page.getByLabel('Importe: $ 125.000')).toBeVisible()

  await page.getByRole('button', { name: 'Guardar venta digital' }).click()
  await expect(page.getByText(/Guardada · Digital \$\s125\.000/)).toBeVisible()
  await expect(page.getByLabel('Importe: $ 0')).toBeVisible()
  await expect(efectivo).toBeDisabled()
})
