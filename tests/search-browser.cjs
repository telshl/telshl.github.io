// Run after hugo and starting a local HTTP server. Requires Playwright + Chromium.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SEARCH_BASE || 'http://127.0.0.1:8765';
const screenshots = process.env.SEARCH_SCREENSHOTS;
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Existing Google Fonts are not part of search and may be unavailable in CI.
  await context.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto(base + '/');
  await page.locator('.site-search-link').click();
  await page.waitForURL('**/search/');
  assert.equal(await page.locator('html').getAttribute('lang'), 'zh-TW');
  assert.equal(await page.locator('#search-results li').count(), 0);
  async function query(value) {
    await page.locator('#search-query').fill(value);
    await page.locator('.search-submit').click();
    await page.waitForFunction(() => /找到|找不到/.test(document.querySelector('#search-status').textContent));
  }
  await query('當客家遇見吐瓦魯');
  assert.equal(await page.locator('#search-results li').count(), 1);
  assert.match(await page.locator('#search-results h2').innerText(), /文化保存/);
  assert.ok(await page.locator('#search-results mark').count() > 0);
  const resultLink = await page.locator('#search-results h2 a').getAttribute('href');
  await page.locator('#search-results h2 a').click();
  await page.waitForURL(resultLink);
  await page.goBack();
  await page.waitForSelector('#search-results li');
  assert.equal(await page.locator('#search-query').inputValue(), '當客家遇見吐瓦魯');
  await query('公共媒體');
  assert.equal(await page.locator('#search-results li').count(), 20);
  await page.locator('#search-more').click();
  assert.equal(await page.locator('#search-results li').count(), 40);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelectorAll('#search-results h2 a')[20]), true);
  await query('文化研究');
  await page.locator('#search-category').selectOption('代表著作');
  await page.waitForFunction(() => document.querySelectorAll('#search-results li').length < 20);
  assert.ok(await page.locator('#search-results li').count() > 0);
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('#search-category').value === '');
  await page.waitForSelector('#search-results li');
  await page.locator('#search-clear').click();
  assert.equal(await page.locator('#search-query').inputValue(), '');
  assert.equal(await page.locator('#search-results li').count(), 0);
  assert.equal(new URL(page.url()).search, '');
  await page.locator('[data-query="AI"]').click();
  await page.waitForSelector('#search-results li');
  assert.equal(await page.locator('#search-query').inputValue(), 'AI');
  await query('zzz沒有這個關鍵詞zzz');
  assert.equal(await page.locator('#search-results li').count(), 0);
  assert.match(await page.locator('#search-status').innerText(), /找不到/);
  await query('<img src=x onerror=alert(1)>');
  assert.equal(await page.locator('#search-results img').count(), 0);
  await page.goto(base + '/search/?q=信任度&type=' + encodeURIComponent('媒體訪談'));
  await page.waitForSelector('#search-results li');
  assert.equal(await page.locator('#search-results li').count(), 1);
  assert.match(await page.locator('#search-results h2').innerText(), /媒體與訪談/);

  // Loading failure is retryable, and only search fetches the index.
  await page.route('**/search/index.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.goto(base + '/search/?q=媒體');
  await page.waitForSelector('#search-retry:not([hidden])');
  assert.match(await page.locator('#search-status').innerText(), /無法載入/);
  await page.unroute('**/search/index.json');
  await page.locator('#search-retry').click();
  await page.waitForSelector('#search-results li');
  assert.equal(await page.locator('#search-retry').isHidden(), true);

  // A pending response cannot overwrite newer input, clear, or browser history.
  let release;
  await page.route('**/search/index.json', async route => { await new Promise(resolve => { release = resolve; }); await route.continue(); });
  await page.goto(base + '/search/?q=公共媒體');
  await page.waitForFunction(() => document.querySelector('.search-results-section').getAttribute('aria-busy') === 'true');
  await page.locator('#search-clear').click();
  release();
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#search-results li').count(), 0);
  assert.match(await page.locator('#search-status').innerText(), /輸入關鍵字/);
  await page.unroute('**/search/index.json');
  await query('文化研究');

  // IME composition does not trigger partial searches.
  await page.locator('#search-query').evaluate(input => {
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '平台治理';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  });
  await page.waitForTimeout(250);
  assert.equal(new URL(page.url()).searchParams.get('q'), '文化研究');
  await page.locator('#search-query').dispatchEvent('compositionend');
  await page.waitForFunction(() => new URL(location.href).searchParams.get('q') === '平台治理');
  await page.waitForSelector('#search-results li');

  // Desktop, breakpoint, narrow mobile and mobile menu navigation.
  if (screenshots) fs.mkdirSync(screenshots, { recursive: true });
  for (const width of [1440, 1180, 1024, 861, 800, 769, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const overflows = await page.evaluate(() => {
      const width = document.documentElement.clientWidth;
      return { page: document.documentElement.scrollWidth > width, header: [...document.querySelectorAll('.header-inner > *')].filter(x => getComputedStyle(x).display !== 'none').some(x => x.getBoundingClientRect().right > width) };
    });
    assert.deepEqual(overflows, { page: false, header: false }, 'overflow at ' + width);
    assert.equal(await page.locator('.site-search-link').isVisible(), true);
    if (screenshots && [1440, 390].includes(width)) await page.screenshot({ path: screenshots + '/search-' + width + '.png', fullPage: false });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#nav-toggle').click();
  assert.equal(await page.locator('#nav-toggle').getAttribute('aria-expanded'), 'true');
  await page.locator('#site-nav a[href="/books/"]').click();
  await page.waitForURL('**/books/');
  await page.locator('.site-search-link').click();
  await page.waitForURL('**/search/');
  assert.equal(await page.locator('#nav-toggle').getAttribute('aria-expanded'), 'false');
  assert.deepEqual(errors, []);
  const noJS = await browser.newContext({ javaScriptEnabled: false });
  const fallback = await noJS.newPage();
  await fallback.goto(base + '/search/');
  assert.match(await fallback.locator('noscript').innerText(), /請啟用 JavaScript/);
  console.log('PASS: browser search, ranking/pagination, navigation/history, clear, filters, deep links, XSS input, retry, stale responses, IME, 9 responsive sizes, mobile menu, no-JS fallback, no JS errors');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
