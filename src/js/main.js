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
}

function printConsoleArt() {
  const consoleStr = `Hello There!`;
  console.log(consoleStr);
}
