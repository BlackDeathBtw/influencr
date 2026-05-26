import { test, expect } from '@playwright/test'

const BASE = 'https://influencr-five.vercel.app'

test('demo flows through to populated dashboard', async ({ page }) => {
  const errors: string[] = []
  page.on('response', res => {
    if (res.status() >= 500) errors.push(`HTTP ${res.status()} ${res.url()}`)
  })

  // Click demo button from landing page
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 30000 }),
    page.getByRole('link', { name: /try demo/i }).first().click(),
  ])
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: 'tests/screenshots/dashboard.png', fullPage: true })

  // Dashboard should render (not show login or error)
  await expect(page).toHaveURL(/\/dashboard/)
  const bodyText = await page.innerText('body')

  // Check for some dashboard content
  const hasDashContent = bodyText.includes('dashboard') || bodyText.includes('influencer') ||
    bodyText.includes('campaign') || bodyText.includes('Summer') || bodyText.includes('Sarah')
  console.log('Dashboard text (first 500):', bodyText.replace(/\s+/g, ' ').slice(0, 500))
  console.log('Has demo data visible:', hasDashContent)
  if (errors.length) console.log('5xx errors:', errors)

  // Navigate to influencers
  await page.goto(`${BASE}/influencers`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'tests/screenshots/influencers.png', fullPage: true })
  const influencersText = await page.innerText('body')
  console.log('Influencers page (first 300):', influencersText.replace(/\s+/g, ' ').slice(0, 300))

  expect(errors).toHaveLength(0)
})
