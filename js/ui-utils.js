/*
==================================================
MJC UI Utilities
Version: 6BT v1.23
==================================================
Shared user interface utility functions.

These functions support:
- Header visibility
- Layout adjustments
- Screen positioning
- Toast messages
- Undo row visibility

No Mahjong game logic belongs in this file.
==================================================
*/

function adjustContainerPadding() {
  const header = document.getElementById("fixedHeader");
  if (!header) return;
  document.documentElement.style.setProperty("--header-height", header.offsetHeight + "px");
}

function scrollToTopForScreen() {
  setTimeout(function() { window.scrollTo(0, 0); }, 0);
  setTimeout(function() { window.scrollTo(0, 0); }, 60);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");


  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.add("hidden");
  }, 1600);
}

function showStartingHeader(show) {
  document.getElementById("startingHeaderControls").classList.toggle("hidden", !show);
  document.getElementById("mainContainer").classList.toggle("compact", !show);
  setTimeout(adjustContainerPadding, 0);
}

function showUndo() { document.getElementById("undoRow").classList.remove("hidden"); }
function hideUndo() { document.getElementById("undoRow").classList.add("hidden"); }
