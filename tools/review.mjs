import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Playwright clears test-results before each suite; keep visual evidence separate.
const output = new URL('../qa-output/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const evidence = [];
for (const [name, options] of [
    ['desktop', { viewport: { width: 1440, height: 1100 } }],
    ['mobile', { ...devices['iPhone 13'], defaultBrowserType: 'chromium' }]
]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:4173/');
    await page.waitForFunction(() => document.querySelector('.gallery-room').dataset.renderer === 'webgl');
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(`${name}-home.png`, output)) });
    const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        renderer: document.querySelector('.gallery-room').dataset.renderer,
        heading: document.querySelector('h1').getBoundingClientRect().toJSON(),
        canvas: document.querySelector('canvas').getBoundingClientRect().toJSON(),
        posters: document.querySelectorAll('.gallery--posters li').length,
        other: document.querySelectorAll('.gallery--other li').length
    }));
    await page.locator('#works').scrollIntoViewIfNeeded();
    await page.waitForTimeout(700);
    await page.screenshot({ path: fileURLToPath(new URL(`${name}-works.png`, output)) });
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: fileURLToPath(new URL(`${name}-contact.png`, output)) });
    evidence.push({ name, layout, errors });
    await context.close();
}
await writeFile(new URL('evidence.json', output), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify(evidence, null, 2));
await browser.close();
