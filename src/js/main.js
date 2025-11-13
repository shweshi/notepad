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
