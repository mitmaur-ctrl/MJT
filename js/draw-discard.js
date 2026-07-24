/*
==================================================
MJC Draw / Discard
Version: 6BT v1.25
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

function createDrawTile(containerId, label, key) {
  const tile = document.createElement("div");
  tile.className = "tile draw-tile";
  tile.id = "draw-tile-" + key;

  tile.addEventListener("contextmenu", e => e.preventDefault());

  tile.addEventListener("click", function(e) {
    e.preventDefault();
    selectDrawTile(key);
  });

  tile.innerHTML =
    '<div class="tile-name">' + label + '</div>' +
    '<div class="tile-count"></div>';

  document.getElementById(containerId).appendChild(tile);
}

function buildDrawTiles() {
  for (let i = 1; i <= 9; i++) createDrawTile("drawCharacters", i + " Char", "char" + i);
  for (let i = 1; i <= 9; i++) createDrawTile("drawBams", i + " Bam", "bam" + i);
  for (let i = 1; i <= 9; i++) createDrawTile("drawDots", i + " Dot", "dot" + i);

  createDrawTile("drawWinds", "East", "east");
  createDrawTile("drawWinds", "South", "south");
  createDrawTile("drawWinds", "West", "west");
  createDrawTile("drawWinds", "North", "north");

  createDrawTile("drawDragons", "Red", "red");
  createDrawTile("drawDragons", "Green", "green");
  createDrawTile("drawDragons", "White", "white");
}

function claimTile() {
  gameAction = "claim";
  openDrawScreen();
}

function openDrawScreen() {
  if (gameAction !== "draw" && gameAction !== "claim") return;

  document.getElementById("tdScreen").classList.add("hidden");
  document.getElementById("hdScreen").classList.add("hidden");
  document.getElementById("discardScreen").classList.add("hidden");
  document.getElementById("drawScreen").classList.remove("hidden");

  showStartingHeader(false);
  applyDisplayOrderToScreens();
  scrollToTopForScreen();
  clearDrawSelection();
selectedDrawSource = null;

const drawMeta = document.getElementById("drawMeta");
const drawTitle = document.getElementById("drawTitle");

if (drawTitle) {
  drawTitle.textContent =
    gameAction === "claim"
      ? "Claim Tile"
      : "Draw Tile";
}


if (gameAction === "draw") {
  drawMeta.textContent = "Enter the tile you drew.";
} else if (gameAction === "claim") {
  drawMeta.textContent = "Enter the tile you claimed.";
}
  applyCorrectionHighlight(gameAction);
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
  lastActionType = gameAction;
  lastActionSource = gameAction;
  lastActionTileKey = selectedDrawTileKey;

const incomingMeldCandidates =
  findIncomingTileMeldCandidates(
    MJC_STATE.getEngineInput(),
    selectedDrawTileKey
  );

console.log(
  "Incoming meld candidates:",
  incomingMeldCandidates
);



if (
  gameAction === "claim" &&
  incomingMeldCandidates.length === 0
) {
  const mahjongInput =
    MJC_STATE.getEngineInput();

  mahjongInput.counts = {
    ...mahjongInput.counts,
    [selectedDrawTileKey]:
      (mahjongInput.counts[selectedDrawTileKey] || 0) + 1
  };

  const mahjongResult =
    evaluate17TE(mahjongInput);

  if (!mahjongResult.mahjong) {
    showToast(
      "Claim not valid. This tile does not complete a meld."
    );
    return;
  }
}


if (incomingMeldCandidates.length > 1) {
  mmrState = {
  action: gameAction,
  tileKey: selectedDrawTileKey,
  candidates: incomingMeldCandidates,
  recommendedCandidate:
    recommendMMRCandidate(
      MJC_STATE.getEngineInput(),
      selectedDrawTileKey,
      incomingMeldCandidates
    )
};

  console.log(
  "MMR state created:",
  mmrState
);

openMMRDialog();

return;
}
 
 let previousCompleteBoxes = [];

if (gameAction === "claim") {
  const previousResult = evaluate17TE(
    MJC_STATE.getEngineInput()
  );

  previousCompleteBoxes =
    previousResult.completeBoxes;
}

counts[selectedDrawTileKey] += 1;

if (gameAction === "claim") {
  const currentResult = evaluate17TE(
    MJC_STATE.getEngineInput()
  );

  const claimedBoxes =
    getClaimedCompleteBoxes(
      selectedDrawTileKey,
      previousCompleteBoxes,
      currentResult.completeBoxes
    );

  if (claimedBoxes.length === 1) {
    setCompleteBoxVisibility(
      claimedBoxes[0].boxId,
      "exposed"
    );
  }

  if (claimedBoxes.length > 1) {
    console.log(
      "MMR detected:",
      claimedBoxes
    );
  }
}


  lockHandContext();

  phase = "game";
  hdMode = "current";
  gameAction = "discard";
  lastDrawnTileKey = selectedDrawTileKey;
  revisionReturnHDMode = "current";
  revisionTarget = null;  
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  showHD();
}

function resumeMMRAction() {
  if (
    !mmrState ||
    !mmrState.selectedCandidate
  ) {
    return;
  }

  const selectedTileKey =
    mmrState.tileKey;

  counts[selectedTileKey] += 1;

  const result =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  console.log(
    "17TE after MMR selection:",
    result
  );

if (mmrState.action === "claim") {
  const selectedBox =
    result.completeBoxes.find(function(box) {
      return (
        box.type === mmrState.selectedCandidate.type &&
        getCompleteBoxSignature(box) ===
          getCompleteBoxSignature(
            mmrState.selectedCandidate
          )
      );
    });

  if (selectedBox) {
    setCompleteBoxVisibility(
      selectedBox.boxId,
      "exposed"
    );
  }
}

  lockHandContext();

 phase = "game";
hdMode = "current";

if (
  mmrState.selectedCandidate.type === "kang"
) {
  gameAction = "draw";
} else {
  gameAction = "discard";
}

lastDrawnTileKey =
  selectedTileKey;
  revisionReturnHDMode = "current";
  revisionTarget = null; 
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  mmrState = null;

  showHD();
}

function cancelDraw() {
  if (
    correctingLastEntry &&
    cleCancelState
  ) {
    restoreSnapshot(
      cleCancelState.currentState
    );

    lastActionSnapshot =
      cleCancelState.lastActionSnapshot;

    lastActionType =
      cleCancelState.lastActionType;

    lastActionTileKey =
      cleCancelState.lastActionTileKey;

    correctingLastEntry = false;
    correctionTargetTileKey = null;
    correctionActionType = null;
    cleCancelState = null;

    showHD();
    return;
  }

  showHD();
}


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
  if (coachingOn) {
  buildCoachingDiscardDisplay();
} else {
  buildDiscardDisplay();
}
  updateDiscardContext();
  applyCorrectionHighlight("discard");
}

function selectDiscardTile(key, tileElement = null) {
  if (counts[key] <= 0) return;

  selectedDiscardTileKey = key;

  document.querySelectorAll(".discard-tile").forEach(function(tile) {
    tile.classList.remove(
      "action-selected",
      "correction-target"
    );
  });

  const target =
    tileElement ||
    document.querySelector(
      '.discard-tile[data-key="' + key + '"]'
    );

  if (target) {
    target.classList.add("action-selected");
  }

  const btn =
    document.getElementById("confirmDiscardBtn");

  btn.disabled = false;
  btn.classList.add("enabled");
  btn.classList.remove("disabled");

  document.getElementById("discardMeta").textContent =
    tileLabels[key] +
    " selected. Press Confirm.";
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
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  showHD();
}

function buildCoachingDiscardDisplay() {
  const result =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  let html = "";

  /*
  ================================================
  Active Area
  ================================================
  */

  html += '<div class="engine-title">Active Area</div>';

  const activeBoxes = [
    ...result.developingBoxes,
    ...(result.halfEye || [])
  ];

  const firstActiveBoxNumber =
    result.completeBoxes.length + 1;

  activeBoxes.forEach(function(box, index) {
    const boxNumber =
      firstActiveBoxNumber + index;

    const tileHtml =
      box.tiles.map(function(tileKey) {
        return (
          '<button class="discard-tile" ' +
          'data-key="' + tileKey + '" ' +
          'onclick="selectDiscardTile(\'' +
          tileKey +
          '\', this)">' +
          tileLabels[tileKey] +
          '</button>'
        );
      }).join("");

    html +=
      '<div class="hand-section box-card developing-box">' +
        '<div class="hand-section-title">' +
          'Box ' +
          boxNumber +
          ' — ' +
          box.type.toUpperCase() +
        '</div>' +
        tileHtml +
      '</div>';
  });

  const totalBoxes =
    result.completeBoxes.length +
    activeBoxes.length;

  for (
    let boxNumber = totalBoxes + 1;
    boxNumber <= 6;
    boxNumber++
  ) {
    html +=
      '<div class="hand-section box-card empty-box">' +
        '<div class="hand-section-title">' +
          'Box ' + boxNumber +
        '</div>' +
        '<span class="empty-note">Empty</span>' +
      '</div>';
  }

  /*
  ================================================
  Reserves
  ================================================
  */

  html +=
    '<div class="hand-section reserve-area">' +
      '<div class="hand-section-title">Reserves</div>';

  if (
    !result.reserves ||
    result.reserves.length === 0
  ) {
    html +=
      '<span class="empty-note">None</span>';
  } else {
    result.reserves.forEach(function(tileKey) {
  html +=
    '<button class="discard-tile" ' +
    'data-key="' + tileKey + '" ' +
    'onclick="selectDiscardTile(\'' +
    tileKey +
    '\', this)">' +
    tileLabels[tileKey] +
    '</button>';
});
  }

  html += '</div>';

  /*
  ================================================
  Completed Area
  ================================================
  */

  html +=
    '<div class="engine-title">Completed Area</div>';

  result.completeBoxes.forEach(
    function(box, index) {
      const tileHtml =
        box.tiles.map(function(tileKey) {
          return (
            '<button class="discard-tile" ' +
            'data-key="' + tileKey + '" ' +
            'onclick="selectDiscardTile(\'' +
            tileKey +
            '\', this)">' +
            tileLabels[tileKey] +
            '</button>'
          );
        }).join("");

      html +=
        '<div class="hand-section box-card complete-box">' +
          '<div class="hand-section-title">' +
            'Box ' +
            (index + 1) +
            ' — ' +
            box.type.charAt(0).toUpperCase() +
            box.type.slice(1) +
          '</div>' +
          tileHtml +
        '</div>';
    }
  );

  document.getElementById(
    "discardDisplay"
  ).innerHTML = html;

  selectedDiscardTileKey = null;

  const btn =
    document.getElementById(
      "confirmDiscardBtn"
    );

  btn.disabled = true;
  btn.classList.remove("enabled");
  btn.classList.add("disabled");

  document.getElementById(
    "discardMeta"
  ).textContent =
    "Select the tile you want to discard.";
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

