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

  // 1. Landing page - check "Seven tools", no "Creator discovery"
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '1-landing-hero.png'), fullPage: false });
  
  // scroll to features section
  await page.evaluate(() => window.scrollBy(0, 2000));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '2-landing-features.png'), fullPage: false });

  // check text
  const sevenTools = await page.locator('text=Seven tools').count();
  const eightTools = await page.locator('text=Eight tools').count();
  const creatorDiscovery = await page.locator('text=Creator discovery').count();
  console.log('Seven tools heading:', sevenTools, '| Eight tools (should be 0):', eightTools, '| Creator discovery (should be 0):', creatorDiscovery);

  // 2. Demo brand page
  await page.goto(BASE + '/demo/brand', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '3-demo-brand.png'), fullPage: false });
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '4-demo-brand-scroll.png'), fullPage: false });

  // check for "Discover" in nav  
  const discoverLink = await page.locator('text=Discover').count();
  const contactsLink = await page.locator('text=Contacts').count();
  console.log('Discover in nav (should be 0):', discoverLink, '| Contacts in nav:', contactsLink);

  // 3. Demo creator page
  await page.goto(BASE + '/demo/creator', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '5-demo-creator.png'), fullPage: false });

  // 4. for-creators page
  await page.goto(BASE + '/for-creators', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, '6-for-creators.png'), fullPage: false });
  const brandsDirect = await page.locator('text=posted directly by brands').count();
  console.log('Old "posted directly by brands" copy (should be 0):', brandsDirect);

  await browser.close();
  console.log('DONE - screenshots at', OUT);
})().catch(e => { console.error(e.message); process.exit(1); });
