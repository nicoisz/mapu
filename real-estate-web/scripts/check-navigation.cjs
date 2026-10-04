// Run against a local server with the existing normal test account.
// MAPU_PLAYWRIGHT_PATH may point to the bundled Playwright runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS browser check with an optional bundled runtime.
const { chromium } = require(process.env.MAPU_PLAYWRIGHT_PATH || 'playwright')
// eslint-disable-next-line @typescript-eslint/no-require-imports -- This script runs directly in Node.
const assert = require('node:assert/strict')

async function check() {
  const base = process.env.MAPU_TEST_URL || 'http://127.0.0.1:3003'
  assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local checks only')
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: 'dark',
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}/login?next=/perfil`)
    assert.equal(await page.locator('html').getAttribute('class'), null, 'Light by default')
    await page.locator('input[type=email]').fill(process.env.MAPU_TEST_EMAIL || 'prueba2@mapu.test')
    await page.locator('input[type=password]').fill(process.env.MAPU_TEST_PASSWORD || '123qweasd')
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
    await page.waitForURL('**/perfil', { timeout: 90000 })
    const menu = page.getByRole('dialog', { name: 'Menú principal' })
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
    await menu.waitFor()
    assert.equal((await menu.boundingBox()).y, 0)
    assert.equal(await menu.getByRole('link', { name: 'Explorar', exact: true }).count(), 0)
    assert.equal(await menu.getByRole('link', { name: 'Métricas', exact: true }).count(), 0)
    await menu.getByRole('button', { name: 'Modo oscuro' }).click()
    await page.waitForFunction(() => document.documentElement.classList.contains('dark'))
    await page.keyboard.press('Escape')
    await menu.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
    await menu.getByRole('button', { name: 'Cerrar menú', exact: true }).click()
    await menu.waitFor({ state: 'hidden' })
    const bottom = page.locator('[data-top-navbar] > div').last()
    assert.deepEqual(await bottom.locator('a').allTextContents(), [
      'Buscar',
      'Favoritos',
      'Publicar',
      'Panel',
    ])
    assert.equal(await page.locator('#metricas').count(), 1)
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.getByRole('button', { name: 'Colapsar menú', exact: true }).click()
    await page.waitForFunction(
      () => document.querySelector('[data-top-navbar]').getBoundingClientRect().left === 72
    )
    await page.reload()
    await page.getByRole('button', { name: 'Expandir menú', exact: true }).waitFor()
    assert(await page.locator('html').evaluate((element) => element.classList.contains('dark')))
    await page.goto(`${base}/metricas`)
    await page.waitForURL('**/perfil#metricas')
    await page.getByRole('button', { name: 'Menú de usuario', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Cerrar sesión', exact: true }).click()
    await page.waitForURL('**/login')
    await page.reload()
    assert(
      await page.locator('html').evaluate((element) => element.classList.contains('dark')),
      'Preference survives logout'
    )
    assert.equal(await page.getByRole('button', { name: 'Modo claro' }).count(), 0)
    assert.deepEqual(errors, [])
    console.log(
      'PASS: mobile menu, bottom navigation, profile metrics, desktop collapse, light default and persistent theme.'
    )
  } finally {
    await browser.close()
  }
}

check().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
