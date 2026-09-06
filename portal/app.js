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

  // 2. Initialize Question Navigation & Dropdown
  function initQuestions() {
    questionSelect.innerHTML = '';
    questions.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Question ${q.id} of ${questions.length}: ${q.title} (${q.weight}%)`;
      questionSelect.appendChild(opt);
    });

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

    loadQuestion(0);
  }

  function loadQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentQuestionIndex = index;
    const q = questions[index];

    taskNumber.textContent = `Question ${q.id} of ${questions.length}`;
    taskWeight.textContent = `Weight: ${q.weight}%`;
    taskTitle.textContent = `${q.id}. ${q.title}`;
    taskBody.innerHTML = q.body;

    questionSelect.value = index;
    btnPrev.disabled = (index === 0);
    btnNext.disabled = (index === questions.length - 1);

    taskScrollArea.scrollTop = 0;
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

  function triggerFeedback(codeEl, text) {
    codeEl.classList.add('copied');
    setTimeout(() => codeEl.classList.remove('copied'), 800);

    const snippet = text.length > 36 ? text.substring(0, 36) + '...' : text;
    toastText.textContent = `Copied to clipboard: ${snippet}`;
    toastNotice.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2200);
  }

  // 5. 120-Minute Exam Countdown Timer
  function initTimer() {
    let remainingSeconds = 120 * 60; // 2 hours

    function updateTimer() {
      if (remainingSeconds <= 0) {
        timerDisplay.textContent = '00:00:00';
        timerDisplay.className = 'timer-digits danger';
        return;
      }

      remainingSeconds--;
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;

      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');

      timerDisplay.textContent = `${hStr}:${mStr}:${sStr}`;

      if (remainingSeconds < 900) { // < 15 min
        timerDisplay.className = 'timer-digits danger';
      } else if (remainingSeconds < 1800) { // < 30 min
        timerDisplay.className = 'timer-digits warning';
      } else {
        timerDisplay.className = 'timer-digits';
      }
    }

    // Set initial display
    timerDisplay.textContent = '02:00:00';
    setInterval(updateTimer, 1000);
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
