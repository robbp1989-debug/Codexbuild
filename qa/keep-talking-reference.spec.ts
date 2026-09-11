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

test('Keep Talking matches approved 1672x941 composition envelope', async ({ page }) => {
  await page.setViewportSize({ width: 1672, height: 941 });
  await page.goto(LOCAL, { waitUntil: 'networkidle' });
  await moveToArrival(page);

  const reflection = page.locator('#reflection-workspace textarea');
  await reflection.fill('A friend did not reply right away and I noticed my mind predicting that I had done something wrong.');
  await page.getByRole('button', { name: /Explore my situation/i }).click();

  await expect(page.getByRole('heading', { name: /Stay with this before solving it/i })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('Perspective shift', { exact: false }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep Talking', exact: true })).toHaveAttribute('aria-current', 'page');

  const backgroundVideo = page.locator('video.workspace-office__background-video');
  await expect(backgroundVideo).toBeVisible({ timeout: 10_000 });
  await expect.poll(async () => backgroundVideo.evaluate((node) => {
    const video = node as HTMLVideoElement;
    return Number.isFinite(video.duration) && video.duration > 9 && video.readyState >= 2;
  }), { timeout: 15_000 }).toBe(true);

  await page.waitForTimeout(500);

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const node = document.querySelector<HTMLElement>(selector);
      if (!node) throw new Error(`Missing ${selector}`);
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    return {
      perspective: rect('.keep-talking-perspective'),
      header: rect('.workspace-header'),
      outer: rect('.workspace-office__surface'),
      dialogue: rect('.keep-talking-dialogue'),
    };
  });

  // Broad guardrails taken from the approved Office perfect reference. These
  // deliberately protect composition without turning responsive CSS into a
  // brittle single-pixel test.
  expect(geometry.perspective.x).toBeGreaterThanOrEqual(50);
  expect(geometry.perspective.x).toBeLessThanOrEqual(80);
  expect(geometry.perspective.y).toBeLessThanOrEqual(32);
  expect(geometry.perspective.width).toBeGreaterThanOrEqual(350);
  expect(geometry.perspective.width).toBeLessThanOrEqual(400);
  expect(geometry.header.x).toBeGreaterThanOrEqual(500);
  expect(geometry.header.x).toBeLessThanOrEqual(550);
  expect(geometry.outer.right).toBeLessThanOrEqual(1580);
  expect(geometry.dialogue.x).toBeGreaterThanOrEqual(580);
  expect(geometry.dialogue.right).toBeLessThanOrEqual(1535);
  expect(geometry.dialogue.bottom).toBeGreaterThanOrEqual(820);

  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/21-keep-talking-reference-size.png`, fullPage: false });
});
