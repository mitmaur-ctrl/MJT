/*
==================================================
MJC Hand Display
Version: 6BT v1.25
==================================================
Hand Display presentation functions.

Responsibilities:
- Configure Starting and Current Hand Displays
- Build Hand Display content
- Build Current Hand Display
- Build Starting Hand Display
- Tile group ordering for display

No game engine logic belongs in this file.
==================================================
*/

function getTileGroups() {
  const groupMap = MJC_TILE_GROUP_DEFINITIONS;

  const suitGroups = [displayOrder.firstSuit, displayOrder.secondSuit, displayOrder.thirdSuit].map(s => groupMap[s]);
  const honorGroups = displayOrder.honorsOrder === "dragonsFirst"
    ? [groupMap.dragons, groupMap.winds]
    : [groupMap.winds, groupMap.dragons];

  return suitGroups.concat(honorGroups);
}

function buildStartingHandDisplay() {
  const groups = getTileGroups();
  let html = "";

  for (const group of groups) {
    let groupHtml = "";

    for (const key of group.keys) {
      for (let i = 0; i < counts[key]; i++) {
        groupHtml += '<span class="hand-tile">' + tileLabels[key] + '</span>';
      }
    }

    if (groupHtml !== "") {
      html += '<div class="hand-section">';
      html += '<div class="hand-section-title">' + group.title + '</div>';
      html += groupHtml;
      html += '</div>';
    }
  }

  document.getElementById("handDisplay").innerHTML = html || "No tiles selected.";
}

function buildCurrentHandDisplay() {
  const groups = getTileGroups();

  let looseHtml = "";
  let drawnHighlightUsed = false;

  for (const group of groups) {
    let groupHtml = "";

    for (const key of group.keys) {
      for (let i = 0; i < counts[key]; i++) {
        const isLastDrawn = key === lastDrawnTileKey && !drawnHighlightUsed;

        groupHtml += '<span class="hand-tile' + (isLastDrawn ? ' last-drawn' : '') + '">' +
          tileLabels[key] +
          '</span>';

        if (isLastDrawn) drawnHighlightUsed = true;
      }
    }

    if (groupHtml !== "") {
      looseHtml += '<div class="hand-section">';
      looseHtml += '<div class="hand-section-title">' + group.title + '</div>';
      looseHtml += groupHtml;
      looseHtml += '</div>';
    }
  }

  let html = "";

  html += '<div class="hand-section">';
  html += '<div class="hand-section-title">Loose Tiles (' + getTotal() + ')</div>';
  html += looseHtml || '<span class="empty-note">No loose tiles entered.</span>';
  html += '</div>';

  html += '<div class="hand-section">';
  html += '<div class="hand-section-title">Hidden Melds</div>';
  html += '<span class="empty-note">None yet</span>';
  html += '</div>';

  html += '<div class="hand-section">';
  html += '<div class="hand-section-title">Exposed Melds</div>';
  html += '<span class="empty-note">None yet</span>';
  html += '</div>';

  document.getElementById("handDisplay").innerHTML = html;
}

function buildHandDisplay() {
  if (hdMode === "current") buildCurrentHandDisplay();
  else buildStartingHandDisplay();
}

