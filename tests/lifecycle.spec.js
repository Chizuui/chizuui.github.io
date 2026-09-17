import { test, expect } from '@playwright/test';

// Instrument actual GL draw calls instead of trusting application status labels.
async function countDrawCalls(page) {
    await page.addInitScript(() => {
        window.__galleryDraws = 0;
        const original = WebGL2RenderingContext.prototype.drawElements;
        WebGL2RenderingContext.prototype.drawElements = function (...args) {
            window.__galleryDraws++;
            return original.apply(this, args);
        };
    });
}

async function expectIdle(page) {
    await page.waitForTimeout(250);
    const before = await page.evaluate(() => window.__galleryDraws);
    await page.waitForTimeout(250);
    const after = await page.evaluate(() => window.__galleryDraws);
    expect(after).toBe(before);
}

test('GPU drawing stops while paused, off-screen, or behind the artwork dialog', async ({ page }) => {
    await countDrawCalls(page);
    await page.goto('/');
    const room = page.locator('.gallery-room');
    await expect(room).toHaveAttribute('data-renderer', 'webgl', { timeout: 20_000 });
    expect(await page.evaluate(() => window.__galleryDraws)).toBeGreaterThan(0);
    await room.getByRole('button', { name: 'Pause motion', exact: true }).click();
    await expectIdle(page);
    await room.getByRole('button', { name: 'Resume motion', exact: true }).click();
    const resumedAt = await page.evaluate(() => window.__galleryDraws);
    await expect.poll(() => page.evaluate(() => window.__galleryDraws)).toBeGreaterThan(resumedAt);
    await room.getByRole('button', { name: 'View selected poster' }).click();
    await expectIdle(page);
    await page.keyboard.press('Escape');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expectIdle(page);
});

test('lost WebGL context returns to the same poster in simple view', async ({ page }) => {
    await page.goto('/');
    const room = page.locator('.gallery-room');
    await expect(room).toHaveAttribute('data-renderer', 'webgl', { timeout: 20_000 });
    await room.getByRole('button', { name: 'Next poster', exact: true }).click();
    await room.locator('canvas').evaluate(element => {
        element.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
    });
    await expect(room).toHaveAttribute('data-renderer', 'static');
    await expect(room.locator('canvas')).toHaveCount(0);
    await expect(room.locator('.fallback-main')).toHaveAttribute('src', 'Assets/Preview/poster2.webp');
    await room.getByRole('button', { name: 'Next poster', exact: true }).click();
    await expect(room.locator('.stage-count')).toHaveText('03 / 08');
});

test('a changed reduced-motion preference cancels pending 3D initialization', async ({ page }) => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route('**/gallery-scene.js*', async route => { await gate; await route.continue(); });
    await page.goto('/');
    const room = page.locator('.gallery-room');
    await expect(room.getByRole('button', { name: 'Preparing 3D…' })).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    release();
    await expect(room.locator('.stage-mode')).toHaveText('Reduced motion');
    await expect(room.getByRole('button', { name: 'Use 3D view' })).toBeEnabled();
    await expect(room.locator('canvas')).toHaveCount(0);
    await room.getByRole('button', { name: 'Next poster', exact: true }).click();
    await expect(room.locator('.stage-count')).toHaveText('02 / 08');
});

test('touch swipe changes the poster and vertical scrolling is not captured', async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Touch emulation uses the mobile project.');
    await page.goto('/');
    const room = page.locator('.gallery-room');
    await expect(room).toHaveAttribute('data-renderer', 'webgl', { timeout: 20_000 });
    const canvas = room.locator('canvas');
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    const session = await context.newCDPSession(page);
    const y = Math.round(box.y + box.height / 2);
    const x = Math.round(box.x + box.width * 0.75);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 10; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - step * 18, y }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(room.locator('.stage-count')).not.toHaveText('01 / 08');
    await expect(page.getByRole('dialog', { name: 'Artwork preview' })).not.toBeVisible();
    const selected = await room.locator('.stage-count').textContent();
    const scrollBefore = await page.evaluate(() => scrollY);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y }] });
    for (let step = 1; step <= 8; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: y - step * 16 }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scrollBefore);
    await expect(room.locator('.stage-count')).toHaveText(selected);
});
