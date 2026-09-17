import { test, expect } from '@playwright/test';

// The HTML gallery must work independently of the optional WebGL enhancement.
test('poster selection is usable with buttons, keys, and a full-size preview', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const room = page.getByRole('region', { name: 'Interactive poster gallery' });
    await expect(room).toBeVisible();
    await expect(room.locator('.stage-count')).toHaveText('01 / 08');
    await room.getByRole('button', { name: 'Next poster', exact: true }).click();
    await expect(room.locator('.stage-count')).toHaveText('02 / 08');
    await room.locator('.gallery-stage').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(room.locator('.stage-count')).toHaveText('01 / 08');
    await page.keyboard.press('ArrowLeft');
    await expect(room.locator('.stage-count')).toHaveText('08 / 08');
    await room.getByRole('button', { name: 'View selected poster' }).click();
    const preview = page.getByRole('dialog', { name: 'Artwork preview' });
    await expect(preview).toBeVisible();
    await expect(preview.locator('.lightbox-image')).toHaveAttribute('src', /Assets\/Poster\/poster8\.webp$/);
    await expect(preview.getByRole('link', { name: 'Open original' })).toHaveAttribute('href', 'https://www.facebook.com/share/p/19CBXvKZwx/');
    await page.keyboard.press('Escape');
    await expect(preview).not.toBeVisible();
    await expect(room.getByRole('button', { name: 'View selected poster' })).toBeFocused();
});

test('the Three.js gallery renders real pixels and dragging changes the selected poster', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const room = page.getByRole('region', { name: 'Interactive poster gallery' });
    await expect(room).toHaveAttribute('data-renderer', 'webgl', { timeout: 20_000 });
    const canvas = room.locator('canvas');
    await expect(canvas).toBeVisible();
    // The non-preserved WebGL drawing buffer clears after compositing.
    // Read in the same animation frame as rendering, not in a later task.
    const render = await canvas.evaluate(element => new Promise(resolve => {
      let attempts = 0;
      function sample() {
        const gl = element.getContext('webgl2');
        const width = 64;
        const height = 64;
        const snapshot = document.createElement('canvas');
        snapshot.width = width;
        snapshot.height = height;
        const context = snapshot.getContext('2d');
        context.drawImage(element, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        let painted = 0;
        for (let index = 3; index < pixels.length; index += 4) {
            if (pixels[index] > 0) painted++;
        }
        if (painted > 100 || ++attempts >= 12) {
            resolve({ webgl2: Boolean(gl), painted, width: element.width, displayWidth: element.clientWidth });
        } else requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    }));
    expect(render.webgl2).toBe(true);
    expect(render.painted).toBeGreaterThan(100);
    expect(render.width).toBeLessThanOrEqual(render.displayWidth * 1.5);
    const stage = room.locator('.gallery-stage');
    await stage.scrollIntoViewIfNeeded();
    const box = await stage.boundingBox();
    await page.mouse.move(box.x + box.width * 0.65, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2, { steps: 15 });
    await page.mouse.up();
    await expect(room.locator('.stage-count')).not.toHaveText('01 / 08');
    await expect(page.getByRole('dialog', { name: 'Artwork preview' })).not.toBeVisible();
    await expect(room.locator('.stage-fallback')).toHaveAttribute('aria-hidden', 'true');
    expect(errors).toEqual([]);
});

test('motion can be paused and simple view keeps the selected poster', async ({ page }) => {
    await page.goto('/');
    const room = page.locator('.gallery-room');
    await expect(room).toHaveAttribute('data-renderer', 'webgl', { timeout: 20_000 });
    await room.getByRole('button', { name: 'Pause motion', exact: true }).click();
    await expect(room.getByRole('button', { name: 'Resume motion', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(room).toHaveAttribute('data-motion', 'paused');
    await room.getByRole('button', { name: 'Next poster', exact: true }).click();
    await expect(room.locator('.stage-count')).toHaveText('02 / 08');
    await room.getByRole('button', { name: 'Use simple view' }).click();
    await expect(room).toHaveAttribute('data-renderer', 'static');
    await expect(room.locator('canvas')).toHaveCount(0);
    await expect(room.locator('.fallback-main')).toHaveAttribute('src', 'Assets/Preview/poster2.webp');
    await room.getByRole('button', { name: 'Use 3D view' }).click();
    await expect(room).toHaveAttribute('data-renderer', 'webgl', { timeout: 20_000 });
    await expect(room.locator('.stage-count')).toHaveText('02 / 08');
    await expect(room).toHaveAttribute('data-motion', 'paused');
});