function configureHDMode() {
  const handTitle = document.getElementById("handTitle");
  const handMeta = document.getElementById("handMeta");
  const handInstruction = document.getElementById("handInstruction");
  const reviseBtn = document.getElementById("reviseBtn");
  const drawBtn = document.getElementById("drawBtn");
  const discardBtn = document.getElementById("discardBtn");
  const coachingBtn = document.getElementById("coachingBtn");
  const correctLastBtn = document.getElementById("correctLastBtn");
  const handCorrectionBtn = document.getElementById("handCorrectionBtn");
  const startingUtilityRow = document.getElementById("startingUtilityRow");
  const currentCorrectionRow = document.getElementById("currentCorrectionRow");
  const newGameRow = document.getElementById("newGameRow");
  const enginePanel = document.getElementById("enginePanel");

  const total = getTotal();
  const setupContext = "Seat: " + getWindLabel(seatWind) +
    " | Round: " + getWindLabel(prevailingWind);

  enginePanel.classList.toggle("hidden", !coachingOn);

  drawBtn.classList.remove("hidden");
  discardBtn.classList.remove("hidden");
  reviseBtn.classList.remove("hidden");
  coachingBtn.classList.remove("hidden");
  correctLastBtn.classList.remove("hidden");
  handCorrectionBtn.classList.remove("hidden");

  const canDraw = gameAction === "draw";
  const canDiscard = gameAction === "discard";

  drawBtn.disabled = !canDraw;
  discardBtn.disabled = !canDiscard;

  drawBtn.classList.toggle("enabled", canDraw);
  drawBtn.classList.toggle("disabled", !canDraw);

  discardBtn.classList.toggle("enabled", canDiscard);
  discardBtn.classList.toggle("disabled", !canDiscard);

  startingUtilityRow.classList.remove("hidden");
  reviseBtn.classList.toggle("hidden", hdMode !== "starting");
  correctLastBtn.classList.toggle("hidden", hdMode !== "current");
  currentCorrectionRow.classList.toggle("hidden", hdMode !== "current");
  correctLastBtn.disabled = !(hdMode === "current" && lastActionSnapshot);
  correctLastBtn.classList.toggle("disabled", !(hdMode === "current" && lastActionSnapshot));
  handCorrectionBtn.disabled = hdMode !== "current";
  newGameRow.classList.add("hidden");

  if (hdMode === "starting") {
    handTitle.textContent = "Starting Hand";
  
  if (coachingOn) {
    handInstruction.innerHTML =
        "Here's your hand organized using Six Box Theory™.<br>" +
        (gameAction === "draw"
            ? "Prepare to Draw. Press Draw when ready."
            : "Prepare to Discard. Press Discard when ready.");
} else {
    handInstruction.textContent =
        gameAction === "draw"
            ? "Prepare to Draw. Press Draw when ready."
            : "Prepare to Discard. Press Discard when ready.";
}
    handInstruction.classList.remove("hidden");
    handMeta.textContent =
      "Role: " + (role === "dealer" ? "Dealer" : "Player") +
      " | Tiles: " + total +
      " | " + setupContext;

    coachingBtn.textContent = coachingOn ? "Standard View" : "Coaching View";
    return;
  }

  handTitle.textContent = "Current Hand";
  handMeta.textContent = "";
  handInstruction.textContent = gameAction === "draw" ? "Prepare to Draw. Press Draw when ready." : "Prepare to Discard. Press Discard when ready.";
  handInstruction.classList.remove("hidden");

}

function toggleCoaching() {
  coachingOn = !coachingOn;

  const coachingBtn = document.getElementById("coachingBtn");
  const enginePanel = document.getElementById("enginePanel");

  coachingBtn.textContent = coachingOn ? "Standard View" : "Coaching View";
  enginePanel.classList.toggle("hidden", !coachingOn);

  configureHDMode();

  if (coachingOn) showToast("Coaching display coming in V2.");
}

function showHD() {
  document.getElementById("tdScreen").classList.add("hidden");
  document.getElementById("drawScreen").classList.add("hidden");
  document.getElementById("discardScreen").classList.add("hidden");
  document.getElementById("hdScreen").classList.remove("hidden");
  document.getElementById("hcsIntro").classList.add("hidden");

  showStartingHeader(false);
  screenMode = "entry";
  document.getElementById("startingHeaderControls").classList.remove("correction-header");
  clearCorrectionState();

  clearDrawSelection();
  selectedDiscardTileKey = null;
  correctionTargetTileKey = null;
  correctionActionType = null;

  configureHDMode();
  buildHandDisplay();
  scrollToTopForScreen();
}

