/*
==================================================
MJC v1.24 TILE ENTRY MODULE
==================================================

Purpose:
- Starting Tile Selection Screen (TSS)
- Tile entry and revision workflows
- Hand Correction Screen (HCS)
- Tile count validation
- Tile selection and clearing
- Tile display updates
- Starting hand acceptance

Dependencies:
- ui-utils.js

Used By:
- index.html
- hand-display.js
- draw-discard.js

Notes:
- Refactor-only module.
- No intended user-visible behavior changes.
- Preserves stable v1.23 tile entry workflow.

==================================================
*/

function getBaseHandSize() {
  return MJC_RULESET_BASE_HAND_SIZES[ruleset] || 16;
}

function getStartingTarget() {
  return role === "dealer" ? getBaseHandSize() + 1 : getBaseHandSize();
}

function isStartingTileSelectionMode() {
  return screenMode === "entry" || screenMode === "revision";
}

function getTileCountValidationMessage(target) {
  return "Your hand must contain exactly " + target + " tiles to proceed.";
}

function getTotal() {
  let total = 0;
  for (const key in counts) total += counts[key];
  return total;
}

function getTarget() {
  if ((screenMode === "revision" || screenMode === "handCorrection") && revisionTarget !== null) return revisionTarget;
  return getStartingTarget();
}

function createTile(containerId, label, key) {
  counts[key] = 0;
  tileLabels[key] = label;

  const tile = document.createElement("div");
  tile.className = "tile";
  tile.id = "tile-" + key;

  tile.addEventListener("contextmenu", e => e.preventDefault());

  tile.addEventListener("pointerdown", function(e) {
    e.preventDefault();
    activeTileKey = key;
    longPressFired = false;

    if (!isStartingTileSelectionMode()) return;

    pressTimer = setTimeout(function() {
      counts[key] = 0;
      longPressFired = true;

      if (screenMode === "revision") revisionTouched = true;

      hideUndo();
      updateDisplay("Tile cleared.");
    }, 650);
  });

  tile.addEventListener("pointerup", function(e) {
    e.preventDefault();
    clearTimeout(pressTimer);

    if (activeTileKey !== key) return;

    if (longPressFired) {
      longPressFired = false;
      activeTileKey = null;
      return;
    }

    cycleTile(key);
    activeTileKey = null;
  });

  tile.addEventListener("pointercancel", function() {
    clearTimeout(pressTimer);
    activeTileKey = null;
  });

  tile.addEventListener("pointerleave", function() {
    clearTimeout(pressTimer);
  });

  tile.innerHTML =
    '<div class="tile-name">' + label + '</div>' +
    '<div class="tile-count" id="count-' + key + '"></div>';

  document.getElementById(containerId).appendChild(tile);
}

function buildTiles() {
  for (let i = 1; i <= 9; i++) createTile("characters", i + " Char", "char" + i);
  for (let i = 1; i <= 9; i++) createTile("bams", i + " Bam", "bam" + i);
  for (let i = 1; i <= 9; i++) createTile("dots", i + " Dot", "dot" + i);

  createTile("winds", "East", "east");
  createTile("winds", "South", "south");
  createTile("winds", "West", "west");
  createTile("winds", "North", "north");

  createTile("dragons", "Red", "red");
  createTile("dragons", "Green", "green");
  createTile("dragons", "White", "white");
}

function cycleTile(key) {
  if (screenMode === "handCorrection") {
    cycleCorrectionTile(key);
    return;
  }

  if (counts[key] >= 4) counts[key] = -1;
  counts[key]++;

  if (screenMode === "revision") revisionTouched = true;

  hideUndo();
  updateDisplay();
}

function cycleCorrectionTile(key) {
  const originalCount = tcsOriginalCounts[key] || 0;
  const addedCount = tcsAddedCounts[key] || 0;

  // TCS rule:
  // Green = original/current hand tile count. One tap clears the entire green count.
  // Unselected = no tile count. One tap starts a new yellow correction count at 1.
  // Yellow = newly added correction count. Repeated taps cycle 1 → 2 → 3 → 4 → clear.
  if (originalCount > 0) {
    tcsOriginalCounts[key] = 0;
    tcsAddedCounts[key] = 0;
    counts[key] = 0;
  } else {
    const nextAddedCount = (addedCount + 1) % 5;
    const nextTotal = getTotal() - addedCount + nextAddedCount;
  // HCS maximum is determined by the current game state.
  // Prepare to Draw  -> Base hand size.
  // Prepare to Discard -> Base hand size + 1.
    const maxHandCount =
      getBaseHandSize() + (gameAction === "discard" ? 1 : 0);

    if (nextAddedCount > addedCount && nextTotal > maxHandCount) {
      updateDisplay("Maximum tiles selected.");
      return;
    }

    tcsAddedCounts[key] = nextAddedCount;
    counts[key] = nextAddedCount;
  }

  revisionTouched = true;
  hideUndo();
  updateDisplay();
}

