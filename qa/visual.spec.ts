import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';

const OUT = 'qa-artifacts';
const LOCAL = 'http://localhost:3000';
const GOLDEN_LOCAL = `${LOCAL}/qa/shift-live-scroll.html`;

// Use the installed Google Chrome channel rather than Playwright's open-source
// Chromium build. The approved SHIFT movie is H.264, and Chrome includes the
// codec needed to exercise the real scrubbed video instead of silently falling
// back to static frames during visual regression testing.
test.use({ channel: 'chrome' });

async function shot(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

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

async function expectVideoReady(page: Page, selector: string) {
  await expect.poll(async () => page.locator(selector).evaluate((node) => {
    const video = node as HTMLVideoElement;
    return Number.isFinite(video.duration) && video.duration > 9 && video.readyState >= 1;
  }), { timeout: 15_000 }).toBe(true);
}

type CinematicSample = {
  time: number;
  heroOpacity: number;
  arrivalOpacity: number;
  cueOpacity: number;
};

async function sampleCinematic(
  page: Page,
  selectors: { root: string; video: string; hero: string; arrival: string; cue: string },
  progress: number,
): Promise<CinematicSample> {
  await page.evaluate(({ rootSelector, progressValue }) => {
    const root = document.querySelector<HTMLElement>(rootSelector);
    if (!root) throw new Error(`Missing cinematic root: ${rootSelector}`);
    const rootTop = window.scrollY + root.getBoundingClientRect().top;
    const max = Math.max(1, root.offsetHeight - window.innerHeight);
    window.scrollTo(0, rootTop + max * progressValue);
  }, { rootSelector: selectors.root, progressValue: progress });
  await page.waitForTimeout(720);

  return page.evaluate((currentSelectors) => {
    const video = document.querySelector<HTMLVideoElement>(currentSelectors.video);
    const hero = document.querySelector<HTMLElement>(currentSelectors.hero);
    const arrival = document.querySelector<HTMLElement>(currentSelectors.arrival);
    const cue = document.querySelector<HTMLElement>(currentSelectors.cue);
    if (!video || !hero || !arrival || !cue) throw new Error('Missing cinematic sample element.');
    return {
      time: video.currentTime,
      heroOpacity: Number.parseFloat(getComputedStyle(hero).opacity),
      arrivalOpacity: Number.parseFloat(getComputedStyle(arrival).opacity),
      cueOpacity: Number.parseFloat(getComputedStyle(cue).opacity),
    };
  }, selectors);
}

test.describe.configure({ mode: 'serial' });

test('golden scroll transport parity', async ({ page }) => {
  await page.setViewportSize({ width: 1750, height: 832 });
  const progressStops = [0, 0.08, 0.16, 0.25, 0.5, 0.78, 0.86, 0.94, 1];

  await page.goto(GOLDEN_LOCAL, { waitUntil: 'networkidle' });
  await expectVideoReady(page, '#movie');
  const goldenGeometry = await page.locator('#cinematic').evaluate((root) => ({
    rootHeight: (root as HTMLElement).offsetHeight,
    viewportHeight: window.innerHeight,
    stageHeight: document.querySelector<HTMLElement>('.stage')?.offsetHeight || 0,
  }));
  expect(Math.abs(goldenGeometry.rootHeight / goldenGeometry.viewportHeight - 2.1)).toBeLessThan(0.02);
  expect(Math.abs(goldenGeometry.stageHeight - goldenGeometry.viewportHeight)).toBeLessThanOrEqual(1);
  const goldenSamples: CinematicSample[] = [];
  for (const progress of progressStops) {
    goldenSamples.push(await sampleCinematic(page, {
      root: '#cinematic',
      video: '#movie',
      hero: '#hero',
      arrival: '#arrival',
      cue: '#cue',
    }, progress));
  }

  await page.goto(LOCAL, { waitUntil: 'networkidle' });
  await expectVideoReady(page, 'video.cinematic-video');
  const rebuiltGeometry = await page.locator('.cinematic-scroll').evaluate((root) => ({
    rootHeight: (root as HTMLElement).offsetHeight,
    viewportHeight: window.innerHeight,
    stageHeight: document.querySelector<HTMLElement>('.cinematic-stage')?.offsetHeight || 0,
  }));
  expect(Math.abs(rebuiltGeometry.rootHeight / rebuiltGeometry.viewportHeight - 2.1)).toBeLessThan(0.02);
  expect(Math.abs(rebuiltGeometry.stageHeight - rebuiltGeometry.viewportHeight)).toBeLessThanOrEqual(1);

  for (let index = 0; index < progressStops.length; index += 1) {
    const rebuilt = await sampleCinematic(page, {
      root: '.cinematic-scroll',
      video: 'video.cinematic-video',
      hero: '.cinematic-panel--hero',
      arrival: '.cinematic-panel--workspace-arrival',
      cue: '.cinematic-scroll-cue',
    }, progressStops[index]);
    const golden = goldenSamples[index];
    expect(Math.abs(rebuilt.time - golden.time)).toBeLessThanOrEqual(0.08);
    expect(Math.abs(rebuilt.heroOpacity - golden.heroOpacity)).toBeLessThanOrEqual(0.035);
    expect(Math.abs(rebuilt.arrivalOpacity - golden.arrivalOpacity)).toBeLessThanOrEqual(0.035);
    expect(Math.abs(rebuilt.cueOpacity - golden.cueOpacity)).toBeLessThanOrEqual(0.035);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(LOCAL, { waitUntil: 'networkidle' });
  const mobileRatio = await page.locator('.cinematic-scroll').evaluate((root) => (root as HTMLElement).offsetHeight / window.innerHeight);
  expect(Math.abs(mobileRatio - 1.9)).toBeLessThan(0.02);
});

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
  for (const contextName of ['Everyday life', 'Work', 'Relationships', 'Family', 'Recovery', 'Social situations']) {
    await expect(page.locator('#life-context').getByText(contextName, { exact: true })).toBeVisible();
  }

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

  // The handoff requires a real evolving conversation, not a repeated canned
  // prompt. Exercise the live conversation endpoint twice and confirm SHIFT
  // advances to a new completed assistant turn each time. Loading placeholders
  // are intentionally excluded from this locator.
  const assistantTurns = page.locator('.keep-talking-turn--assistant:not(.keep-talking-turn--loading) .keep-talking-turn__body');
  const initialAssistantCount = await assistantTurns.count();
  const initialAssistantText = await assistantTurns.last().innerText();
  const composer = page.getByPlaceholder('What’s on your mind right now?');

  await composer.fill('I think maybe they are upset with me, and I keep trying to figure out why.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(assistantTurns).toHaveCount(initialAssistantCount + 1, { timeout: 20_000 });
  const firstReply = await assistantTurns.last().innerText();
  expect(firstReply.trim()).not.toBe(initialAssistantText.trim());

  await composer.fill('Underneath the analysis, I feel hurt and uncertain.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(assistantTurns).toHaveCount(initialAssistantCount + 2, { timeout: 20_000 });
  const secondReply = await assistantTurns.last().innerText();
  expect(secondReply.trim()).not.toBe(firstReply.trim());
  await shot(page, '31-keep-talking-evolving');

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
