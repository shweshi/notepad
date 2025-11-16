var default_text =
  "Enter or paste your text here. To download and save it, click on the Download button.";

function clearText() {
  quill.root.innerHTML = "";
}

function undo() {
  quill.history.undo();
}

function redo() {
  quill.history.redo();
}

function download() {
  var text = quill.root.innerHTML;
  var blob = new Blob([text], { type: "text/html" });
  var anchor = document.createElement("a");
  anchor.download = "text.editpad";
  anchor.href = window.URL.createObjectURL(blob);
  anchor.target = "_blank";
  anchor.style.display = "none"; // just to be safe!
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

function toggleDayNight() {
  applyDarkMode();

  if (localStorage.getItem("dark-mode") === "true") {
    localStorage.setItem("dark-mode", false);
    document.getElementById("day").style.display = "initial";
    document.getElementById("night").style.display = "none";
  } else {
    localStorage.setItem("dark-mode", true);
    document.getElementById("night").style.display = "initial";
    document.getElementById("day").style.display = "none";
  }
}

function checkDarkMode() {
  var darkMode = localStorage.getItem("dark-mode");
  if (darkMode === "true") {
    applyDarkMode();
    document.getElementById("night").style.display = "initial";
    document.getElementById("day").style.display = "none";
  } else {
    document.getElementById("day").style.display = "initial";
    document.getElementById("night").style.display = "none";
  }
}

function applyDarkMode() {
  document.getElementById("editor").classList.toggle("dark-mode-editor");
  document.getElementById("topbar").classList.toggle("dark-mode-topbar");
  document.getElementById("toolbar").classList.toggle("dark-mode-toolbar");
  document.getElementById("navbar").classList.toggle("dark-mode-navbar");
  var tabsEl = document.getElementById("tabs");
  if (tabsEl) tabsEl.classList.toggle("dark-mode-topbar");
}

function printConsoleArt() {
  const consoleStr = `Hello There!`;
  console.log(consoleStr);
}

(function () {
  function debounce(fn, delay) {
    var t;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args) }, delay);
    }
  }

  var TAB_STORAGE_KEY = "tabs.v1";
  var ACTIVE_TAB_KEY = "activeTabId.v1";
  var state = {
    tabs: [],
    activeId: null,
    els: { list: null, add: null }
  };

  function loadState() {
    try { state.tabs = JSON.parse(localStorage.getItem(TAB_STORAGE_KEY)) || []; } catch (e) { state.tabs = []; }
    state.activeId = localStorage.getItem(ACTIVE_TAB_KEY) || (state.tabs[0] && state.tabs[0].id) || null;
  }

  function saveTabs() {
    localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(state.tabs));
  }

  function saveActive() {
    if (!state.activeId) return;
    var t = state.tabs.find(function (x) { return x.id === state.activeId });
    if (!t) return;
    if (typeof quill !== 'undefined') {
      t.html = quill.root.innerHTML;
      var text = quill.getText().trim();
      var auto = text.split("\n")[0] || "Untitled";
      if (auto.length > 30) auto = auto.slice(0, 30) + "…";
      if (!t.manualTitle) t.title = auto || t.title || "Untitled";
    }
    saveTabs();
  }

  var debouncedSave = debounce(saveActive, 500);

  function createTab(title, html) {
    var id = (typeof uuid !== 'undefined' && uuid.v4) ? uuid.v4() : (Date.now() + "" + Math.random());
    var t = { id: id, title: title || "Untitled", html: html || "", manualTitle: !!title };
    state.tabs.push(t);
    state.activeId = id;
    localStorage.setItem(ACTIVE_TAB_KEY, state.activeId);
    saveTabs();
    render();
    loadIntoEditor(id);
  }

  function closeTab(id) {
    var idx = state.tabs.findIndex(function (x) { return x.id === id });
    if (idx < 0) return;
    var wasActive = state.activeId === id;
    state.tabs.splice(idx, 1);
    if (state.tabs.length === 0) {
      createTab();
    } else if (wasActive) {
      var next = state.tabs[idx] || state.tabs[idx - 1] || state.tabs[0];
      state.activeId = next.id;
      localStorage.setItem(ACTIVE_TAB_KEY, state.activeId);
      loadIntoEditor(state.activeId);
    }
    saveTabs();
    render();
  }

  function switchTab(id) {
    if (state.activeId === id) return;
    saveActive();
    state.activeId = id;
    localStorage.setItem(ACTIVE_TAB_KEY, state.activeId);
    loadIntoEditor(id);
    render();
  }

  function loadIntoEditor(id) {
    var t = state.tabs.find(function (x) { return x.id === id });
    if (!t || typeof quill === 'undefined') return;
    quill.root.innerHTML = '';
    quill.clipboard.dangerouslyPasteHTML(0, t.html || '');
    quill.setSelection(0);
  }

  function render() {
    if (!state.els.list) return;
    state.els.list.innerHTML = '';
    state.tabs.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'tab' + (t.id === state.activeId ? ' active' : '');
      b.setAttribute('data-id', t.id);
      var titleSpan = document.createElement('span');
      titleSpan.className = 'title';
      titleSpan.textContent = t.title || 'Untitled';
      titleSpan.addEventListener('dblclick', function (e) {
        e.stopPropagation();
        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'title-input';
        input.value = t.title || 'Untitled';
        var commit = function (save) {
          if (!save) { render(); return; }
          var v = (input.value || '').trim() || 'Untitled';
          if (v.length > 50) v = v.slice(0, 50);
          t.title = v;
          t.manualTitle = true;
          saveTabs();
          render();
        };
        input.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') commit(true);
          if (ev.key === 'Escape') commit(false);
        });
        input.addEventListener('blur', function () { commit(true); });
        b.replaceChild(input, titleSpan);
        input.focus();
        input.select();
      });
      var close = document.createElement('span');
      close.className = 'close';
      close.textContent = '×';
      close.addEventListener('click', function (e) {
        e.stopPropagation();
        var title = t.title || 'this tab';
        var ok = window.confirm('Close "' + title + '"? This will permanently remove its content from this browser.');
        if (ok) closeTab(t.id);
      });
      b.addEventListener('click', function () { switchTab(t.id); });
      b.appendChild(titleSpan);
      b.appendChild(close);
      state.els.list.appendChild(b);
    });
  }

  function bindQuill() {
    if (typeof quill === 'undefined') return;
    quill.on('text-change', function () { debouncedSave(); });
  }

  function ensureInitial() {
    if (!state.tabs || state.tabs.length === 0) {
      createTab();
    } else {
      render();
      loadIntoEditor(state.activeId);
    }
  }

  function initTabs() {
    state.els.list = document.getElementById('tab-list');
    state.els.add = document.getElementById('add-tab');
    if (state.els.add) { state.els.add.addEventListener('click', function () { saveActive(); createTab(); }); }
    loadState();
    bindQuill();
    ensureInitial();
  }

  window.initTabs = initTabs;
})();

