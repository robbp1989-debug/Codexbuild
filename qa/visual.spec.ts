import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const OUT = 'qa-artifacts';
const LOCAL = 'http://localhost:3000';
const GOLDEN_RAW = 'https://raw.githubusercontent.com/robbp1989-debug/Codexbuild/preview-live-scroll/preview/shift-live-scroll.html';

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
  await page.waitForTimeout(900);
}

test.describe.configure({ mode: 'serial' });

test('capture golden reference and rebuilt SHIFT flow', async ({ page }) => {
  await page.setViewportSize({ width: 1750, height: 832 });

  // Render the approved standalone HTML directly instead of going through the
  // rawgit.hack interstitial. All media references in the golden file are
  // absolute, so this produces the same page while keeping visual QA stable.
  const goldenResponse = await fetch(GOLDEN_RAW);
  expect(goldenResponse.ok).toBeTruthy();
  const goldenHtml = await goldenResponse.text();
  await page.setContent(goldenHtml, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await shot(page, '00-golden-hero');
  await moveToArrival(page);
  await shot(page, '01-golden-arrival');

  await page.goto(LOCAL, { waitUntil: 'networkidle' });
  await expect(page.getByText('Mind over', { exact: false })).toBeVisible();
  await shot(page, '10-rebuild-hero');

  await moveToArrival(page);
  await shot(page, '11-rebuild-arrival');
  await expect(page.getByText('Where would you like to begin?')).toBeVisible();
  await expect(page.locator('.arrival-nav').getByRole('button', { name: 'Life context' })).toBeVisible();
  await expect(page.locator('#life-context').getByText('Life context', { exact: true })).toBeVisible();
  await expect(page.getByText("What’s going on?", { exact: true })).toBeVisible();

  const reflection = page.locator('#reflection-workspace textarea');
  await reflection.fill('A friend did not reply right away and I noticed my mind predicting that I had done something wrong.');
  await page.getByRole('button', { name: /Explore my situation/i }).click();
  await expect(page.getByText('Your SHIFT breakdown')).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(250);
  await shot(page, '20-breakdown');

  await page.getByRole('button', { name: /Keep talking/i }).first().click();
  await expect(page.getByRole('heading', { name: /Stay with this before solving it/i })).toBeVisible();
  await expect(page.getByText('Perspective shift', { exact: false }).first()).toBeVisible();
  await page.waitForTimeout(350);
  await shot(page, '30-keep-talking');

  await page.getByRole('button', { name: 'Prediction Lab' }).click();
  await page.waitForTimeout(350);
  await shot(page, '40-prediction-lab');

  await page.getByRole('button', { name: 'Memory' }).click();
  await page.waitForTimeout(350);
  await shot(page, '50-memory');

  await page.getByRole('link', { name: 'Privacy' }).click();
  await page.waitForLoadState('networkidle');
  await shot(page, '60-privacy');

  await page.goto(LOCAL, { waitUntil: 'networkidle' });
  await moveToArrival(page);
  const explore = page.locator('.arrival-nav').getByRole('button', { name: 'Explore Shift' });
  await expect(explore).toBeVisible();
  await explore.click();
  await page.waitForTimeout(350);
  const arrivalButton = page.getByRole('button', { name: /Arrival/i }).first();
  await expect(arrivalButton).toBeVisible();
  await arrivalButton.click();
  await expect(page.getByText('Where would you like to begin?')).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(900);
  await shot(page, '70-arrival-return');
});