function initializeCorrectionStateFromCounts() {
  tcsOriginalCounts = {};
  tcsAddedCounts = {};
  for (const key in counts) {
    tcsOriginalCounts[key] = counts[key] || 0;
    tcsAddedCounts[key] = 0;
  }
}

function clearCorrectionState() {
  tcsOriginalCounts = {};
  tcsAddedCounts = {};
}

function updateDisplay(customMessage) {
  let total = 0, chars = 0, bams = 0, dots = 0, winds = 0, dragons = 0;

  for (const key in counts) {
    const value = counts[key];
    total += value;

    document.getElementById("count-" + key).textContent = value === 0 ? "" : value;
    const tileEl = document.getElementById("tile-" + key);
    tileEl.classList.remove("selected", "tcs-original", "tcs-added");
    if (screenMode === "handCorrection") {
      if ((tcsOriginalCounts[key] || 0) > 0) tileEl.classList.add("tcs-original");
      else if ((tcsAddedCounts[key] || 0) > 0) tileEl.classList.add("tcs-added");
    } else {
      tileEl.classList.toggle("selected", value > 0);
    }

    if (key.startsWith("char")) chars += value;
    else if (key.startsWith("bam")) bams += value;
    else if (key.startsWith("dot")) dots += value;
    else if (key === "east" || key === "south" || key === "west" || key === "north") winds += value;
    else dragons += value;
  }

  const target = getTarget();

  document.getElementById("total").textContent = total;
  document.getElementById("target").textContent = target;
  document.getElementById("counterLabel").textContent = screenMode === "handCorrection" ? "Tile Count:" : "Tiles Entered:";
  document.getElementById("targetWrap").classList.toggle("hidden", screenMode === "handCorrection");

  document.getElementById("charsTotal").textContent = chars;
  document.getElementById("bamsTotal").textContent = bams;
  document.getElementById("dotsTotal").textContent = dots;
  document.getElementById("windsTotal").textContent = winds;
  document.getElementById("dragonsTotal").textContent = dragons;

  updateActionButtons(total, target);

  document.getElementById("startingHeaderControls").classList.toggle("correction-header", screenMode === "handCorrection");

  const suggestion = document.getElementById("suggestion");

  if (customMessage) {
    suggestion.textContent = customMessage;
  } else if (screenMode === "handCorrection") {
    suggestion.textContent = "The tiles in your MJC hand are highlighted in green.";
  } else if (isStartingTileSelectionMode() && total === 0) {
    suggestion.textContent = screenMode === "revision"
      ? "Review and revise your hand. Press Play On! when ready."
      : "Verify your settings and tiles. Then press Play On!";
  } else if (isStartingTileSelectionMode() && total === 1 && screenMode === "entry") {
    suggestion.textContent = "Your hand will be organized using Six Box Theory™ (6BT), which may differ from your normal arrangement.";
  } else if (total < target) {
    suggestion.textContent = "Need " + (target - total) + " more tile(s).";
  } else if (total > target) {
    suggestion.textContent = "Too many tiles by " + (total - target) + ".";
  } else {
    suggestion.textContent = screenMode === "revision"
      ? "Revision ready. Press Play On!"
      : "Verify your settings and tiles. Then press Play On!";
  }

  updateWindIcons();
  updateContextControls();
}

