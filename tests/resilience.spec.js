import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const room = page => page.getByRole('region', { name: 'Interactive poster gallery' });

test('other artwork has a full-size preview without an invented original link', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const artwork = page.locator('.gallery--other .operation-node').first();
    await artwork.getByRole('button', { name: 'Preview other design work, plate 01' }).click();
    const preview = page.getByRole('dialog', { name: 'Artwork preview' });
    await expect(preview).toBeVisible();
    await expect(preview.locator('.lightbox-image')).toHaveAttribute('src', 'Assets/Other/2.webp');
    await expect(preview.locator('.lightbox-index')).toHaveText('01 / 06');
    await expect(preview.getByRole('link', { name: 'Open original' })).toHaveCount(0);
    await page.keyboard.press('ArrowRight');
    await expect(preview.locator('.lightbox-image')).toHaveAttribute('src', 'Assets/Other/3.webp');
    await page.keyboard.press('Escape');
    await expect(artwork.getByRole('button')).toBeFocused();
});

test('reduced motion skips Three.js downloads and keeps all portfolio content', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await page.goto('/');
    await expect(room(page).getByRole('button', { name: 'Use 3D view' })).toBeVisible();
    await expect(room(page)).toHaveAttribute('data-renderer', 'static');
    await expect(page.locator('.gallery--posters li')).toHaveCount(8);
    await expect(page.locator('.gallery--other li')).toHaveCount(6);
    expect(requests.filter(url => /gallery-scene|vendor\/three/.test(url))).toEqual([]);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('WebGL unavailable leaves a working fallback and full-size preview', async ({ page }) => {
    await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (kind, ...options) {
            return /webgl/.test(kind) ? null : original.call(this, kind, ...options);
        };
    });
    await page.goto('/');
    await expect(room(page).locator('.stage-mode')).toHaveText('Simple view · 3D unavailable');
    await expect(room(page).locator('canvas')).toHaveCount(0);
    await room(page).getByRole('button', { name: 'Next poster', exact: true }).click();
    await expect(room(page).locator('.fallback-main')).toHaveAttribute('src', 'Assets/Preview/poster2.webp');
    await room(page).getByRole('button', { name: 'View selected poster' }).click();
    await expect(page.getByRole('dialog', { name: 'Artwork preview' })).toBeVisible();
});

test('failed Three.js download never hides the fallback or disables navigation', async ({ page }) => {
    await page.route('**/vendor/three/**', route => route.abort('failed'));
    await page.goto('/');
    await expect(room(page).locator('.stage-mode')).toHaveText('Simple view · 3D unavailable');
    await expect(room(page).locator('.stage-fallback')).toBeVisible();
    await room(page).getByRole('button', { name: 'Next poster', exact: true }).click();
    await expect(room(page).locator('.stage-count')).toHaveText('02 / 08');
});

test('no-JavaScript keeps navigation, artwork links, and readable content', async ({ browser }, testInfo) => {
    const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: testInfo.project.name === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 1000 }
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).not.toBeVisible();
    await expect(page.locator('.gallery--posters a')).toHaveCount(8);
    await expect(page.locator('.stage-poster')).toHaveAttribute('href', 'https://www.instagram.com/p/DIATJgmTR5A/');
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Posters' }).click();
    await expect(page).toHaveURL(/#works$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
});

test('mobile navigation contains focus and closes after choosing a destination', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.click();
    const menu = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(menu).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    for (let index = 0; index < 8; index++) {
        await page.keyboard.press('Tab');
        expect(await menu.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await menu.getByRole('link', { name: '02 Posters' }).click();
    await expect(menu).not.toBeVisible();
    await expect(page).toHaveURL(/#works$/);
    await expect(page.locator('body')).not.toHaveClass(/nav-locked/);
});

test('page and artwork dialog pass the automated WCAG AA checks', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(room(page).getByRole('button', { name: 'View selected poster' })).toBeVisible();
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(result.violations).toEqual([]);
    await room(page).getByRole('button', { name: 'View selected poster' }).click();
    const dialogResult = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(dialogResult.violations).toEqual([]);
});

test('responsive layouts have no horizontal overflow or clipped controls', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    for (const width of [320, 390, 640, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        const layout = await page.evaluate(() => {
            const controls = [...document.querySelectorAll('.stage-controls button, .stage-settings button')]
                .filter(element => element.getClientRects().length)
                .map(element => ({ label: element.textContent, rect: element.getBoundingClientRect().toJSON() }));
            return { width: innerWidth, documentWidth: document.documentElement.scrollWidth, controls };
        });
        expect(layout.documentWidth, `overflow at ${width}`).toBeLessThanOrEqual(width);
        for (const control of layout.controls) {
            expect(control.rect.left, `${control.label} at ${width}`).toBeGreaterThanOrEqual(0);
            expect(control.rect.right, `${control.label} at ${width}`).toBeLessThanOrEqual(width);
            expect(control.rect.height).toBeGreaterThanOrEqual(44);
        }
    }
});

test('mobile biography, contact text, and gallery actions stay comfortably legible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const typography = await page.evaluate(() => ({
        reading: [...document.querySelectorAll('.ed-desc, .terminal-link, .affil-item')]
            .map(element => parseFloat(getComputedStyle(element).fontSize)),
        actions: [...document.querySelectorAll('.stage-open, .copy-email')]
            .map(element => parseFloat(getComputedStyle(element).fontSize))
    }));
    for (const size of typography.reading) expect(size).toBeGreaterThanOrEqual(14);
    for (const size of typography.actions) expect(size).toBeGreaterThanOrEqual(12);
});
