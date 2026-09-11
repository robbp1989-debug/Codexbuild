import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

const OUT = 'qa-artifacts';
const LOCAL = 'http://localhost:3000';

test.use({ channel: 'chrome' });

async function moveToArrival(page: Page) {
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('.cinematic-scroll, .cinematic');
    if (!root) return;
    const top = window.scrollY + root.getBoundingClientRect().top;
    const max = Math.max(1, root.offsetHeight - window.innerHeight);
    window.scrollTo(0, top + max);
  });
  await page.waitForTimeout(1100);
}

test('sample real cinematic frames for Keep Talking background selection', async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto(LOCAL, { waitUntil: 'networkidle' });
  await moveToArrival(page);
  await page.locator('#reflection-workspace textarea').fill('I noticed myself predicting what another person meant before I knew the facts.');
  await page.getByRole('button', { name: /Explore my situation/i }).click();
  await expect(page.getByRole('heading', { name: /Stay with this before solving it/i })).toBeVisible({ timeout: 20_000 });

  const video = page.locator('video.workspace-office__background-video');
  await expect(video).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => video.evaluate((node) => {
    const el = node as HTMLVideoElement;
    return Number.isFinite(el.duration) && el.duration > 9 && el.readyState >= 2;
  }), { timeout: 15_000 }).toBe(true);

  await page.addStyleTag({ content: `
    .workspace-office__app { visibility: hidden !important; }
    .workspace-office--conversation .workspace-office__background-video {
      inset: 0 !important;
      width: 100vw !important;
      min-width: 0 !important;
      max-width: none !important;
      height: 100vh !important;
      transform: none !important;
      object-fit: cover !important;
      object-position: center center !important;
      filter: none !important;
    }
    .workspace-office--conversation .workspace-office__veil { display: none !important; }
  ` });

  fs.mkdirSync(OUT, { recursive: true });
  for (const fraction of [0.70, 0.76, 0.82, 0.88, 0.94, 0.985]) {
    await video.evaluate(async (node, targetFraction) => {
      const el = node as HTMLVideoElement;
      const target = Math.max(0, Math.min(el.duration - 0.02, el.duration * targetFraction));
      if (Math.abs(el.currentTime - target) < 0.01) return;
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        el.addEventListener('seeked', done, { once: true });
        el.currentTime = target;
      });
      el.pause();
    }, fraction);
    await page.waitForTimeout(180);
    await page.screenshot({ path: `${OUT}/background-${Math.round(fraction * 1000)}.png`, fullPage: false });
  }
});