function cancelDiscard() { showHD(); }

function showInsightPlaceholder() {
  window.alert("Insight will provide discard recommendations in v2.0.\n\nFor now, continue selecting and confirming your discard.");
}

function showInsightPlaceholder() {
  window.alert("Insight will provide discard recommendations in v2.0.\n\nFor now, continue selecting and confirming your discard.");
}

function correctLastEntry() {
  if (!lastActionSnapshot || !lastActionType) return;

  const action = lastActionType;
  const targetKey = lastActionTileKey;
  const snapshot = lastActionSnapshot;

  cleCancelState = {
    currentState: makeSnapshot(),
    lastActionSnapshot: lastActionSnapshot,
    lastActionType: lastActionType,
    lastActionTileKey: lastActionTileKey
  };

  restoreSnapshot(snapshot);
  lastActionSnapshot = null;
  lastActionType = null;
  lastActionTileKey = null;
  correctingLastEntry = true;
  correctionTargetTileKey = targetKey;
  correctionActionType = action;

  if (action === "draw") {
  showToast("Correct the last draw entry. Red shows the previous entry.");
  openDrawScreen();

} else if (action === "claim") {
  showToast("Correct the last claim entry. Red shows the previous entry.");
  openDrawScreen();

} else if (action === "discard") {
  showToast("Correct the last discard entry. Red shows the previous entry.");
  openDiscardScreen();
}

}

function applyCorrectionHighlight(action) {
  document.querySelectorAll(".correction-target").forEach(function(tile) {
    tile.classList.remove("correction-target");
  });

  if (!correctingLastEntry || correctionActionType !== action || !correctionTargetTileKey) return;

  if (action === "draw" || action === "claim") {
  const tile = document.getElementById(
    "draw-tile-" + correctionTargetTileKey
  );

  if (tile) {
    tile.classList.add("correction-target");
  }
}

  if (action === "discard") {
    const tile = document.querySelector('.discard-tile[data-key="' + correctionTargetTileKey + '"]');
    if (tile) tile.classList.add("correction-target");
  }
}
