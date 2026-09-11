import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const OUT = 'qa-artifacts';
const LOCAL = 'http://localhost:3000';
const GOLDEN_LOCAL = `${LOCAL}/qa/shift-live-scroll.html`;

async function shot(page: import('@playwright/test').Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

async function moveToArrival(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('.cinematic-scroll, .cinematic');
    if (!root) return;
    const top = window.scrollY + root.getBoundingClientRect().top;
    const max = Math.max(1, root.offsetHeight - window.innerHeight);
    window.scrollTo(0, top + max);
  });
  await page.waitForTimeout(1100);
}

async function expectVideoReady(page: import('@playwright/test').Page, selector: string) {
  await expect.poll(async () => page.locator(selector).evaluate((node) => {
    const video = node as HTMLVideoElement;
    return Number.isFinite(video.duration) && video.duration > 9 && video.readyState >= 1;
  }), { timeout: 15_000 }).toBe(true);
}

test.describe.configure({ mode: 'serial' });

test('capture golden reference and rebuilt SHIFT flow', async ({ page }) => {
  await page.setViewportSize({ width: 1750, height: 832 });

  const assetResponse = await page.request.get(`${LOCAL}/landing-sequence/shift-office-entry.mp4`);
  expect(assetResponse.ok()).toBeTruthy();
  expect(assetResponse.headers()['content-type'] || '').toContain('video');

  await page.goto(GOLDEN_LOCAL, { waitUntil: 'networkidle' });
  await expectVideoReady(page, '#movie');
  await shot(page, '00-golden-hero');
  await moveToArrival(page);
  await expect.poll(async () => page.locator('#movie').evaluate((node) => (node as HTMLVideoElement).currentTime), { timeout: 5000 }).toBeGreaterThan(9);
  await shot(page, '01-golden-arrival');

  await page.goto(LOCAL, { waitUntil: 'networkidle' });
  await expect(page.getByText('Mind over', { exact: false })).toBeVisible();
  await expectVideoReady(page, 'video.cinematic-video');
  await shot(page, '10-rebuild-hero');

  await moveToArrival(page);
  await expect.poll(async () => page.locator('video.cinematic-video').evaluate((node) => (node as HTMLVideoElement).currentTime), { timeout: 5000 }).toBeGreaterThan(9);
  await shot(page, '11-rebuild-arrival');
  await expect(page.getByText('Where would you like to begin?')).toBeVisible();
  await expect(page.locator('.arrival-nav').getByRole('button', { name: 'Life context' })).toBeVisible();
  await expect(page.locator('#life-context').getByText('Life context', { exact: true })).toBeVisible();
  await expect(page.getByText("What’s going on?", { exact: true })).toBeVisible();

  const reflection = page.locator('#reflection-workspace textarea');
  await reflection.fill('A friend did not reply right away and I noticed my mind predicting that I had done something wrong.');
  await page.getByRole('button', { name: /Explore my situation/i }).click();
  await expect(page.getByText('Your SHIFT breakdown')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(350);
  await shot(page, '20-breakdown');

  await page.getByRole('button', { name: /Keep talking/i }).first().click();
  await expect(page.getByRole('heading', { name: /Stay with this before solving it/i })).toBeVisible();
  await expect(page.getByText('Perspective shift', { exact: false }).first()).toBeVisible();
  await page.waitForTimeout(450);
  await shot(page, '30-keep-talking');

  await page.getByRole('button', { name: 'Prediction Lab' }).click();
  await page.waitForTimeout(400);
  await shot(page, '40-prediction-lab');

  await page.getByRole('button', { name: 'Memory' }).click();
  await page.waitForTimeout(400);
  await shot(page, '50-memory');

  await page.getByRole('link', { name: 'Privacy' }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '60-privacy');

  await page.goto(LOCAL, { waitUntil: 'networkidle' });
  await moveToArrival(page);
  const explore = page.locator('.arrival-nav').getByRole('button', { name: 'Explore Shift' });
  await expect(explore).toBeVisible();
  await explore.click();
  await page.waitForTimeout(400);
  const arrivalButton = page.getByRole('button', { name: /Arrival/i }).first();
  await expect(arrivalButton).toBeVisible();
  await arrivalButton.click();
  await expect(page.getByText('Where would you like to begin?')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1100);
  await shot(page, '70-arrival-return');
});