(function(){
  var pomodoro = {
    mode: 'focus',
    durations: { focus: 25*60, short: 5*60, long: 15*60 },
    remaining: 25*60,
    interval: null,
    running: false
  };

  function formatTime(sec){
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec/60);
    var s = sec%60;
    return (m<10?""+m:m)+":"+(s<10?"0"+s:s);
  }

  function qs(id){ return document.getElementById(id); }

  function updateNavbarTimer(){
    var badge = document.getElementById('focus-timer');
    if (!badge) return;
    if (pomodoro.running){
      badge.textContent = formatTime(pomodoro.remaining);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function updateDisplay(){
    var el = qs('pomodoro-timer');
    if (el) el.textContent = formatTime(pomodoro.remaining);
    updateNavbarTimer();
  }

  function pomodoroEditTimer(){
    var el = qs('pomodoro-timer');
    if (!el || el.dataset.editing === '1') return;
    el.dataset.editing = '1';
    var origSecs = pomodoro.durations[pomodoro.mode] || pomodoro.remaining;
    var startVal = formatTime(origSecs);
    var input = document.createElement('input');
    input.type = 'text';
    input.value = startVal;
    input.style.width = '140px';
    input.style.fontSize = 'inherit';
    input.style.fontWeight = 'inherit';
    input.style.textAlign = 'center';
    var commit = function(save){
      delete el.dataset.editing;
      var newSecs = origSecs;
      if (save){
        var v = (input.value || '').trim();
        var mins = null, secs = 0;
        if (/^\d+:\d{1,2}$/.test(v)){
          var parts = v.split(':');
          mins = parseInt(parts[0], 10);
          secs = parseInt(parts[1], 10);
          if (!isFinite(mins) || !isFinite(secs)) mins = null;
        } else if (/^\d+$/.test(v)){
          mins = parseInt(v, 10);
        }
        if (mins != null){
          if (mins < 1) mins = 1; if (mins > 180) mins = 180;
          if (secs < 0) secs = 0; if (secs > 59) secs = 59;
          newSecs = (mins*60) + secs;
        }
      }
      el.replaceChild(span, input);
      pomodoro.durations[pomodoro.mode] = newSecs;
      if (!pomodoro.running){
        pomodoro.remaining = newSecs;
      }
      updateDisplay();
    };
    var span = document.createElement('span');
    span.textContent = el.textContent;
    el.textContent = '';
    el.appendChild(input);
    input.focus();
    input.select();
    input.addEventListener('keydown', function(e){
      if (e.key === 'Enter') commit(true);
      if (e.key === 'Escape') commit(false);
    });
    input.addEventListener('blur', function(){ commit(true); });
  }

  function highlightMode(){
    var buttons = document.querySelectorAll('.pomodoro-mode');
    buttons.forEach(function(b){
      if (b.getAttribute('data-mode') === pomodoro.mode) b.classList.add('active');
      else b.classList.remove('active');
    });
  }

  function tick(){
    pomodoro.remaining -= 1;
    updateDisplay();
    if (pomodoro.remaining <= 0){
      clearInterval(pomodoro.interval); pomodoro.interval = null; pomodoro.running = false;
      updateNavbarTimer();
      try { if (window.Notification && Notification.permission === 'granted') new Notification('Time\'s up!'); } catch(e){}
      if (document.hidden && typeof document.title === 'string') { var orig = document.title; document.title = '⏰ Time\'s up!'; setTimeout(function(){ document.title = orig; }, 4000); }
      alert("Time's up!");
    }
  }

  function setMode(mode){
    pomodoro.mode = mode;
    pomodoro.remaining = pomodoro.durations[mode];
    updateDisplay();
    highlightMode();
  }

  function start(){
    if (pomodoro.running) return;
    pomodoro.running = true;
    updateNavbarTimer();
    if (!pomodoro.interval) pomodoro.interval = setInterval(tick, 1000);
  }

  function pause(){
    pomodoro.running = false;
    if (pomodoro.interval){ clearInterval(pomodoro.interval); pomodoro.interval = null; }
    updateNavbarTimer();
  }

  function reset(){
    pause();
    pomodoro.remaining = pomodoro.durations[pomodoro.mode];
    updateDisplay();
    updateNavbarTimer();
  }

  function toggle(show){
    var modal = qs('pomodoro-modal');
    if (!modal) return;
    var shouldShow = typeof show === 'boolean' ? show : modal.classList.contains('hidden');
    if (shouldShow){
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      highlightMode();
      updateDisplay();
      try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch(e){}
    } else {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  window.togglePomodoro = toggle;
  window.pomodoroSwitch = setMode;
  window.pomodoroStart = start;
  window.pomodoroPause = pause;
  window.pomodoroReset = reset;
  window.pomodoroEditTimer = pomodoroEditTimer;
})();
