/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS browser check. */
const { chromium } = require(process.env.MAPU_PLAYWRIGHT_PATH || 'playwright')
const assert = require('node:assert/strict')

async function check() {
  const base = process.env.MAPU_TEST_URL || 'http://127.0.0.1:3003'
  assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local checks only')
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    page.setDefaultNavigationTimeout(90000)
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}/intereses?origen=perfil#preferencias`, {
      waitUntil: 'domcontentloaded',
    })
    await page.getByRole('heading', { name: 'Encuentra lo que va contigo' }).waitFor()
    await page.getByRole('button', { name: 'Pausar redirección' }).click()
    const loginUrl = await page
      .getByRole('link', { name: 'Iniciar sesión', exact: true })
      .getAttribute('href')
    assert.equal(loginUrl, '/login?next=%2Fintereses%3Forigen%3Dperfil%23preferencias')
    await page.clock.install()
    await page.clock.runFor(6000)
    assert.equal(new URL(page.url()).pathname, '/intereses', 'Pause prevents redirect')
    assert(await page.getByText('Redirección pausada.', { exact: false }).isVisible())
    await page.getByRole('button', { name: 'Reanudar redirección' }).click()
    await page.clock.runFor(4000)
    assert.equal(new URL(page.url()).pathname, '/intereses', 'Do not redirect early')
    await page.clock.runFor(1250)
    await page.waitForURL((url) => url.pathname === '/login', { timeout: 30000 })
    assert.equal(
      new URL(page.url()).searchParams.get('next'),
      '/intereses?origen=perfil#preferencias'
    )
    await page.clock.resume()

    await page.locator('input[type=email]').fill(process.env.MAPU_TEST_EMAIL || 'prueba2@mapu.test')
    await page.locator('input[type=password]').fill(process.env.MAPU_TEST_PASSWORD || '123qweasd')
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click()
    await page.waitForURL((url) => url.pathname === '/intereses')
    await page.getByRole('heading', { name: 'Mis intereses', exact: true }).waitFor()
    assert.equal(new URL(page.url()).hash, '#preferencias')
    await page.clock.runFor(6000)
    assert.equal(
      new URL(page.url()).pathname,
      '/intereses',
      'Authenticated users are not redirected'
    )
    await page.getByRole('button', { name: 'Menú de usuario', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Cerrar sesión', exact: true }).click()
    await page.waitForURL((url) => url.pathname === '/login')

    await page.goto(`${base}/para-ti`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Tus próximas coincidencias te esperan' }).waitFor()
    await page.getByRole('button', { name: 'Pausar redirección' }).click()
    await page.setViewportSize({ width: 320, height: 568 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.getByRole('link', { name: 'Iniciar sesión', exact: true }).click()
    await page.waitForURL((url) => url.pathname === '/login')
    assert.equal(new URL(page.url()).searchParams.get('next'), '/para-ti')

    await page.goto(`${base}/intereses`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'Encuentra lo que va contigo' }).waitFor()
    await page.getByRole('link', { name: 'Buscar', exact: true }).first().click()
    await page.waitForURL((url) => url.pathname === '/buscar')
    await page.clock.runFor(6000)
    assert.equal(new URL(page.url()).pathname, '/buscar', 'Navigation cancels the timer')
    assert.deepEqual(errors, [])
    console.log(
      'PASS: 5-second redirect, pause/resume, return URL, immediate login, small mobile layout and timer cleanup.'
    )
  } finally {
    await browser.close()
  }
}

check().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
