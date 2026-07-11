/*
==================================================
MJC Draw / Discard
Version: 6BT v1.23
==================================================
Draw and Discard workflow functions.

Responsibilities:
- Open Draw Tile Screen
- Select drawn tile
- Confirm or cancel draw
- Open Discard Tile Screen
- Select discard tile
- Confirm or cancel discard
- Build Discard Tile Screen display
- Correct Last Entry integration for Draw/Discard

No Mahjong coaching or engine logic belongs in this file.
==================================================
*/

function openDrawScreen() {
  if (gameAction !== "draw") return;

  document.getElementById("tdScreen").classList.add("hidden");
  document.getElementById("hdScreen").classList.add("hidden");
  document.getElementById("discardScreen").classList.add("hidden");
  document.getElementById("drawScreen").classList.remove("hidden");

  showStartingHeader(false);
  applyDisplayOrderToScreens();
  scrollToTopForScreen();
  clearDrawSelection();
  applyCorrectionHighlight("draw");
}

function selectDrawTile(key) {
  if (counts[key] >= 4) {
    showToast("Maximum copies already in hand.");
    return;
  }

  selectedDrawTileKey = key;
  document.querySelectorAll(".draw-tile").forEach(tile => tile.classList.remove("action-selected", "correction-target"));
  document.getElementById("draw-tile-" + key).classList.add("action-selected");

  const btn = document.getElementById("confirmDrawBtn");
  btn.disabled = false;
  btn.classList.add("enabled");
  btn.classList.remove("disabled");
  document.getElementById("drawMeta").textContent = tileLabels[key] + " selected. Press Confirm.";
}

function clearDrawSelection() {
  selectedDrawTileKey = null;
  document.querySelectorAll(".draw-tile").forEach(tile => tile.classList.remove("action-selected"));
  const btn = document.getElementById("confirmDrawBtn");
  if (btn) {
    btn.disabled = true;
    btn.classList.remove("enabled");
    btn.classList.add("disabled");
  }
  const meta = document.getElementById("drawMeta");
  if (meta) meta.textContent = "Enter the tile you drew or claimed.";
}

function confirmDraw() {
  if (!selectedDrawTileKey) {
    showToast("Select a tile first.");
    return;
  }

  if (counts[selectedDrawTileKey] >= 4) {
    showToast("Maximum copies already in hand.");
    return;
  }

  lastActionSnapshot = makeSnapshot();
  lastActionType = "draw";
  lastActionTileKey = selectedDrawTileKey;

  counts[selectedDrawTileKey] += 1;
  lockHandContext();

  phase = "game";
  hdMode = "current";
  gameAction = "discard";
  lastDrawnTileKey = selectedDrawTileKey;
  revisionReturnHDMode = "current";
  revisionTarget = null;
  coachingOn = false;
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  showHD();
}

function cancelDraw() { showHD(); }

function openDiscardScreen() {
  if (gameAction !== "discard") return;

  document.getElementById("tdScreen").classList.add("hidden");
  document.getElementById("hdScreen").classList.add("hidden");
  document.getElementById("drawScreen").classList.add("hidden");
  document.getElementById("discardScreen").classList.remove("hidden");

  showStartingHeader(false);
  updateDiscardContext();
  scrollToTopForScreen();
  selectedDiscardTileKey = null;
  buildDiscardDisplay();
  updateDiscardContext();
  applyCorrectionHighlight("discard");
}

function selectDiscardTile(key) {
  if (counts[key] <= 0) return;

  selectedDiscardTileKey = key;
  document.querySelectorAll(".discard-tile").forEach(tile => tile.classList.remove("action-selected", "correction-target"));

  const target = document.querySelector('.discard-tile[data-key="' + key + '"]');
  if (target) target.classList.add("action-selected");

  const btn = document.getElementById("confirmDiscardBtn");
  btn.disabled = false;
  btn.classList.add("enabled");
  btn.classList.remove("disabled");
  document.getElementById("discardMeta").textContent = tileLabels[key] + " selected. Press Confirm.";
}

function confirmDiscard() {
  if (!selectedDiscardTileKey) {
    showToast("Select a tile first.");
    return;
  }
  if (counts[selectedDiscardTileKey] <= 0) return;

  lastActionSnapshot = makeSnapshot();
  lastActionType = "discard";
  lastActionTileKey = selectedDiscardTileKey;

  counts[selectedDiscardTileKey] -= 1;
  lockHandContext();

  phase = "game";
  hdMode = "current";
  gameAction = "draw";
  lastDrawnTileKey = null;
  revisionReturnHDMode = "current";
  revisionTarget = null;
  coachingOn = false;
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  showHD();
}


function buildDiscardDisplay() {
  // v1.19.6 retained hot-fix:
  // The Discard Tile Screen must include every tile type currently in the hand, including Winds.
  // This function intentionally builds its own ordered group list instead of relying on any
  // Game On display simplification rules.
  const groupMap = {
    chars: { title: "Chars", keys: ["char1","char2","char3","char4","char5","char6","char7","char8","char9"] },
    bams: { title: "Bams", keys: ["bam1","bam2","bam3","bam4","bam5","bam6","bam7","bam8","bam9"] },
    dots: { title: "Dots", keys: ["dot1","dot2","dot3","dot4","dot5","dot6","dot7","dot8","dot9"] },
    winds: { title: "Winds", keys: ["east","south","west","north"] },
    dragons: { title: "Dragons", keys: ["red","green","white"] }
  };

  const suitGroups = [displayOrder.firstSuit, displayOrder.secondSuit, displayOrder.thirdSuit]
    .map(function(groupName) { return groupMap[groupName]; });

  const honorGroups = displayOrder.honorsOrder === "dragonsFirst"
    ? [groupMap.dragons, groupMap.winds]
    : [groupMap.winds, groupMap.dragons];

  const groups = suitGroups.concat(honorGroups);
  let html = "";

  for (const group of groups) {
    let groupHtml = "";

    for (const key of group.keys) {
      const tileCount = counts[key] || 0;
      for (let i = 0; i < tileCount; i++) {
        groupHtml += '<button class="discard-tile" data-key="' + key + '" onclick="selectDiscardTile(\'' + key + '\')">' +
          tileLabels[key] +
          '</button>';
      }
    }

    if (groupHtml !== "") {
      html += '<div class="hand-section">';
      html += '<div class="hand-section-title">' + group.title + '</div>';
      html += groupHtml;
      html += '</div>';
    }
  }

  document.getElementById("discardDisplay").innerHTML =
    html || '<span class="empty-note">No tiles available to discard.</span>';

  selectedDiscardTileKey = null;
  const btn = document.getElementById("confirmDiscardBtn");
  btn.disabled = true;
  btn.classList.remove("enabled");
  btn.classList.add("disabled");
  document.getElementById("discardMeta").textContent = "Enter the tile you discarded.";
}

