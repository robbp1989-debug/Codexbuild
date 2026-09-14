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

test('Keep Talking matches desktop 1672x941 painting composition', async ({ page }) => {
  // Current acceptance scope is the desktop website only. Do not import phone
  // or tablet constraints into this visual contract.
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
  await expect.poll(async () => backgroundVideo.evaluate((node) => {
    const video = node as HTMLVideoElement;
    return video.duration > 0 ? video.currentTime / video.duration : 0;
  }), { timeout: 10_000 }).toBeGreaterThan(0.95);

  await page.waitForTimeout(500);

  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const node = document.querySelector<HTMLElement>(selector);
      if (!node) throw new Error(`Missing ${selector}`);
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const perspective = document.querySelector<HTMLElement>('.keep-talking-perspective');
    if (!perspective) throw new Error('Missing .keep-talking-perspective');
    return {
      perspective: rect('.keep-talking-perspective'),
      header: rect('.workspace-header'),
      outer: rect('.workspace-office__surface'),
      dialogue: rect('.keep-talking-dialogue'),
      background: rect('.workspace-office__background-video'),
      perspectiveBoxSizing: getComputedStyle(perspective).boxSizing,
    };
  });

  console.log('KEEP_TALKING_DESKTOP_REFERENCE_GEOMETRY', JSON.stringify(geometry));
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/21-keep-talking-desktop-reference.png`, fullPage: false });

  // Desktop painting/card relationship. The visual transform makes the final
  // bounding box slightly left of its untransformed 80px anchor.
  expect(geometry.perspectiveBoxSizing).toBe('border-box');
  expect(geometry.perspective.x).toBeGreaterThanOrEqual(55);
  expect(geometry.perspective.x).toBeLessThanOrEqual(82);
  expect(geometry.perspective.width).toBeGreaterThanOrEqual(350);
  expect(geometry.perspective.width).toBeLessThanOrEqual(400);
  expect(geometry.perspective.right).toBeLessThanOrEqual(450);

  // The held office frame must occupy the desktop viewport itself. A negative
  // inset or 130vw enlargement would move the painting out from under the card.
  expect(geometry.background.x).toBeGreaterThanOrEqual(-2);
  expect(geometry.background.x).toBeLessThanOrEqual(2);
  expect(geometry.background.width).toBeGreaterThanOrEqual(1668);
  expect(geometry.background.width).toBeLessThanOrEqual(1676);

  expect(geometry.header.x).toBeGreaterThanOrEqual(510);
  expect(geometry.header.x).toBeLessThanOrEqual(545);
  expect(geometry.outer.right).toBeGreaterThanOrEqual(1510);
  expect(geometry.outer.right).toBeLessThanOrEqual(1580);
  expect(geometry.dialogue.x).toBeGreaterThanOrEqual(580);
  expect(geometry.dialogue.right).toBeLessThanOrEqual(1535);
  expect(geometry.dialogue.bottom).toBeGreaterThanOrEqual(800);
});