function updateActionButtons(total, target) {
  const startBtn = document.getElementById("startBtn");
  const acceptBtn = document.getElementById("acceptBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const cancelCorrectionBtn = document.getElementById("cancelCorrectionBtn");

  if (clearAllBtn) clearAllBtn.classList.toggle("hidden", screenMode === "handCorrection");
  if (cancelCorrectionBtn) cancelCorrectionBtn.classList.toggle("hidden", screenMode !== "handCorrection");
  const longPressTip = document.getElementById("longPressTip");
  if (longPressTip) longPressTip.classList.toggle("hidden", !isStartingTileSelectionMode());

  if (isStartingTileSelectionMode()) {
    startBtn.classList.remove("hidden");
    acceptBtn.classList.add("hidden");

    const startReady = screenMode === "revision" ? true : total === target;
    startBtn.disabled = !startReady;
    startBtn.classList.toggle("enabled", startReady);
    startBtn.classList.toggle("disabled", !startReady);
    // v1.19.6 hot-fix: force the visible state so mobile browser caching/CSS ordering cannot leave Play On gray.
    startBtn.style.backgroundColor = startReady ? "#222" : "#bbb";
    startBtn.style.color = startReady ? "white" : "#666";
  } else {
    startBtn.classList.add("hidden");
    startBtn.style.backgroundColor = "";
    startBtn.style.color = "";
    acceptBtn.classList.remove("hidden");

    const acceptReady = screenMode === "handCorrection" ? true : total === target;
    acceptBtn.disabled = !acceptReady;
    acceptBtn.classList.toggle("enabled", acceptReady);
    acceptBtn.classList.toggle("disabled", !acceptReady);
  }
}

function clearAll() {
  if (getTotal() === 0) return;

  undoSnapshot = makeSnapshot();

  for (const key in counts) counts[key] = 0;

  if (screenMode === "revision" || screenMode === "handCorrection") revisionTouched = true;

  showUndo();
  updateDisplay("Hand cleared.");
}

function undoClear() {
  if (!undoSnapshot) return;
  restoreSnapshot(undoSnapshot);
  hideUndo();
  updateDisplay("Hand restored.");
}

function startHand() {
  const target = getTarget();

  if (getTotal() !== target) {
    updateDisplay(getTileCountValidationMessage(target));
    return;
  }

  phase = "starting";
  hdMode = "starting";
  revisionReturnHDMode = "starting";
  screenMode = "entry";
  revisionTarget = null;
  lastDrawnTileKey = null;
  coachingOn = false;
  contextLocked = false;
  lastActionSnapshot = null;
  lastActionType = null;
  lastActionTileKey = null;
  correctionTargetTileKey = null;
  correctionActionType = null;
  handCorrectionTarget = null;

  gameAction = role === "dealer" ? "discard" : "draw";

  showHD();
}

function acceptRevision() {
  if (screenMode === "handCorrection") {
    hdMode = "current";
    phase = "game";
    revisionReturnHDMode = "current";
    revisionTarget = null;
    handCorrectionTarget = null;
    handCorrectionSnapshot = null;
    clearCorrectionState();
    lastDrawnTileKey = null;
    showToast("Hand correction accepted.");
    showHD();
    return;
  }

  const target = getTarget();
  if (getTotal() !== target) {
    updateDisplay(getTileCountValidationMessage(target));
    return;
  }

  hdMode = revisionReturnHDMode;
  showHD();
}

function reviseHand() {
  if (hdMode !== "starting") return;

  phase = "starting";
  screenMode = "revision";
  revisionTouched = false;
  revisionReturnHDMode = hdMode;
  revisionTarget = getStartingTarget();
  lastDrawnTileKey = null;
  coachingOn = false;
  contextLocked = false;

  document.getElementById("hdScreen").classList.add("hidden");
  document.getElementById("drawScreen").classList.add("hidden");
  document.getElementById("discardScreen").classList.add("hidden");
  document.getElementById("tdScreen").classList.remove("hidden");
  document.getElementById("hcsIntro").classList.add("hidden");
  document.getElementById("startingHeaderControls").classList.remove("correction-header");

  clearCorrectionState();
  showStartingHeader(true);
  applyDisplayOrderToScreens();
  hideUndo();
  updateDisplay("Review and revise your hand. Press Play On! when ready.");
  scrollToTopForScreen();
}

function openHandCorrectionScreen() {
  if (hdMode !== "current") return;

  handCorrectionSnapshot = makeSnapshot();
  handCorrectionTarget = null;
  revisionTarget = null;
  revisionReturnHDMode = "current";
  screenMode = "handCorrection";
  revisionTouched = false;
  initializeCorrectionStateFromCounts();

  document.getElementById("hdScreen").classList.add("hidden");
  document.getElementById("drawScreen").classList.add("hidden");
  document.getElementById("discardScreen").classList.add("hidden");
  document.getElementById("tdScreen").classList.remove("hidden");
  document.getElementById("hcsIntro").classList.remove("hidden");
  document.querySelector("#hcsIntro .hcs-title").textContent = "Hand Correction Screen";
  document.getElementById("hcsMeta").innerHTML = "Tap any tile to adjust its quantity.<br>Correct MJC to match the tiles on your rack.";

  showStartingHeader(true);
  hideUndo();
  applyDisplayOrderToScreens();
  updateDisplay("The tiles in your MJC hand are highlighted in green.");
  scrollToTopForScreen();
}

function cancelHandCorrection() {
  if (!handCorrectionSnapshot) { showHD(); return; }
  restoreSnapshot(handCorrectionSnapshot);
  handCorrectionSnapshot = null;
  clearCorrectionState();
  hdMode = "current";
  phase = "game";
  revisionReturnHDMode = "current";
  revisionTarget = null;
  handCorrectionTarget = null;
  showToast("Hand correction cancelled.");
  showHD();
}


