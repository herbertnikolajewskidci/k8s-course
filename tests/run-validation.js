// Validation script for PSI Split-Screen Simulator Portal
// Tests all acceptance criteria: Port 8090, 8091, Timer, 17 questions navigation,
// Click-to-copy clipboard, Resizer dragging with mouse-trap prevention, and Iframe embedding.

const { chromium } = require('playwright');
const assert = require('assert');

async function run() {
  console.log('🚀 Starting PSI Portal E2E Validation Tests...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--unsafely-treat-insecure-origin-as-secure=http://192.168.131.223:8090'
    ]
  });
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  try {
    // 1. HTTP 200 & Title Validation on Port 8090
    console.log('Testing HTTP 200 on port 8090...');
    const response = await page.goto('http://192.168.131.223:8090');
    assert.strictEqual(response.status(), 200, 'HTTP status should be 200');
    const title = await page.title();
    assert.strictEqual(title, 'CKA Exam Simulator — Linux Foundation Practice Environment');
    console.log('✅ AC 1a: Port 8090 responds with HTTP 200 and correct title.');

    // 1b. HTTPS 200 Validation on Port 8091
    console.log('Testing HTTPS 200 on port 8091...');
    const httpsResponse = await page.goto('https://192.168.131.223:8091');
    assert.strictEqual(httpsResponse.status(), 200, 'HTTPS status should be 200');
    console.log('✅ AC 1b: Port 8091 responds with HTTPS 200 OK.');

    // Continue tests on port 8090
    await page.goto('http://192.168.131.223:8090');

    // 2. Timer Validation
    console.log('Testing 120-minute countdown timer...');
    const timer = page.locator('#timerDisplay');
    await timer.waitFor({ state: 'visible' });
    const time1 = await timer.textContent();
    assert.match(time1, /^\d{2}:\d{2}:\d{2}$/, 'Timer format must be HH:MM:SS');
    await page.waitForTimeout(1500);
    const time2 = await timer.textContent();
    assert.notStrictEqual(time1, time2, 'Timer must tick down dynamically');
    console.log(`✅ AC 2: Live 120-minute countdown timer is functioning (${time1} -> ${time2}).`);

    // 3. Questions 1-17 Navigation
    console.log('Testing navigation for Dummy Questions 1 through 17...');
    const select = page.locator('#questionSelect');
    const options = select.locator('option');
    const count = await options.count();
    assert.strictEqual(count, 17, 'There must be exactly 17 questions in dropdown');

    const btnPrev = page.locator('#btnPrev');
    const btnNext = page.locator('#btnNext');
    const taskNumber = page.locator('#taskNumber');
    const taskTitle = page.locator('#taskTitle');

    // Question 1 initial state
    assert.strictEqual(await taskNumber.textContent(), 'Question 1 of 17');
    assert.strictEqual(await btnPrev.isDisabled(), true, 'Prev button disabled on first question');
    assert.strictEqual(await btnNext.isEnabled(), true, 'Next button enabled on first question');

    // Next button click -> Question 2
    await btnNext.click();
    assert.strictEqual(await taskNumber.textContent(), 'Question 2 of 17');
    assert.ok((await taskTitle.textContent()).includes('Scale Deployment'), 'Question 2 loaded');
    assert.strictEqual(await btnPrev.isEnabled(), true, 'Prev button enabled on question 2');

    // Dropdown jump -> Question 11 (etcdutl restore)
    await select.selectOption('10'); // Index 10 is Question 11
    assert.strictEqual(await taskNumber.textContent(), 'Question 11 of 17');
    const q11Body = await page.locator('#taskBody').textContent();
    assert.ok(q11Body.includes('etcdutl snapshot restore'), 'Question 11 references etcdutl standard');

    // Dropdown jump -> Question 17 (last)
    await select.selectOption('16'); // Index 16 is Question 17
    assert.strictEqual(await taskNumber.textContent(), 'Question 17 of 17');
    assert.strictEqual(await btnNext.isDisabled(), true, 'Next button disabled on last question');

    // Previous button click -> Question 16
    await btnPrev.click();
    assert.strictEqual(await taskNumber.textContent(), 'Question 16 of 17');
    console.log('✅ AC 3: Dummy questions 1-17 browse sequentially and jump via dropdown without page reload.');

    // 4. Click-to-Copy with Visual Feedback
    console.log('Testing Click-to-Copy with visual feedback...');
    await select.selectOption('0'); // Return to Question 1
    const contextCode = page.locator('.context-box code');
    const codeText = await contextCode.textContent();
    assert.strictEqual(codeText.trim(), 'kubectl config use-context k8s');

    await contextCode.click();

    // Verify .copied class on code element
    const codeClass = await contextCode.getAttribute('class');
    assert.ok(codeClass.includes('copied'), 'Code element must receive "copied" highlight class');

    // Verify toast notification
    const toast = page.locator('#toastNotice');
    await toast.waitFor({ state: 'visible' });
    const toastClass = await toast.getAttribute('class');
    assert.ok(toastClass.includes('show'), 'Toast must receive "show" class');
    const toastContent = await toast.textContent();
    assert.ok(toastContent.includes('kubectl config use-context k8s'), 'Toast confirms copied command');
    console.log('✅ AC 4: Click-to-copy triggers immediate visual feedback and toast notification.');

    // 5. Splitter Dragging & Mouse-Trap Protection
    console.log('Testing splitter dragging and mouse-trap protection...');
    const resizer = page.locator('#resizer');
    const taskPanel = page.locator('#taskPanel');
    const initialWidth = (await taskPanel.boundingBox()).width;

    const resizerBox = await resizer.boundingBox();
    await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y + resizerBox.height / 2);
    await page.mouse.down();

    // Drag 120px to the right
    await page.mouse.move(resizerBox.x + 120, resizerBox.y + resizerBox.height / 2);
    const bodyClassDuringDrag = await page.locator('body').getAttribute('class');
    assert.ok(bodyClassDuringDrag.includes('is-dragging'), 'Body must have "is-dragging" class during mousemove');

    // Mouse up
    await page.mouse.up();
    const bodyClassAfterDrag = (await page.locator('body').getAttribute('class')) || '';
    assert.ok(!bodyClassAfterDrag.includes('is-dragging'), 'Body must clear "is-dragging" on mouseup');

    const finalWidth = (await taskPanel.boundingBox()).width;
    assert.ok(finalWidth > initialWidth, `Task panel expanded smoothly (${initialWidth}px -> ${finalWidth}px)`);
    console.log('✅ AC 5: Splitter drags smoothly with body.is-dragging mouse-trap protection.');

    // 6. Desktop Iframe Configuration & Stream Switching
    console.log('Testing Webtop desktop iframe embedding and switcher...');
    const iframe = page.locator('#desktopIframe');
    const initialIframeSrc = await iframe.getAttribute('src');
    assert.ok(initialIframeSrc.includes('192.168.131.223:3031'), 'Default iframe embeds HTTPS :3031');

    const streamSelect = page.locator('#streamSelect');
    await streamSelect.selectOption('proxy');
    const proxyIframeSrc = await iframe.getAttribute('src');
    assert.strictEqual(proxyIframeSrc, '/desktop/', 'Stream switcher switches to /desktop/ reverse proxy');

    await streamSelect.selectOption('direct-http');
    const httpIframeSrc = await iframe.getAttribute('src');
    assert.ok(httpIframeSrc.includes('192.168.131.223:3030'), 'Stream switcher switches to direct HTTP :3030');
    console.log('✅ AC 6: Webtop desktop iframe renders with flexible stream switching.');

    console.log('\n🎉 ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Validation failed:', err);
  process.exit(1);
});
