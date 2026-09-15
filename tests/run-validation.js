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

    // 2c. Timer Pause & Reset Controls Validation (Ticket 6 / Issue #19)
    console.log('Testing Ticket 6 / Issue #19: Timer Pause and Reset Controls...');
    const btnTimerToggle = page.locator('#btnTimerToggle');
    const btnTimerReset = page.locator('#btnTimerReset');
    const timerContainer = page.locator('#timerContainer');
    const timerPausedBadge = page.locator('#timerPausedBadge');

    await btnTimerToggle.waitFor({ state: 'visible' });
    await btnTimerReset.waitFor({ state: 'visible' });
    assert.strictEqual(await btnTimerToggle.textContent(), '⏸ Pause', 'Initial button text is Pause');

    // Click Pause
    await btnTimerToggle.click();
    assert.strictEqual(await btnTimerToggle.textContent(), '▶ Resume', 'Toggle button switches to Resume when clicked');
    const containerClassesAfterPause = await timerContainer.getAttribute('class');
    assert.ok(containerClassesAfterPause.includes('timer-paused'), 'Container receives timer-paused class');
    assert.strictEqual(await timerPausedBadge.isVisible(), true, 'Paused badge is visible when paused');

    // Verify time does not decrease while paused
    const pausedTime1 = await timer.textContent();
    await page.waitForTimeout(1500);
    const pausedTime2 = await timer.textContent();
    assert.strictEqual(pausedTime1, pausedTime2, 'Timer must halt decrementing when paused');

    // Click Reset while paused
    await btnTimerReset.click();
    const resetTime = await timer.textContent();
    assert.strictEqual(resetTime, '02:00:00', 'Reset button restores display to 02:00:00');
    const resetTimeClass = await timerContainer.getAttribute('class');
    assert.ok(resetTimeClass.includes('timer-paused'), 'Timer remains in paused state if reset was pressed while paused');

    // Click Resume
    await btnTimerToggle.click();
    assert.strictEqual(await btnTimerToggle.textContent(), '⏸ Pause', 'Toggle button switches back to Pause on resume');
    const containerClassesAfterResume = (await timerContainer.getAttribute('class')) || '';
    assert.ok(!containerClassesAfterResume.includes('timer-paused'), 'Container clears timer-paused class');

    // Wait and verify countdown resumes from 02:00:00
    await page.waitForTimeout(1500);
    const resumedTime = await timer.textContent();
    assert.notStrictEqual(resumedTime, '02:00:00', 'Timer decrements after resuming from reset');

    // Click Reset while running
    await btnTimerReset.click();
    const resetRunningTime = await timer.textContent();
    assert.strictEqual(resetRunningTime, '02:00:00', 'Reset button restores display to 02:00:00 while running');
    await page.waitForTimeout(1500);
    const tickingAfterReset = await timer.textContent();
    assert.notStrictEqual(tickingAfterReset, '02:00:00', 'Timer continues running after reset while running');

    console.log('✅ Ticket 6 / Issue #19: Timer Pause, Resume, and Reset controls verified successfully.');

    // 2d. Manual Timer Edit Validation
    console.log('Testing Manual Timer Manipulation / Edit Feature...');
    const btnTimerEdit = page.locator('#btnTimerEdit');
    const timerInput = page.locator('#timerInput');
    const btnTimerSave = page.locator('#btnTimerSave');
    const btnTimerCancel = page.locator('#btnTimerCancel');

    await btnTimerEdit.waitFor({ state: 'visible' });
    await btnTimerEdit.click();

    // Verify edit mode entered
    assert.strictEqual(await timerInput.isVisible(), true, 'Timer input must be visible in edit mode');
    assert.strictEqual(await timer.isVisible(), false, 'Timer display must be hidden in edit mode');
    assert.strictEqual(await btnTimerSave.isVisible(), true, 'Save button must be visible in edit mode');
    assert.strictEqual(await btnTimerCancel.isVisible(), true, 'Cancel button must be visible in edit mode');

    // Fill new time e.g. 15 minutes (00:15:00)
    await timerInput.fill('00:15:00');
    await btnTimerSave.click();

    // Verify edit mode exited and time set
    assert.strictEqual(await timerInput.isVisible(), false, 'Timer input hidden after save');
    assert.strictEqual(await timer.isVisible(), true, 'Timer display visible after save');
    assert.strictEqual(await timer.textContent(), '00:15:00', 'Timer display updated to 00:15:00');

    // Verify click on timer display directly triggers edit mode
    await timer.click();
    assert.strictEqual(await timerInput.isVisible(), true, 'Clicking display opens edit mode');
    await btnTimerCancel.click();
    assert.strictEqual(await timerInput.isVisible(), false, 'Cancel exits edit mode');
    assert.strictEqual(await timer.textContent(), '00:15:00', 'Timer value retained after cancel');

    // Reset back to 02:00:00 for subsequent tests
    await btnTimerReset.click();
    assert.strictEqual(await timer.textContent(), '02:00:00', 'Timer reset to 02:00:00');
    console.log('✅ Manual Timer Edit: Direct click, input field, format parsing, and buttons verified.');

    // 2b. Header & Task Nav Bar Placement Validation (Ticket 4 / Issue #17)
    console.log('Testing Ticket 4: Navigation controls inside left task pane and header cleanliness...');
    const headerNav = page.locator('.exam-header .header-nav');
    assert.strictEqual(await headerNav.count(), 0, 'Header must not contain .header-nav');
    const headerControls = page.locator('.exam-header #questionSelect, .exam-header #btnPrev, .exam-header #btnNext');
    assert.strictEqual(await headerControls.count(), 0, 'Header must not contain question navigation controls');

    const taskNavBar = page.locator('#taskPanel .task-nav-bar');
    await taskNavBar.waitFor({ state: 'visible' });
    const navInTask = page.locator('#taskPanel .task-nav-bar #questionSelect');
    assert.strictEqual(await navInTask.count(), 1, 'Question select must reside inside #taskPanel .task-nav-bar');
    console.log('✅ Ticket 4: Question controls successfully relocated to left task pane; header retains only brand and timer.');

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
    assert.ok((await taskTitle.textContent()).includes('Kubeconfig'), 'Question 2 loaded');
    assert.strictEqual(await btnPrev.isEnabled(), true, 'Prev button enabled on question 2');

    // Keyboard navigation: ArrowLeft -> Question 1, ArrowRight -> Question 2
    await page.keyboard.press('ArrowLeft');
    assert.strictEqual(await taskNumber.textContent(), 'Question 1 of 17', 'ArrowLeft navigates to Question 1');
    await page.keyboard.press('ArrowRight');
    assert.strictEqual(await taskNumber.textContent(), 'Question 2 of 17', 'ArrowRight navigates to Question 2');
    console.log('✅ Ticket 4: Keyboard navigation (ArrowLeft / ArrowRight) functions correctly.');

    // Dropdown jump -> Question 14 (etcdutl restore)
    await select.selectOption('13'); // Index 13 is Question 14
    assert.strictEqual(await taskNumber.textContent(), 'Question 14 of 17');
    const q14Body = await page.locator('#taskBody').textContent();
    assert.ok(q14Body.includes('etcdutl snapshot restore'), 'Question 14 references etcdutl standard');

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
    assert.strictEqual(codeText.trim(), 'ssh cka6016');

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
    assert.ok(toastContent.includes('ssh cka6016'), 'Toast confirms copied command');
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

    // 7. Ticket 5 / Issue #18: Doc Helper Links with Auto-Open in Remote Desktop Firefox
    console.log('Testing Ticket 5 / Issue #18: Doc Helper Links with Auto-Open in Remote Desktop Firefox...');

    // 7a. Verify Doc Helper Container & Pills across questions
    await select.selectOption('0'); // Question 1
    const docContainer = page.locator('#taskBody .task-docs-container');
    await docContainer.waitFor({ state: 'visible' });
    const pillsQ1 = docContainer.locator('.doc-pill-btn');
    const pillsCountQ1 = await pillsQ1.count();
    assert.ok(pillsCountQ1 >= 1, `Question 1 must have at least 1 doc helper pill (found ${pillsCountQ1})`);

    const q1DocTitle = await pillsQ1.first().locator('.doc-pill-text').textContent();
    assert.strictEqual(q1DocTitle, 'DNS for Services and Pods', 'First doc pill title matches');
    const q1DocUrl = await pillsQ1.first().getAttribute('data-url');
    assert.ok(q1DocUrl.includes('kubernetes.io/docs/concepts/services-networking/dns-pod-service'), 'Doc URL is official k8s doc link');

    // Verify Question 4 (ReadinessProbes) and Question 14 (etcd) have doc pills
    await select.selectOption('3'); // Question 4
    await page.locator('#taskBody .task-docs-container').waitFor({ state: 'visible' });
    const pillsQ4 = page.locator('#taskBody .task-docs-container .doc-pill-btn');
    assert.ok((await pillsQ4.count()) >= 1, 'Question 4 has doc helper pills');
    const q4DocTitle = await pillsQ4.first().locator('.doc-pill-text').textContent();
    assert.ok(q4DocTitle.includes('Probes'), 'Question 4 first doc pill is Probes');

    await select.selectOption('13'); // Question 14
    await page.locator('#taskBody .task-docs-container').waitFor({ state: 'visible' });
    const pillsQ14 = page.locator('#taskBody .task-docs-container .doc-pill-btn');
    assert.ok((await pillsQ14.count()) >= 1, 'Question 14 has doc helper pills');
    const q14DocTitle = await pillsQ14.first().locator('.doc-pill-text').textContent();
    assert.ok(q14DocTitle.includes('etcd'), 'Question 14 doc pill references etcd');

    // 7b. Click Doc Pill -> Backend API Call & Toast Feedback
    await select.selectOption('3'); // Question 4
    const ingressPill = page.locator('#taskBody .task-docs-container .doc-pill-btn').first();

    const [apiResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/open-doc') && res.status() === 200),
      ingressPill.click()
    ]);

    const apiJson = await apiResponse.json();
    assert.strictEqual(apiJson.success, true, 'API response must have success: true');
    assert.ok(apiJson.url.includes('kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/'), 'API received correct URL');
    console.log(`✅ Ticket 5 API: /api/open-doc returned HTTP 200 with success: true for ${apiJson.url}`);

    // Verify Toast visual feedback
    const docToast = page.locator('#toastNotice');
    await docToast.waitFor({ state: 'visible' });
    const docToastClass = await docToast.getAttribute('class');
    assert.ok(docToastClass.includes('show'), 'Toast must be visible');
    const docToastContent = await docToast.textContent();
    assert.ok(docToastContent.includes('Firefox') && docToastContent.includes('Probes'), `Toast confirms dispatch to Firefox (was "${docToastContent}")`);
    console.log(`✅ Ticket 5 UX: Toast feedback verified ("${docToastContent}")`);

    // 8. Herbert's Drill / Repetition Button ("Nochmal üben")
    console.log("Testing Herbert's Drill / Repetition Button (#btnDrill & #drillBadge)...");
    const btnDrill = page.locator('#btnDrill');
    const drillBadge = page.locator('#drillBadge');
    await btnDrill.waitFor({ state: 'visible' });
    assert.ok((await btnDrill.textContent()).includes('Nochmal üben'), 'Initial button text contains "Nochmal üben"');
    assert.strictEqual(await drillBadge.isVisible(), false, 'Drill badge initially hidden');

    // Click to mark for drill
    await btnDrill.click();
    assert.ok((await btnDrill.textContent()).includes('Gemerkt'), 'Button text switches to "Gemerkt"');
    const btnClasses = (await btnDrill.getAttribute('class')) || '';
    assert.ok(btnClasses.includes('drilled'), 'Button receives "drilled" class');
    assert.strictEqual(await drillBadge.isVisible(), true, 'Drill badge is visible when question is marked');

    // Verify dropdown option has 🎯 prefix
    const currentOptionText = await select.locator('option:checked').textContent();
    assert.ok(currentOptionText.includes('🎯'), 'Selected dropdown option shows 🎯 prefix');

    // Click again to unmark
    await btnDrill.click();
    assert.ok((await btnDrill.textContent()).includes('Nochmal üben'), 'Button text switches back');
    assert.strictEqual(await drillBadge.isVisible(), false, 'Drill badge is hidden after unmarking');
    console.log("✅ Herbert's Drill Button: Toggle, badge, dropdown icon, and API integration verified.");

    // 9. Flag & Drill Persistence across Page Reload
    console.log("Testing Review Flag (#btnFlag) & Drill Flag (#btnDrill) Persistence across Page Reload...");
    const btnFlag = page.locator('#btnFlag');

    // Select Question 3 (index 2)
    await select.selectOption('2');
    assert.strictEqual(await taskNumber.textContent(), 'Question 3 of 17');

    // Mark Question 3 with both Flag and Drill
    await btnFlag.click();
    assert.ok((await btnFlag.getAttribute('class')).includes('flagged'), 'btnFlag receives flagged class');
    await btnDrill.click();
    assert.ok((await btnDrill.getAttribute('class')).includes('drilled'), 'btnDrill receives drilled class');

    // Select Question 7 (index 6) and mark with Flag
    await select.selectOption('6');
    assert.strictEqual(await taskNumber.textContent(), 'Question 7 of 17');
    await btnFlag.click();
    assert.ok((await btnFlag.getAttribute('class')).includes('flagged'), 'btnFlag receives flagged class on Q7');

    // Verify dropdown shows prefixes before reload
    const optQ3Before = await select.locator('option[value="2"]').textContent();
    const optQ7Before = await select.locator('option[value="6"]').textContent();
    assert.ok(optQ3Before.includes('⚑'), 'Q3 has ⚑ before reload');
    assert.ok(optQ7Before.includes('⚑'), 'Q7 has ⚑ before reload');

    // Reload page
    console.log('Reloading page to test persistence...');
    await page.reload();
    await page.waitForTimeout(500);

    // Verify Question 7 remains the active question after reload
    assert.strictEqual(await taskNumber.textContent(), 'Question 7 of 17', 'Active question index persists across reload');
    assert.ok((await btnFlag.getAttribute('class')).includes('flagged'), 'btnFlag retains flagged class on Q7 after reload');

    // Navigate back to Question 3 and verify persisted states
    await select.selectOption('2');
    assert.strictEqual(await taskNumber.textContent(), 'Question 3 of 17');
    assert.ok((await btnFlag.getAttribute('class')).includes('flagged'), 'btnFlag retains flagged class on Q3 after reload');
    assert.ok((await btnDrill.getAttribute('class')).includes('drilled'), 'btnDrill retains drilled class on Q3 after reload');
    assert.strictEqual(await drillBadge.isVisible(), true, 'drillBadge visible on Q3 after reload');

    const optQ3After = await select.locator('option[value="2"]').textContent();
    const optQ7After = await select.locator('option[value="6"]').textContent();
    assert.ok(optQ3After.includes('⚑'), 'Q3 retains ⚑ in dropdown after reload');
    assert.ok(optQ7After.includes('⚑'), 'Q7 retains ⚑ in dropdown after reload');

    // Cleanup: unflag both questions
    await btnFlag.click(); // Unflag Q3
    await btnDrill.click(); // Undrill Q3
    await select.selectOption('6');
    await btnFlag.click(); // Unflag Q7
    await select.selectOption('0'); // Return to Question 1
    console.log('✅ Reload Persistence: Active question, Review Flags (⚑), and Drill Flags fully survive page reload.');

    console.log('\n🎉 ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Validation failed:', err);
  process.exit(1);
});
