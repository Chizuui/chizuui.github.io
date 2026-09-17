import { test, expect } from '@playwright/test';

const posterLinks = [
    'https://www.instagram.com/p/DIATJgmTR5A/',
    'https://www.instagram.com/p/DHA6sUEzA-r/',
    'https://www.instagram.com/p/DJMTrq9zUdq/',
    'https://www.instagram.com/p/DI8359JzzZO/',
    'https://www.instagram.com/p/DGPUvpWzdsJ/',
    'https://www.instagram.com/p/DF9FMJyT4Ua/',
    'https://www.instagram.com/p/DGznEsGxW2n/',
    'https://www.facebook.com/share/p/19CBXvKZwx/'
];

test('all original artworks and destinations are preserved and local assets resolve', async ({ page, request }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const links = await page.locator('.gallery--posters a').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
    expect(links).toEqual(posterLinks);
    expect(await page.locator('.gallery--posters img').evaluateAll(images => images.map(image => image.getAttribute('src'))))
        .toEqual(Array.from({ length: 8 }, (_, index) => `Assets/Poster/poster${index + 1}.webp`));
    expect(await page.locator('.gallery--other img').evaluateAll(images => images.map(image => image.getAttribute('src'))))
        .toEqual(Array.from({ length: 6 }, (_, index) => `Assets/Other/${index + 2}.webp`));
    const local = await page.evaluate(() => [...new Set([
        ...[...document.querySelectorAll('[src]')].map(element => element.getAttribute('src')),
        ...[...document.querySelectorAll('[data-preview]')].map(element => element.dataset.preview),
        ...[...document.querySelectorAll('link[href]')].map(element => element.getAttribute('href')),
        'gallery.js', 'gallery-scene.js', 'vendor/three/three.module.js', 'vendor/three/LICENSE'
    ].filter(value => value && !/^(https?:|data:|#)/.test(value)))]);
    for (const path of local) {
        const response = await request.get(`/${path}`);
        expect(response.status(), path).toBe(200);
        if (/\.js(?:\?|$)/.test(path)) expect(response.headers()['content-type']).toMatch(/javascript/);
    }
    expect(await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
        .map(link => link.getAttribute('href').slice(1)).filter(id => !document.getElementById(id)))).toEqual([]);
});

test('email copy writes the existing address and reports clipboard failure honestly', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Copy email' }).click();
    await expect(page.locator('.copy-feedback')).toHaveText('Email copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('keju@chizui.dev');
    await page.evaluate(() => {
        Object.defineProperty(navigator.clipboard, 'writeText', {
            value: async () => { throw new DOMException('Permission denied', 'NotAllowedError'); }
        });
    });
    await page.getByRole('button', { name: 'Copy email' }).click();
    await expect(page.locator('.copy-feedback')).toHaveText('Copy failed — select the email above');
    await expect(page.locator('a.terminal-link[href="mailto:keju@chizui.dev"]')).toBeVisible();
});

test('poster links retain modified-click behavior and the dialog wraps focus', async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await context.route('https://www.instagram.com/**', route => route.fulfill({ body: 'External destination test' }));
    const link = page.locator('.gallery--posters a').first();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener/);
    await link.click();
    await expect(page.getByRole('dialog', { name: 'Artwork preview' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Artwork preview' })).not.toBeVisible();
    await link.click();
    const dialog = page.getByRole('dialog', { name: 'Artwork preview' });
    for (let index = 0; index < 8; index++) {
        await page.keyboard.press('Tab');
        expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
    }
    await dialog.getByRole('button', { name: 'Close preview' }).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: 'Next poster' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(link).toBeFocused();
});
