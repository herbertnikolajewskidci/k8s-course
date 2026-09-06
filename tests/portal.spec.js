import { test, expect } from '@playwright/test';

test('PSI Portal - Page title, layout and timer', async ({ page }) => {
  await page.goto('http://192.168.131.223:8090');

  // Verify Title
  await expect(page).toHaveTitle('CKA Exam Simulator — Linux Foundation Practice Environment');

  // Verify Header Brand
  const brand = page.locator('.brand-badge');
  await expect(brand).toContainText('CKA Exam Simulator');

  // Verify Timer
  const timer = page.locator('#timerDisplay');
  await expect(timer).toBeVisible();
  // Timer should start at 02:00:00 or count down
  const initialTime = await timer.textContent();
  expect(initialTime).toMatch(/\d{2}:\d{2}:\d{2}/);

  // Wait 1.5 seconds and ensure timer decreases
  await page.waitForTimeout(1500);
  const nextTime = await timer.textContent();
  expect(nextTime).not.toBe(initialTime);
});

test('PSI Portal - Navigation through all 17 dummy questions', async ({ page }) => {
  await page.goto('http://192.168.131.223:8090');

  const questionSelect = page.locator('#questionSelect');
  const taskNumber = page.locator('#taskNumber');
  const taskTitle = page.locator('#taskTitle');
  const btnPrev = page.locator('#btnPrev');
  const btnNext = page.locator('#btnNext');

  // Check 17 options in dropdown
  const options = questionSelect.locator('option');
  await expect(options).toHaveCount(17);

  // Initial state: Question 1
  await expect(taskNumber).toHaveText('Question 1 of 17');
  await expect(taskTitle).toContainText('Pod Scheduling with NodeAffinity');
  await expect(btnPrev).toBeDisabled();
  await expect(btnNext).toBeEnabled();

  // Click Next -> Question 2
  await btnNext.click();
  await expect(taskNumber).toHaveText('Question 2 of 17');
  await expect(taskTitle).toContainText('Scale Deployment & Record Revision');
  await expect(btnPrev).toBeEnabled();

  // Jump via dropdown to Question 11 (etcdutl)
  await questionSelect.selectOption('10'); // index 10 = Question 11
  await expect(taskNumber).toHaveText('Question 11 of 17');
  await expect(taskTitle).toContainText('etcd Backup and Restore using etcdutl');
  await expect(page.locator('#taskBody')).toContainText('etcdutl snapshot restore');

  // Jump to Question 17 (last question)
  await questionSelect.selectOption('16'); // index 16 = Question 17
  await expect(taskNumber).toHaveText('Question 17 of 17');
  await expect(taskTitle).toContainText('Gateway API HTTPRoute Traffic Splitting');
  await expect(btnNext).toBeDisabled();
  await expect(btnPrev).toBeEnabled();

  // Click Prev -> Question 16
  await btnPrev.click();
  await expect(taskNumber).toHaveText('Question 16 of 17');
  await expect(taskTitle).toContainText('Kustomize Overlay Customization');
});

test('PSI Portal - Click-to-Copy with visual feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('http://192.168.131.223:8090');

  // Question 1 has context command: kubectl config use-context k8s
  const contextCode = page.locator('.context-box code');
  await expect(contextCode).toHaveText('kubectl config use-context k8s');

  // Click code element
  await contextCode.click();

  // Verify toast feedback appears
  const toast = page.locator('#toastNotice');
  await expect(toast).toHaveClass(/show/);
  await expect(toast).toContainText('Copied to clipboard');

  // Verify clipboard content
  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBe('kubectl config use-context k8s');
});

test('PSI Portal - Splitter Dragging and Mouse-Trap Protection', async ({ page }) => {
  await page.goto('http://192.168.131.223:8090');

  const resizer = page.locator('#resizer');
  const taskPanel = page.locator('#taskPanel');
  const initialBox = await taskPanel.boundingBox();

  // Check body does not have is-dragging initially
  await expect(page.locator('body')).not.toHaveClass(/is-dragging/);

  // Drag splitter to the right by 100px
  const resizerBox = await resizer.boundingBox();
  await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + resizerBox.height / 2);
  await page.mouse.down();

  // During drag, body must have .is-dragging class (which sets pointer-events: none on iframe)
  await page.mouse.move(resizerBox.x + 100, resizerBox.y + resizerBox.height / 2);
  await expect(page.locator('body')).toHaveClass(/is-dragging/);

  // Release mouse
  await page.mouse.up();
  await expect(page.locator('body')).not.toHaveClass(/is-dragging/);

  // Panel width should have grown
  const newBox = await taskPanel.boundingBox();
  expect(newBox.width).toBeGreaterThan(initialBox.width);
});

test('PSI Portal - Webtop Desktop Iframe Configuration', async ({ page }) => {
  await page.goto('http://192.168.131.223:8090');

  const iframe = page.locator('#desktopIframe');
  await expect(iframe).toBeVisible();

  // Verify iframe src matches Webtop host
  const src = await iframe.getAttribute('src');
  expect(src).toMatch(/192\.168\.131\.223:3031/);

  // Test stream switcher dropdown to /desktop/ proxy
  const streamSelect = page.locator('#streamSelect');
  await streamSelect.selectOption('proxy');
  const proxiedSrc = await iframe.getAttribute('src');
  expect(proxiedSrc).toBe('/desktop/');

  // Test stream switcher dropdown to direct HTTP :3030
  await streamSelect.selectOption('direct-http');
  const httpSrc = await iframe.getAttribute('src');
  expect(httpSrc).toMatch(/192\.168\.131\.223:3030/);
});
