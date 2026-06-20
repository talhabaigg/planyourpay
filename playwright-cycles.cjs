const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:9002/login');
  await page.fill('input[name="email"]', 'iamtalhabaig@gmail.com');
  await page.fill('input[name="password"]', 'test1234');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.goto('http://127.0.0.1:9002/pay-cycles');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'playwright-pay-cycles.png', fullPage: true });
  await browser.close();
})();
