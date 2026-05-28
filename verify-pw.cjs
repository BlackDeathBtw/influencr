const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'https://influencr-five.vercel.app';
const OUT = 'C:\\Users\\jakob\\NewPP\\influencr\\verify-screenshots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '1-landing-hero.png'), fullPage: false });
  await page.evaluate(() => window.scrollBy(0, 2000));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '2-landing-features.png'), fullPage: false });

  const sevenTools = await page.locator('text=Seven tools').count();
  const eightTools = await page.locator('text=Eight tools').count();
  const creatorDiscovery = await page.locator('text=Creator discovery').count();
  console.log('Seven tools:', sevenTools, '| Eight tools (should be 0):', eightTools, '| Creator discovery (should be 0):', creatorDiscovery);

  await page.goto(BASE + '/demo/brand', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '3-demo-brand.png'), fullPage: false });
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '4-demo-brand-sidebar.png'), fullPage: false });

  const discoverLink = await page.locator('a[href="/discover"]').count();
  const contactsLink = await page.locator('text=Contacts').count();
  console.log('Discover nav link (should be 0):', discoverLink, '| Contacts label:', contactsLink);

  await page.goto(BASE + '/demo/creator', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '5-demo-creator.png'), fullPage: false });
  const marketplaceCreator = await page.locator('text=Marketplace').count();
  console.log('Marketplace in creator nav:', marketplaceCreator);

  await page.goto(BASE + '/for-creators', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '6-for-creators.png'), fullPage: false });
  const brandsDirect = await page.locator('text=posted directly by brands').count();
  console.log('Old copy "posted directly by brands" (should be 0):', brandsDirect);

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e.message); process.exit(1); });
