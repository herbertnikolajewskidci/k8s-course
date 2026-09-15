// CKA PSI Exam Simulator Application Logic

document.addEventListener('DOMContentLoaded', () => {
  const questions = window.QUESTIONS || [];
  let currentQuestionIndex = 0;
  let isDragging = false;
  let toastTimer = null;

  // DOM Elements
  const taskPanel = document.getElementById('taskPanel') || document.getElementById('pane-task');
  const resizer = document.getElementById('resizer');
  const splitLayout = document.getElementById('splitLayout');
  const desktopIframe = document.getElementById('desktopIframe');
  const streamSelect = document.getElementById('streamSelect');
  const questionSelect = document.getElementById('questionSelect') || document.getElementById('question-select');
  const btnPrev = document.getElementById('btnPrev') || document.getElementById('btn-prev');
  const btnNext = document.getElementById('btnNext') || document.getElementById('btn-next');
  const timerDisplay = document.getElementById('timerDisplay');
  const taskNumber = document.getElementById('taskNumber');
  const taskWeight = document.getElementById('taskWeight');
  const taskTitle = document.getElementById('taskTitle');
  const taskBody = document.getElementById('taskBody');
  const taskScrollArea = document.getElementById('taskScrollArea');
  const toastNotice = document.getElementById('toastNotice');
  const toastText = document.getElementById('toastText');

  // 1. Initialise Desktop Stream Source
  function initDesktopStream() {
    const host = window.location.hostname || '192.168.131.223';
    const isHttps = window.location.protocol === 'https:';

    // Show HTTPS switch prompt if running on insecure HTTP
    const httpsSwitchBtn = document.getElementById('httpsSwitchBtn');
    if (!isHttps && httpsSwitchBtn) {
      httpsSwitchBtn.style.display = 'inline-flex';
      httpsSwitchBtn.href = `https://${host}:8091`;
    }

    // Populate stream choices with current hostname
    streamSelect.innerHTML = `
      <option value="direct-https">Desktop: Direct HTTPS (Port 3031)</option>
      <option value="direct-http">Desktop: Direct HTTP (Port 3030)</option>
      <option value="proxy">Desktop: Reverse Proxy (/desktop/)</option>
    `;

    // Select default: HTTPS 3031 if page is HTTPS, or HTTP 3030 if page is HTTP
    if (isHttps) {
      streamSelect.value = 'direct-https';
      desktopIframe.src = `https://${host}:3031`;
    } else {
      // Default to HTTPS :3031 as requested in spec, but allow easy switch
      streamSelect.value = 'direct-https';
      desktopIframe.src = `https://${host}:3031`;
    }

    streamSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (mode === 'direct-https') {
        desktopIframe.src = `https://${host}:3031`;
      } else if (mode === 'direct-http') {
        desktopIframe.src = `http://${host}:3030`;
      } else if (mode === 'proxy') {
        desktopIframe.src = '/desktop/';
      }
    });
  }

  // Set of flagged question indices (persists across question changes)
  const flaggedQuestions = new Set();
  const btnFlag = document.getElementById('btnFlag');

  // Set of drill question indices (Herbert's Practice Routine)
  const drilledQuestions = new Set();
  const btnDrill = document.getElementById('btnDrill');
  const drillBadge = document.getElementById('drillBadge');

  // 2. Initialize Question Navigation & Dropdown
  function initQuestions() {
    loadDrillFlagsLocally();
    renderQuestionDropdown();

    questionSelect.addEventListener('change', (e) => {
      loadQuestion(parseInt(e.target.value, 10));
    });

    btnPrev.addEventListener('click', () => {
      if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
      }
    });

    btnNext.addEventListener('click', () => {
      if (currentQuestionIndex < questions.length - 1) {
        loadQuestion(currentQuestionIndex + 1);
      }
    });

    if (btnFlag) {
      btnFlag.addEventListener('click', () => {
        toggleFlagCurrentQuestion();
      });
    }

    if (btnDrill) {
      btnDrill.addEventListener('click', () => {
        toggleDrillCurrentQuestion();
      });
    }

    loadQuestion(0);
    syncDrillFlagsWithBackend();
  }

  function renderQuestionDropdown() {
    questionSelect.innerHTML = '';
    questions.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const isFlagged = flaggedQuestions.has(idx);
      const isDrilled = drilledQuestions.has(idx);
      const flagPrefix = isFlagged ? '⚑ ' : '';
      const drillPrefix = isDrilled ? '🎯 ' : '';
      opt.textContent = `${flagPrefix}${drillPrefix}Question ${q.id} of ${questions.length}`;
      questionSelect.appendChild(opt);
    });
    questionSelect.value = currentQuestionIndex;
  }

  function toggleFlagCurrentQuestion() {
    if (flaggedQuestions.has(currentQuestionIndex)) {
      flaggedQuestions.delete(currentQuestionIndex);
      btnFlag.classList.remove('flagged');
      btnFlag.querySelector('.flag-text').textContent = 'Flag';
      showToast(`Question ${questions[currentQuestionIndex].id} unflagged`);
    } else {
      flaggedQuestions.add(currentQuestionIndex);
      btnFlag.classList.add('flagged');
      btnFlag.querySelector('.flag-text').textContent = 'Flagged';
      showToast(`Question ${questions[currentQuestionIndex].id} flagged for review!`);
    }
    renderQuestionDropdown();
  }

  function saveDrillFlagsLocally() {
    try {
      const activeIds = Array.from(drilledQuestions)
        .map(idx => questions[idx] ? questions[idx].id : idx + 1);
      localStorage.setItem('cka_drill_flags', JSON.stringify(activeIds));
    } catch (e) {
      console.warn('Could not save drill flags to localStorage:', e);
    }
  }

  function loadDrillFlagsLocally() {
    try {
      const raw = localStorage.getItem('cka_drill_flags');
      if (raw) {
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
          ids.forEach(id => {
            const idx = questions.findIndex(q => q.id === id);
            if (idx !== -1) drilledQuestions.add(idx);
          });
        }
      }
    } catch (e) {
      console.warn('Could not load drill flags from localStorage:', e);
    }
  }

  async function syncDrillFlagsWithBackend() {
    try {
      const res = await fetch('/api/drill-flags');
      if (res.ok) {
        const data = await res.json();
        if (data.drillFlags && Array.isArray(data.drillFlags)) {
          data.drillFlags.forEach(id => {
            const idx = questions.findIndex(q => q.id === id);
            if (idx !== -1) drilledQuestions.add(idx);
          });
          saveDrillFlagsLocally();
          updateDrillUI();
          renderQuestionDropdown();
        }
      }
    } catch (err) {
      console.warn('Could not sync drill flags with backend:', err);
    }
  }

  async function toggleDrillCurrentQuestion() {
    const q = questions[currentQuestionIndex];
    const qId = q ? q.id : (currentQuestionIndex + 1);

    if (drilledQuestions.has(currentQuestionIndex)) {
      drilledQuestions.delete(currentQuestionIndex);
      showToast(`Frage ${qId}: Wiederholungs-Markierung entfernt`, 'ℹ️');
    } else {
      drilledQuestions.add(currentQuestionIndex);
      showToast(`Frage ${qId} für gezielte Wiederholung gemerkt! 🎯`, '🎯');
    }

    saveDrillFlagsLocally();
    updateDrillUI();
    renderQuestionDropdown();

    try {
      const activeIds = Array.from(drilledQuestions)
        .map(idx => questions[idx] ? questions[idx].id : idx + 1);
      await fetch('/api/drill-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drillFlags: activeIds })
      });
    } catch (err) {
      console.warn('Backend drill flag sync failed:', err);
    }
  }

  function updateDrillUI() {
    const isDrilled = drilledQuestions.has(currentQuestionIndex);
    if (btnDrill) {
      const textEl = btnDrill.querySelector('.drill-text');
      if (isDrilled) {
        btnDrill.classList.add('drilled');
        if (textEl) textEl.textContent = 'Gemerkt';
        btnDrill.setAttribute('title', 'Diese Frage ist für gezieltes Üben gemerkt (Klicken zum Entfernen)');
      } else {
        btnDrill.classList.remove('drilled');
        if (textEl) textEl.textContent = 'Nochmal üben';
        btnDrill.setAttribute('title', 'Frage für gezielte Wiederholung und Übungs-Arbeitsblätter vormerken');
      }
    }
    if (drillBadge) {
      drillBadge.style.display = isDrilled ? 'inline-flex' : 'none';
    }
  }

  function loadQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentQuestionIndex = index;
    const q = questions[index];

    taskNumber.textContent = `Question ${q.id} of ${questions.length}`;
    taskWeight.textContent = `Weight: ${q.weight}%`;
    taskTitle.textContent = `${q.id}. ${q.title}`;
    taskBody.innerHTML = q.body;

    // Update Flag button state
    if (btnFlag) {
      if (flaggedQuestions.has(index)) {
        btnFlag.classList.add('flagged');
        btnFlag.querySelector('.flag-text').textContent = 'Flagged';
      } else {
        btnFlag.classList.remove('flagged');
        btnFlag.querySelector('.flag-text').textContent = 'Flag';
      }
    }

    // Update Drill button state & Badge
    updateDrillUI();

    // Render interactive Doc Helper Links under Context Box
    renderDocHelpers(q);

    questionSelect.value = index;
    btnPrev.disabled = (index === 0);
    btnNext.disabled = (index === questions.length - 1);

    taskScrollArea.scrollTop = 0;
  }

  // Render official documentation helper pills under the context box
  function renderDocHelpers(q) {
    if (!q.docs || !Array.isArray(q.docs) || q.docs.length === 0) return;

    const docContainer = document.createElement('div');
    docContainer.className = 'task-docs-container';

    const header = document.createElement('div');
    header.className = 'task-docs-header';
    header.innerHTML = `
      <span class="docs-icon">📖</span>
      <span class="docs-heading">Official Documentation:</span>
    `;
    docContainer.appendChild(header);

    const pillsWrapper = document.createElement('div');
    pillsWrapper.className = 'doc-pills';

    q.docs.forEach((doc) => {
      const btn = document.createElement('button');
      btn.className = 'doc-pill-btn';
      btn.setAttribute('type', 'button');
      btn.setAttribute('data-url', doc.url);
      btn.setAttribute('title', `Open "${doc.title}" in Remote Desktop Firefox`);
      btn.innerHTML = `
        <span class="doc-pill-icon">🌐</span>
        <span class="doc-pill-text">${escapeHtml(doc.title)}</span>
        <span class="doc-pill-badge">↗ Firefox</span>
      `;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dispatchDocUrl(doc.url, doc.title, btn);
      });

      pillsWrapper.appendChild(btn);
    });

    docContainer.appendChild(pillsWrapper);

    // Insert directly below .context-box if present, otherwise prepend to taskBody
    const contextBox = taskBody.querySelector('.context-box');
    if (contextBox && contextBox.nextSibling) {
      taskBody.insertBefore(docContainer, contextBox.nextSibling);
    } else if (contextBox) {
      taskBody.appendChild(docContainer);
    } else {
      taskBody.insertBefore(docContainer, taskBody.firstChild);
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Dispatch documentation URL to Remote Desktop Firefox via backend API
  async function dispatchDocUrl(url, title, btn) {
    if (!url) return;

    btn.classList.add('opening');
    showToast(`Opening in Firefox: ${title}`, '🌐');

    try {
      const response = await fetch(`/api/open-doc?url=${encodeURIComponent(url)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      btn.classList.remove('opening');

      if (response.ok && data.success) {
        btn.classList.add('opened');
        showToast(`Dispatched to Firefox: ${title}`, '✓');
        setTimeout(() => btn.classList.remove('opened'), 1500);
      } else {
        console.error('Doc open failed:', data);
        showToast(`Failed to open doc in Firefox`, '⚠️');
      }
    } catch (err) {
      console.error('Network error dispatching doc URL:', err);
      btn.classList.remove('opening');
      showToast(`Request dispatched: ${title}`, '🌐');
    }
  }

  // 3. Resizer with Mouse-Trap Protection
  function initResizer() {
    resizer.addEventListener('mousedown', (e) => {
      isDragging = true;
      document.body.classList.add('is-dragging');
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const containerRect = splitLayout.getBoundingClientRect();
      let newWidth = e.clientX - containerRect.left;

      const minWidth = 320;
      const maxWidth = containerRect.width - 350;

      if (newWidth < minWidth) newWidth = minWidth;
      if (newWidth > maxWidth) newWidth = maxWidth;

      taskPanel.style.width = `${newWidth}px`;
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove('is-dragging');
      }
    });
  }

  // 4. Click-to-Copy with Visual Feedback
  function initClickToCopy() {
    taskScrollArea.addEventListener('click', (e) => {
      const codeEl = e.target.closest('code');
      if (!codeEl) return;

      const textToCopy = codeEl.innerText.trim();
      if (!textToCopy) return;

      // Trigger immediate visual feedback (animation & toast)
      triggerFeedback(codeEl, textToCopy);

      // Copy text to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy)
          .catch(() => fallbackCopy(textToCopy));
      } else {
        fallbackCopy(textToCopy);
      }
    });
  }

  function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Copy fallback failed:', err);
    }
    document.body.removeChild(textArea);
  }

  function showToast(message, icon = '✓') {
    const toastIcon = toastNotice.querySelector('.toast-icon');
    if (toastIcon) {
      toastIcon.textContent = icon;
    }
    toastText.textContent = message;
    toastNotice.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2400);
  }

  function triggerFeedback(codeEl, text) {
    codeEl.classList.add('copied');
    setTimeout(() => codeEl.classList.remove('copied'), 800);

    const snippet = text.length > 36 ? text.substring(0, 36) + '...' : text;
    showToast(`Copied to clipboard: ${snippet}`, '✓');
  }

  // 5. 120-Minute Exam Countdown Timer with Controls (Pause / Resume / Reset / Edit)
  function initTimer() {
    const DEFAULT_SECONDS = 120 * 60; // 7200s (2 hours)
    let timerSecondsRemaining = DEFAULT_SECONDS;
    let isTimerRunning = true;
    let timerInterval = null;
    let isEditingTimer = false;

    const timerContainer = document.getElementById('timerContainer') || document.querySelector('.timer-container');
    const timerDisplay = document.getElementById('timerDisplay');
    const timerInput = document.getElementById('timerInput');
    const btnTimerToggle = document.getElementById('btnTimerToggle');
    const btnTimerEdit = document.getElementById('btnTimerEdit');
    const btnTimerReset = document.getElementById('btnTimerReset');
    const btnTimerSave = document.getElementById('btnTimerSave');
    const btnTimerCancel = document.getElementById('btnTimerCancel');

    function formatTime(totalSeconds) {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');
      return `${hStr}:${mStr}:${sStr}`;
    }

    function parseTimeInput(inputStr) {
      if (!inputStr) return null;
      const str = inputStr.trim().toLowerCase();

      // Format: XhYm (e.g. 1h30m or 1h)
      const hmMatch = str.match(/^(\d+)h\s*(\d+)?m?$/);
      if (hmMatch) {
        const hours = parseInt(hmMatch[1], 10);
        const mins = hmMatch[2] ? parseInt(hmMatch[2], 10) : 0;
        return (hours * 3600) + (mins * 60);
      }

      // Format: Xm (e.g. 15m, 45m)
      const mMatch = str.match(/^(\d+)m$/);
      if (mMatch) {
        return parseInt(mMatch[1], 10) * 60;
      }

      // Format: plain number (e.g. 15 -> 15 min)
      if (/^\d+$/.test(str)) {
        const val = parseInt(str, 10);
        if (val <= 600) {
          return val * 60;
        }
      }

      // Format: HH:MM:SS or MM:SS
      const parts = str.split(':').map(p => p.trim());
      if (parts.length === 3) {
        const [h, m, s] = parts.map(Number);
        if (!isNaN(h) && !isNaN(m) && !isNaN(s) && m >= 0 && m < 60 && s >= 0 && s < 60) {
          return (h * 3600) + (m * 60) + s;
        }
      } else if (parts.length === 2) {
        const [m, s] = parts.map(Number);
        if (!isNaN(m) && !isNaN(s) && s >= 0 && s < 60) {
          return (m * 60) + s;
        }
      }

      return null;
    }

    function saveTimerState() {
      try {
        const state = {
          secondsRemaining: timerSecondsRemaining,
          isTimerRunning: isTimerRunning,
          savedAt: Date.now()
        };
        localStorage.setItem('cka_exam_timer_state', JSON.stringify(state));
      } catch (e) {}
    }

    function loadTimerState() {
      try {
        const raw = localStorage.getItem('cka_exam_timer_state');
        if (!raw) return false;
        const state = JSON.parse(raw);
        if (typeof state.secondsRemaining === 'number' && state.secondsRemaining >= 0) {
          if (state.isTimerRunning && state.savedAt) {
            const elapsed = Math.floor((Date.now() - state.savedAt) / 1000);
            timerSecondsRemaining = Math.max(0, state.secondsRemaining - elapsed);
          } else {
            timerSecondsRemaining = state.secondsRemaining;
          }
          isTimerRunning = !!state.isTimerRunning;
          return true;
        }
      } catch (e) {}
      return false;
    }

    function renderDisplay() {
      if (!timerDisplay) return;
      timerDisplay.textContent = formatTime(timerSecondsRemaining);

      timerDisplay.classList.remove('warning', 'danger');
      if (timerSecondsRemaining < 900) { // < 15 min
        timerDisplay.classList.add('danger');
      } else if (timerSecondsRemaining < 1800) { // < 30 min
        timerDisplay.classList.add('warning');
      }
    }

    function tick() {
      if (timerSecondsRemaining <= 0) {
        timerSecondsRemaining = 0;
        renderDisplay();
        pauseTimer();
        saveTimerState();
        return;
      }
      timerSecondsRemaining--;
      renderDisplay();
      if (timerSecondsRemaining % 5 === 0) {
        saveTimerState();
      }
    }

    function startTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      isTimerRunning = true;
      if (timerContainer) {
        timerContainer.classList.remove('timer-paused');
      }
      if (btnTimerToggle) {
        btnTimerToggle.textContent = '⏸ Pause';
        btnTimerToggle.setAttribute('title', 'Pause Timer');
      }
      saveTimerState();
      timerInterval = setInterval(tick, 1000);
    }

    function pauseTimer() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      isTimerRunning = false;
      if (timerContainer) {
        timerContainer.classList.add('timer-paused');
      }
      if (btnTimerToggle) {
        btnTimerToggle.textContent = '▶ Resume';
        btnTimerToggle.setAttribute('title', 'Resume Timer');
      }
      saveTimerState();
    }

    function toggleTimer() {
      if (isEditingTimer) return;
      if (isTimerRunning) {
        pauseTimer();
        showToast('Timer paused', '⏸');
      } else {
        if (timerSecondsRemaining <= 0) {
          timerSecondsRemaining = DEFAULT_SECONDS;
        }
        startTimer();
        showToast('Timer resumed', '▶');
      }
    }

    function resetTimer() {
      if (isEditingTimer) exitTimerEditMode();
      timerSecondsRemaining = DEFAULT_SECONDS;
      renderDisplay();
      saveTimerState();

      if (isTimerRunning) {
        startTimer();
      } else {
        if (timerContainer) {
          timerContainer.classList.add('timer-paused');
        }
      }
      showToast('Timer reset to 02:00:00', '↺');
    }

    function enterTimerEditMode() {
      pauseTimer();
      isEditingTimer = true;
      if (timerContainer) timerContainer.classList.add('timer-editing');
      if (timerDisplay) timerDisplay.style.display = 'none';
      if (timerInput) {
        timerInput.style.display = 'inline-block';
        timerInput.value = formatTime(timerSecondsRemaining);
        setTimeout(() => {
          timerInput.focus();
          timerInput.select();
        }, 50);
      }
      if (btnTimerToggle) btnTimerToggle.style.display = 'none';
      if (btnTimerEdit) btnTimerEdit.style.display = 'none';
      if (btnTimerReset) btnTimerReset.style.display = 'none';
      if (btnTimerSave) btnTimerSave.style.display = 'inline-flex';
      if (btnTimerCancel) btnTimerCancel.style.display = 'inline-flex';
    }

    function exitTimerEditMode() {
      isEditingTimer = false;
      if (timerContainer) timerContainer.classList.remove('timer-editing');
      if (timerInput) timerInput.style.display = 'none';
      if (timerDisplay) timerDisplay.style.display = 'inline-block';
      if (btnTimerToggle) btnTimerToggle.style.display = 'inline-flex';
      if (btnTimerEdit) btnTimerEdit.style.display = 'inline-flex';
      if (btnTimerReset) btnTimerReset.style.display = 'inline-flex';
      if (btnTimerSave) btnTimerSave.style.display = 'none';
      if (btnTimerCancel) btnTimerCancel.style.display = 'none';
    }

    function saveTimerEdit() {
      if (!timerInput) return;
      const parsed = parseTimeInput(timerInput.value);
      if (parsed === null || parsed <= 0) {
        showToast('Format ungültig (z. B. 00:15:00, 15m oder 45)', '⚠️');
        timerInput.focus();
        return;
      }
      timerSecondsRemaining = Math.min(parsed, 36000); // max 10h
      exitTimerEditMode();
      renderDisplay();
      saveTimerState();
      showToast(`Timer manuell auf ${formatTime(timerSecondsRemaining)} gesetzt ⏱️`, '⏱️');
    }

    function cancelTimerEdit() {
      exitTimerEditMode();
      showToast('Timer-Bearbeitung abgebrochen', 'ℹ️');
    }

    if (btnTimerToggle) btnTimerToggle.addEventListener('click', toggleTimer);
    if (btnTimerReset) btnTimerReset.addEventListener('click', resetTimer);
    if (btnTimerEdit) btnTimerEdit.addEventListener('click', enterTimerEditMode);
    if (timerDisplay) timerDisplay.addEventListener('click', enterTimerEditMode);
    if (btnTimerSave) btnTimerSave.addEventListener('click', saveTimerEdit);
    if (btnTimerCancel) btnTimerCancel.addEventListener('click', cancelTimerEdit);

    if (timerInput) {
      timerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveTimerEdit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelTimerEdit();
        }
      });
    }

    // Restore state from localStorage or start fresh
    const hasRestoredState = loadTimerState();
    renderDisplay();

    if (hasRestoredState && !isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  // 6. Keyboard Navigation (ArrowLeft / ArrowRight)
  function initKeyboardNav() {
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (currentQuestionIndex > 0) {
          e.preventDefault();
          loadQuestion(currentQuestionIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentQuestionIndex < questions.length - 1) {
          e.preventDefault();
          loadQuestion(currentQuestionIndex + 1);
        }
      }
    });
  }

  // Run all inits
  initDesktopStream();
  initQuestions();
  initResizer();
  initClickToCopy();
  initTimer();
  initKeyboardNav();
});
