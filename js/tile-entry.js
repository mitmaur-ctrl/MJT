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

    if (
  !isStartingTileSelectionMode() &&
  screenMode !== "handCorrection"
) return;

    pressTimer = setTimeout(function() {
  counts[key] = 0;

  if (screenMode === "handCorrection") {
    tcsOriginalCounts[key] = 0;
    tcsAddedCounts[key] = 0;
  }

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
  const isHonorTile =
      key === "east" ||
      key === "south" ||
      key === "west" ||
      key === "north" ||
      key === "red" ||
      key === "green" ||
      key === "white";

  const honorsDisabled =
    ruleset === "filipino16" &&
    document.querySelector(
      'input[name="filipinoHonorRadio"]:checked'
    )?.value === "disabled";

  if (honorsDisabled && isHonorTile) {
    return;
  }

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
  fhValidationMessage = null;
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
const isHonorTile =
  key === "east" ||
  key === "south" ||
  key === "west" ||
  key === "north" ||
  key === "red" ||
  key === "green" ||
  key === "white";

const honorsDisabled =
  ruleset === "filipino16" &&
  document.querySelector(
    'input[name="filipinoHonorRadio"]:checked'
  )?.value === "disabled";

tileEl.disabled =
  honorsDisabled && isHonorTile;

tileEl.classList.toggle(
  "honor-disabled",
  honorsDisabled && isHonorTile
);

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

  document.getElementById("counterLabel").textContent =
  screenMode === "handCorrection"
    ? "Free Tiles:"
    : "Tiles Entered:";
document.getElementById("targetWrap").classList.toggle("hidden", screenMode === "handCorrection");

  document.getElementById("charsTotal").textContent = chars;
  document.getElementById("bamsTotal").textContent = bams;
  document.getElementById("dotsTotal").textContent = dots;
  document.getElementById("windsTotal").textContent = winds;
  document.getElementById("dragonsTotal").textContent = dragons;

  updateActionButtons(total, target);

  document.getElementById("startingHeaderControls").classList.toggle("correction-header", screenMode === "handCorrection");

  const suggestion = document.getElementById("suggestion");


if (screenMode === "handCorrection") {
  const activeFHMelds =
    fhMelds.filter(function(box) {
      return box.visibility !== "remove";
    });

  const activeMeldCount = activeFHMelds.length;

  const extraMeldTiles =
    activeFHMelds.filter(function(box) {
      return box.type === "kang" || box.type === "news";
    }).length;

  const physicalMeldTileCount =
    activeFHMelds.reduce(function(sum, box) {
      return sum + box.tiles.length;
    }, 0);

  const baseTarget =
    getBaseHandSize() +
    (fhTurnCycle === "discard" ? 1 : 0);

  const physicalTarget =
    baseTarget + extraMeldTiles;

  const fhStickyAccounting =
    document.getElementById("fhStickyAccounting");

  if (fhStickyAccounting) {
    fhStickyAccounting.classList.remove("hidden");
  }

  const fhTileTarget =
    document.getElementById("fhTileTarget");

  if (fhTileTarget) {
    fhTileTarget.textContent = physicalTarget;
  }

const fhMeldedTiles =
  document.getElementById("fhMeldedTiles");

if (fhMeldedTiles) {
  fhMeldedTiles.textContent = physicalMeldTileCount;
}

if (fhStickyAccounting) {
  if (fhValidationMessage) {
  fhStickyAccounting.innerHTML =
    '<span style="color:#b00020; font-weight:700;">' +
    '⚠ ' + fhValidationMessage +
    '</span>';
} else {
    fhStickyAccounting.innerHTML =
      'Tile Target: <span id="fhTileTarget">' +
      physicalTarget +
      '</span> | Melded Tiles: <span id="fhMeldedTiles">' +
      physicalMeldTileCount +
      '</span>';
  }
}

  const remainingTilesNeeded =
    physicalTarget - physicalMeldTileCount;

document.getElementById("total").textContent =
  total + " of " + remainingTilesNeeded;

const stickyTarget =
  document.getElementById("target");

if (stickyTarget) {
  stickyTarget.textContent =
    physicalTarget + " | Melded Tiles: " + physicalMeldTileCount;
}

const actionText =
  fhTurnCycle === "discard"
    ? "Preparing to Discard"
    : "Preparing to Draw";

const guidance =
  actionText +
  ", your Tile Target is " +
  physicalTarget +
  "." +

  (extraMeldTiles > 0
  ? " This includes " +
    extraMeldTiles +
    " extra " +
    (extraMeldTiles === 1 ? "tile" : "tiles") +
    " for " +
extraMeldTiles +
" " +
 
    activeFHMelds
      .filter(function(box) {
        return box.type === "kang" || box.type === "news";
      })
      .map(function(box) {
        return box.type === "news" ? "NEWS" : "Kang";
      })
      .join(extraMeldTiles === 2 ? " and " : ", ") +
    (extraMeldTiles === 1 ? " meld." : " melds.")
  : "") +

  "\nYour " +
  activeMeldCount +
  " " +
  (activeMeldCount === 1 ? "meld contains " : "melds contain ") +
  physicalMeldTileCount +
  " Melded " +
  (physicalMeldTileCount === 1 ? "Tile." : "Tiles.") +
 "\nEnter " +
remainingTilesNeeded +
" Free " +
(remainingTilesNeeded === 1 ? "Tile" : "Tiles") +
" to complete your hand.";

  const fhAccountingMessage =
  document.getElementById("fhAccountingMessage");

if (fhAccountingMessage) {
  fhAccountingMessage.textContent =
    customMessage
      ? guidance + "\n" + customMessage
      : guidance;
}

suggestion.textContent = "";

} else {
  const fhStickyAccounting =
    document.getElementById("fhStickyAccounting");

  if (fhStickyAccounting) {
    fhStickyAccounting.classList.add("hidden");
  }

  if (customMessage) {

  suggestion.textContent = customMessage;

  } else if (isStartingTileSelectionMode() && total === 0) {
    suggestion.textContent = screenMode === "revision"
      ? "Review and revise your hand. \nPress Play On! when ready."
      : "Verify your settings and tile selection. \nThen press Play On!";
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


// ==================================================
// GAME TRANSCRIPT
// ==================================================

let gameTranscript = {
  initialTiles: [],
  actions: []
};

let fhTranscriptBefore = null;

function makeFHTranscriptSnapshot(tileCounts, melds, turnCycle) {
  const tiles = [];

  for (const key in tileCounts) {
    for (let i = 0; i < (tileCounts[key] || 0); i++) {
      tiles.push(key);
    }
  }

  return {
    tiles: tiles,
    melds: melds.map(function(box) {
      return {
        type: box.type,
        tiles: [...box.tiles],
        visibility: box.visibility
      };
    }),
    turnCycle: turnCycle
  };
}

function captureInitialTiles() {
  if (gameTranscript.initialTiles.length > 0) return;

  const initialTiles = [];

  for (const key in counts) {
    for (let i = 0; i < counts[key]; i++) {
      initialTiles.push(key);
    }
  }

  gameTranscript.initialTiles = initialTiles;
}

function recordGameAction(type, tileKey) {
  gameTranscript.actions.push({
    type: type,
    tileKey: tileKey
  });
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
  coachingOn = true;
  contextLocked = false;
  handStarted = true;
  playerDiscardCount = 0;
  lastActionSnapshot = null;
  lastActionType = null;
  lastActionTileKey = null;
  correctionTargetTileKey = null;
  correctionActionType = null;
  handCorrectionTarget = null;

  gameAction = role === "dealer" ? "discard" : "draw";

  showHD();
}

let fhValidationMessage = null;
function acceptRevision() {
  if (screenMode === "handCorrection") {

  const activeFHMelds =
    fhMelds.filter(function(box) {
      return box.visibility !== "remove";
    });

  const activeMeldCount = activeFHMelds.length;

  const expectedRackCount =
    getBaseHandSize() -
    (activeMeldCount * 3) +
    (fhTurnCycle === "discard" ? 1 : 0);

  const actualRackCount = getTotal();

  if (actualRackCount !== expectedRackCount) {
    const difference =
      Math.abs(expectedRackCount - actualRackCount);

    const message =
      actualRackCount < expectedRackCount
        ? "Enter " + difference + " more tile(s) before accepting."
        : "Remove " + difference + " tile(s) before accepting.";

    updateDisplay(message);
    return;
  }

const physicalTileCounts = {};

for (const key in counts) {
  physicalTileCounts[key] = counts[key] || 0;
}

activeFHMelds.forEach(function(box) {
  box.tiles.forEach(function(tileKey) {
    physicalTileCounts[tileKey] =
      (physicalTileCounts[tileKey] || 0) + 1;
  });
});

for (const tileKey in physicalTileCounts) {

  if (physicalTileCounts[tileKey] > 4) {
  fhValidationMessage =
    "More than four " +
    tileLabels[tileKey] +
    " tiles. Correct your hand.";

  updateDisplay();
  return;
}

}

mmrCommittedBoxes =
  activeFHMelds.map(function(box) {
    return {
      action: "fix-hand",
      tileKey:
        box.tiles && box.tiles.length > 0
          ? box.tiles[0]
          : null,
      candidate: {
        type: box.type,
        tiles: [...box.tiles],
        visibility: box.visibility
      }
    };
  });

activeFHMelds.forEach(function(box) {
  box.tiles.forEach(function(tileKey) {
    counts[tileKey] += 1;
  });
});

const fhTranscriptAccepted =
  makeFHTranscriptSnapshot(
    counts,
    activeFHMelds,
    fhTurnCycle
  );

gameTranscript.actions.push({
  type: "FH",
  before: fhTranscriptBefore,
  accepted: fhTranscriptAccepted
});

fhTranscriptBefore = null;

    hdMode = "current";
    phase = "game";
    revisionReturnHDMode = "current";
    revisionTarget = null;
    handCorrectionTarget = null;
    handCorrectionSnapshot = null;
    clearCorrectionState();
    lastDrawnTileKey = null;
    gameAction = fhTurnCycle;
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
  coachingOn = true;
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

// ==================================================
// FIX HAND — MELD BUILDER
// ==================================================

let fhMeldBuilderType = null;
let fhMelds = [];
function initializeFHMelds() {
  const result =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  const structureState =
    result.structureState || result;

  const completeBoxes =
    structureState.completeBoxes || [];

  fhMelds = completeBoxes.map(function(box) {
    return {
      boxId: box.boxId,
      source: "existing",
      type: box.type,    
      tiles: [...box.tiles],
      visibility:
        box.visibility === "exposed"
          ? "exposed"
          : "hidden"
    };
  });
}


function openFHMeldBuilder() {
  fhMeldBuilderType = null;

  const builder =
    document.getElementById("fhMeldTypeBuilder");

  if (builder) {
    builder.innerHTML = "";
  }

  document
    .getElementById("fhMeldBuilder")
    .classList.remove("hidden");

  const newsButton =
    document.getElementById("fhMeldTypeNEWS");

  if (newsButton) {
    const context = MJC_STATE.getContext();

    const showNEWS =
      context.ruleset === "filipino16" &&
      context.newsAllowed === true;

    newsButton.classList.toggle("hidden", !showNEWS);
  }
}

function selectFHMeldType(type) {
  fhMeldBuilderType = type;
["chow", "pong", "kang"].forEach(function(meldType) {
  const button =
    document.getElementById(
      "fhMeldType" +
      meldType.charAt(0).toUpperCase() +
      meldType.slice(1)
    );

  if (!button) return;

  button.classList.toggle(
    "selected",
    meldType === type
  );
});


  const builder =
    document.getElementById("fhMeldTypeBuilder");

  if (!builder) return;

if (type === "chow") {
  renderFHChowBuilder();
  return;
}

  if (type === "pong") {
    renderFHPongBuilder();
    return;
  }

if (type === "kang") {
  renderFHKangBuilder();
  return;
}

if (type === "news") {
  renderFHNewsBuilder();
  return;
}

  const labels = {
    chow: "Chow selected.",
    kang: "Kang selected."   
  };

  builder.innerHTML =
    '<div style="text-align:center; margin:14px 0;">' +
      '<strong>' + labels[type] + '</strong>' +
    '</div>';
}

let fhChowSuit = null;
let fhChowTiles = [];
let fhChowVisibility = "hidden";

function renderFHChowBuilder() {
  fhChowSuit = null;
  fhChowTiles = [];
  fhChowVisibility = "hidden";

  const builder =
    document.getElementById("fhMeldTypeBuilder");

  if (!builder) return;

  builder.innerHTML =
    '<div style="border-top:1px solid #ccc; margin:18px auto 10px; max-width:365px;"></div>' +
    '<div class="draw-title">Set Your Chow Meld</div>' +
    '<div class="rapid-section-label" style="text-align:center; margin-top:14px;">Suit ▼</div>' +
    '<div id="fhChowSuitChoices" style="display:flex; justify-content:center; gap:8px; margin-top:8px;"></div>' +
    '<div id="fhChowTileChoices"></div>';
const suitLabels = {
  chars: "Chars",
  bams: "Bams",
  dots: "Dots"
};

const orderedSuits = [
  displayOrder.firstSuit,
  displayOrder.secondSuit,
  displayOrder.thirdSuit
];

const suitChoices =
  document.getElementById("fhChowSuitChoices");

if (suitChoices) {
  suitChoices.innerHTML =
    orderedSuits.map(function(suitName) {
      return (
        '<button type="button" ' +
          'class="secondary-action" ' +
          'onclick="selectFHChowSuit(\'' +
          suitName +
          '\')">' +
          suitLabels[suitName] +
        '</button>'
      );
    }).join("");
}

}

function selectFHChowSuit(suitName) {
  fhChowSuit = suitName;
  fhChowTiles = [];

  const tileChoices =
    document.getElementById("fhChowTileChoices");

  if (!tileChoices) return;

  const suitKeyMap = {
    chars: "char",
    bams: "bam",
    dots: "dot"
  };

  const suitPrefix = suitKeyMap[suitName];

  let html =
    '<div style="' +
      'display:grid; ' +
      'grid-template-columns:repeat(3, auto); ' +
      'justify-content:center; ' +
      'gap:8px; ' +
      'margin-top:14px;' +
    '">';

  for (let i = 1; i <= 9; i++) {
    const tileKey = suitPrefix + i;

    const isSelectable = i <= 7;

html +=
  '<button type="button" ' +
    'class="rapid-honor-key" ' +
    (isSelectable
      ? 'onclick="selectFHChowStart(' + i + ')" '
      : 'disabled ') +
    'style="' +
      (!isSelectable ? 'opacity:1; cursor:default;' : '') +
    '">' +
    renderCoachTile(tileKey) +
  '</button>';
  }

  html += '</div>';

  tileChoices.innerHTML = html;
const builder =
  document.getElementById("fhMeldTypeBuilder");

if (builder) {
  let controls =
    document.getElementById("fhChowControls");

  if (!controls) {
    controls = document.createElement("div");
    controls.id = "fhChowControls";

    controls.innerHTML =
      '<div class="draw-source-selector" style="justify-content:center; margin-top:14px;">' +

        '<label>' +
          '<input type="radio" ' +
            'name="fhChowVisibility" ' +
            'value="hidden" checked ' +
            'onchange="fhChowVisibility=\'hidden\'">' +
          ' Hidden' +
        '</label>' +

        '<label>' +
          '<input type="radio" ' +
            'name="fhChowVisibility" ' +
            'value="exposed" ' +
            'onchange="fhChowVisibility=\'exposed\'">' +
          ' Exposed' +
        '</label>' +

      '</div>' +

      '<div style="text-align:center; margin-top:14px;">' +
        '<button type="button" ' +
          'class="secondary-action" ' +
          'onclick="addFHChow()">' +
          'Add Chow' +
        '</button>' +
      '</div>';

    builder.appendChild(controls);
  }
}

}

function selectFHChowStart(startNumber) {
  const suitKeyMap = {
    chars: "char",
    bams: "bam",
    dots: "dot"
  };

  const prefix = suitKeyMap[fhChowSuit];

  fhChowTiles = [
    prefix + startNumber,
    prefix + (startNumber + 1),
    prefix + (startNumber + 2)
  ];

  const tileChoices =
    document.getElementById("fhChowTileChoices");

  if (!tileChoices) return;

  const buttons =
    tileChoices.querySelectorAll("button");

  buttons.forEach(function(button, index) {
  const number = index + 1;

  const isSelected =
    number >= startNumber &&
    number <= startNumber + 2;

  button.style.backgroundColor =
    isSelected ? "#fff2a8" : "";

  button.style.border =
    isSelected ? "2px solid #d6a800" : "";
});

}

function addFHChow() {
  if (fhChowTiles.length !== 3) {
    showToast("Select a Chow.");
    return;
  }

  fhMelds.push({
    type: "chow",
    tiles: [...fhChowTiles],
    visibility: fhChowVisibility,
    source: "added"
  });

  revisionTouched = true;

  cancelFHMeldBuilder();
  renderMeldVisibilityCorrection();
}

let fhPongNumber = null;
let fhPongTileKey = null;
let fhPongVisibility = "hidden";

function renderFHPongBuilder() {
  fhPongNumber = null;
  fhPongTileKey = null;
  fhPongVisibility = "hidden";

  const builder =
    document.getElementById("fhMeldTypeBuilder");

  if (!builder) return;

  let html =
    '<div style="border-top:1px solid #ccc; margin:18px auto 10px; max-width:365px;"></div>' +
'<div class="draw-title">Set Your Pong Meld</div>' +

    '<div class="rapid-draw-layout">' +

      '<div class="rapid-draw-main">' +

        '<div>' +
          '<div class="rapid-section-label">Number ▼</div>' +
          '<div class="rapid-number-pad">';

  for (let i = 1; i <= 9; i++) {
    html +=
      '<button ' +
        'type="button" ' +
        'class="rapid-draw-key" ' +
        'onclick="selectFHPongNumber(' + i + ')">' +
        i +
      '</button>';
  }

  html +=
          '</div>' +
        '</div>' +

        '<div>' +
          '<div class="rapid-section-label" style="padding-left: 12px;">Suit ▼</div>' +
          '<div id="fhPongSuitChoices" class="rapid-draw-choices"></div>' +
        '</div>' +

      '</div>' +

      '<div class="rapid-honor-section">' +

        '<div class="rapid-honor-pad">' +

          '<div class="rapid-section-label">Winds ▼</div>' +

          '<div class="rapid-honor-row">' +

            '<button type="button" class="rapid-honor-key" ' +
              'onclick="selectFHPongHonor(\'east\')">' +
              renderCoachTile("east") +
            '</button>' +

            '<button type="button" class="rapid-honor-key" ' +
              'onclick="selectFHPongHonor(\'south\')">' +
              renderCoachTile("south") +
            '</button>' +

            '<button type="button" class="rapid-honor-key" ' +
              'onclick="selectFHPongHonor(\'west\')">' +
              renderCoachTile("west") +
            '</button>' +

            '<button type="button" class="rapid-honor-key" ' +
              'onclick="selectFHPongHonor(\'north\')">' +
              renderCoachTile("north") +
            '</button>' +

          '</div>' +

          '<div class="rapid-section-label">Dragons ▼</div>' +

          '<div class="rapid-honor-row dragons">' +

            '<button type="button" class="rapid-honor-key" ' +
              'onclick="selectFHPongHonor(\'red\')">' +
              renderCoachTile("red") +
            '</button>' +

            '<button type="button" class="rapid-honor-key" ' +
              'onclick="selectFHPongHonor(\'green\')">' +
              renderCoachTile("green") +
            '</button>' +

            '<button type="button" class="rapid-honor-key" ' +
              'onclick="selectFHPongHonor(\'white\')">' +
              renderCoachTile("white") +
            '</button>' +

          '</div>' +

        '</div>' +

        '<div id="fhPongHonorChoice" class="rapid-honor-choice"></div>' +

      '</div>' +

    '</div>' +

'<div class="draw-source-selector" style="justify-content:center; margin-top:14px;">' +

  '<label>' +
    '<input type="radio" ' +
      'name="fhPongVisibility" ' +
      'value="hidden" checked ' +
      'onchange="fhPongVisibility=\'hidden\'">' +
    ' Hidden' +
  '</label>' +

  '<label>' +
    '<input type="radio" ' +
      'name="fhPongVisibility" ' +
      'value="exposed" ' +
      'onchange="fhPongVisibility=\'exposed\'">' +
    ' Exposed' +
  '</label>' +

'</div>' +

'<div style="text-align:center; margin-top:14px;">' +
  '<button type="button" ' +
    'class="secondary-action" ' +
    'onclick="addFHPong()">' +
    'Add Pong' +
  '</button>' +
'</div>';

  builder.innerHTML = html;
}

function addFHPong() {
  if (!fhPongTileKey) {
    showToast("Select a tile for your Pong.");
    return;
  }

  fhMelds.push({
    type: "pong",
    tiles: [
      fhPongTileKey,
      fhPongTileKey,
      fhPongTileKey
    ],
    visibility: fhPongVisibility,
    source: "added"
  });

  revisionTouched = true;

  cancelFHMeldBuilder();
  renderMeldVisibilityCorrection();
}

function selectFHPongNumber(number) {
  fhPongNumber = number;
  fhPongTileKey = null;
const honorChoice =
  document.getElementById("fhPongHonorChoice");

if (honorChoice) {
  honorChoice.innerHTML = "";
}


  const choices =
    document.getElementById("fhPongSuitChoices");

  if (!choices) return;

  const suitKeyMap = {
    chars: "char",
    bams: "bam",
    dots: "dot"
  };

  const orderedSuits = [
    displayOrder.firstSuit,
    displayOrder.secondSuit,
    displayOrder.thirdSuit
  ];

  choices.innerHTML =
    orderedSuits.map(function(suitName) {
      const tileKey =
        suitKeyMap[suitName] + number;

      return (
        '<button ' +
          'type="button" ' +
          'class="rapid-tile-choice" ' +
          'onclick="selectFHPongTile(\'' +
            tileKey +
          '\')">' +
          renderCoachTile(tileKey) +
        '</button>'
      );
    }).join("");
}

function selectFHPongTile(tileKey) {
  fhPongTileKey = tileKey;

  const suitChoices =
    document.getElementById("fhPongSuitChoices");

  if (suitChoices) {
    suitChoices.innerHTML =
      renderCoachTile(tileKey);
  }

  showToast(
    "Pong: " + tileLabels[tileKey]
  );
}
function selectFHPongHonor(tileKey) {
  fhPongNumber = null;
  fhPongTileKey = tileKey;

  const suitChoices =
    document.getElementById("fhPongSuitChoices");

  const honorChoice =
    document.getElementById("fhPongHonorChoice");

  if (suitChoices) {
    suitChoices.innerHTML = "";
  }

  if (honorChoice) {
    honorChoice.innerHTML =
      renderCoachTile(tileKey);
  }

  showToast(
    "Pong: " + tileLabels[tileKey]
  );
}

let fhKangNumber = null;
let fhKangTileKey = null;
let fhKangVisibility = "hidden";

function renderFHKangBuilder() {
  fhKangNumber = null;
  fhKangTileKey = null;
  fhKangVisibility = "hidden";

  const builder =
    document.getElementById("fhMeldTypeBuilder");

  if (!builder) return;

  let html =
    '<div style="border-top:1px solid #ccc; margin:18px auto 10px; max-width:365px;"></div>' +
    '<div class="draw-title">Set Your Kang Meld</div>' +

    '<div class="rapid-draw-layout">' +

      '<div class="rapid-draw-main">' +

        '<div>' +
          '<div class="rapid-section-label">Number ▼</div>' +
          '<div class="rapid-number-pad">';

  for (let i = 1; i <= 9; i++) {
    html +=
      '<button ' +
        'type="button" ' +
        'class="rapid-draw-key" ' +
        'onclick="selectFHKangNumber(' + i + ')">' +
        i +
      '</button>';
  }

  html +=
          '</div>' +
        '</div>' +

        '<div>' +
          '<div class="rapid-section-label" style="padding-left:12px;">Suit ▼</div>' +
          '<div id="fhKangSuitChoices" class="rapid-draw-choices"></div>' +
        '</div>' +

      '</div>' +

      '<div class="rapid-honor-section">' +

        '<div class="rapid-honor-pad">' +

          '<div class="rapid-section-label">Winds ▼</div>' +

          '<div class="rapid-honor-row">' +
            '<button type="button" class="rapid-honor-key" onclick="selectFHKangHonor(\'east\')">' +
              renderCoachTile("east") +
            '</button>' +
            '<button type="button" class="rapid-honor-key" onclick="selectFHKangHonor(\'south\')">' +
              renderCoachTile("south") +
            '</button>' +
            '<button type="button" class="rapid-honor-key" onclick="selectFHKangHonor(\'west\')">' +
              renderCoachTile("west") +
            '</button>' +
            '<button type="button" class="rapid-honor-key" onclick="selectFHKangHonor(\'north\')">' +
              renderCoachTile("north") +
            '</button>' +
          '</div>' +

          '<div class="rapid-section-label">Dragons ▼</div>' +

          '<div class="rapid-honor-row dragons">' +
            '<button type="button" class="rapid-honor-key" onclick="selectFHKangHonor(\'red\')">' +
              renderCoachTile("red") +
            '</button>' +
            '<button type="button" class="rapid-honor-key" onclick="selectFHKangHonor(\'green\')">' +
              renderCoachTile("green") +
            '</button>' +
            '<button type="button" class="rapid-honor-key" onclick="selectFHKangHonor(\'white\')">' +
              renderCoachTile("white") +
            '</button>' +
          '</div>' +

        '</div>' +

        '<div id="fhKangHonorChoice" class="rapid-honor-choice"></div>' +

      '</div>' +

        '</div>' +

    '<div class="draw-source-selector" style="justify-content:center; margin-top:14px;">' +

      '<label>' +
        '<input type="radio" ' +
          'name="fhKangVisibility" ' +
          'value="hidden" checked ' +
          'onchange="fhKangVisibility=\'hidden\'">' +
        ' Hidden' +
      '</label>' +

      '<label>' +
        '<input type="radio" ' +
          'name="fhKangVisibility" ' +
          'value="exposed" ' +
          'onchange="fhKangVisibility=\'exposed\'">' +
        ' Exposed' +
      '</label>' +

    '</div>' +

    '<div style="text-align:center; margin-top:14px;">' +
      '<button type="button" ' +
        'class="secondary-action" ' +
        'onclick="addFHKang()">' +
        'Add Kang' +
      '</button>' +
    '</div>';

  builder.innerHTML = html;
}

function selectFHKangNumber(number) {
  fhKangNumber = number;
  fhKangTileKey = null;

  const honorChoice =
    document.getElementById("fhKangHonorChoice");

  if (honorChoice) {
    honorChoice.innerHTML = "";
  }

  const choices =
    document.getElementById("fhKangSuitChoices");

  if (!choices) return;

  const suitKeyMap = {
    chars: "char",
    bams: "bam",
    dots: "dot"
  };

  const orderedSuits = [
    displayOrder.firstSuit,
    displayOrder.secondSuit,
    displayOrder.thirdSuit
  ];

  choices.innerHTML =
    orderedSuits.map(function(suitName) {
      const tileKey =
        suitKeyMap[suitName] + number;

      return (
        '<button ' +
          'type="button" ' +
          'class="rapid-tile-choice" ' +
          'onclick="selectFHKangTile(\'' +
            tileKey +
          '\')">' +
          renderCoachTile(tileKey) +
        '</button>'
      );
    }).join("");
}

function selectFHKangTile(tileKey) {
  fhKangTileKey = tileKey;

  const suitChoices =
    document.getElementById("fhKangSuitChoices");

  if (suitChoices) {
    suitChoices.innerHTML =
      renderCoachTile(tileKey);
  }

  showToast(
    "Kang: " + tileLabels[tileKey]
  );
}

function selectFHKangHonor(tileKey) {
  fhKangNumber = null;
  fhKangTileKey = tileKey;

  const suitChoices =
    document.getElementById("fhKangSuitChoices");

  const honorChoice =
    document.getElementById("fhKangHonorChoice");

  if (suitChoices) {
    suitChoices.innerHTML = "";
  }

  if (honorChoice) {
    honorChoice.innerHTML =
      renderCoachTile(tileKey);
  }

  showToast(
    "Kang: " + tileLabels[tileKey]
  );
}

function addFHKang() {
  if (!fhKangTileKey) {
    showToast("Select a tile for your Kang.");
    return;
  }

  fhMelds.push({
    type: "kang",
    tiles: [
      fhKangTileKey,
      fhKangTileKey,
      fhKangTileKey,
      fhKangTileKey
    ],
    visibility: fhKangVisibility,
    source: "added"
  });

  revisionTouched = true;

  cancelFHMeldBuilder();
  renderMeldVisibilityCorrection();
}

let fhNEWSVisibility = "hidden";

function renderFHNewsBuilder() {
  fhNEWSVisibility = "hidden";

  const builder =
    document.getElementById("fhMeldTypeBuilder");

  if (!builder) return;

  builder.innerHTML =
    '<div style="border-top:1px solid #ccc; margin:18px auto 10px; max-width:365px;"></div>' +
    '<div class="draw-title">Set Your NEWS Meld</div>' +

    '<div class="rapid-honor-row" style="justify-content:center; margin-top:14px;">' +
      '<div class="rapid-honor-key">' +
        renderCoachTile("north") +
      '</div>' +
      '<div class="rapid-honor-key">' +
        renderCoachTile("east") +
      '</div>' +
      '<div class="rapid-honor-key">' +
        renderCoachTile("west") +
      '</div>' +
      '<div class="rapid-honor-key">' +
        renderCoachTile("south") +
      '</div>' +
    '</div>' +

    '<div class="draw-source-selector" style="justify-content:center; margin-top:14px;">' +

      '<label>' +
        '<input type="radio" ' +
          'name="fhNEWSVisibility" ' +
          'value="hidden" checked ' +
          'onchange="fhNEWSVisibility=\'hidden\'">' +
        ' Hidden' +
      '</label>' +

      '<label>' +
        '<input type="radio" ' +
          'name="fhNEWSVisibility" ' +
          'value="exposed" ' +
          'onchange="fhNEWSVisibility=\'exposed\'">' +
        ' Exposed' +
      '</label>' +

    '</div>' +

    '<div style="text-align:center; margin-top:14px;">' +
      '<button type="button" ' +
        'class="secondary-action" ' +
        'onclick="addFHNEWS()">' +
        'Add NEWS' +
      '</button>' +
    '</div>';
}

function addFHNEWS() {
  fhMelds.push({
    type: "news",
    tiles: [
      "north",
      "east",
      "west",
      "south"
    ],
    visibility: fhNEWSVisibility,
    source: "added"
  });

  revisionTouched = true;

  cancelFHMeldBuilder();
  renderMeldVisibilityCorrection();
}

function cancelFHMeldBuilder() {
  fhMeldBuilderType = null;

  const builder =
    document.getElementById("fhMeldTypeBuilder");

  if (builder) {
    builder.innerHTML = "";
  }

  document
    .getElementById("fhMeldBuilder")
    .classList.add("hidden");
}

function setFHMeldState(index, state) {
  if (!fhMelds[index]) return;

  fhMelds[index].visibility = state;
  revisionTouched = true;
  updateDisplay();
}

function renderMeldVisibilityCorrection() {
  const container =
    document.getElementById(
      "hcsMeldVisibility"
    );

  if (!container) return;

  const existingMelds =
  fhMelds.filter(function(box) {
    return box.source === "existing";
  });

const addedMelds =
  fhMelds.filter(function(box) {
    return box.source === "added";
  });

const completeBoxes = existingMelds;

  let html =
  '<div class="hand-section-title" style="margin-top:12px;">' +
  'Existing Melds' +
  '</div>';

if (completeBoxes.length === 0) {
  html +=
    '<div class="empty-note">' +
    'None' +
    '</div>';
}

completeBoxes.forEach(function(box, index) {
    const typeLabel =
      box.type.charAt(0).toUpperCase() +
      box.type.slice(1);

    const tileLabel =
      box.tiles
        .map(function(tileKey) {
          return tileLabels[tileKey];
        })
        .join(", ");

    html +=
      '<div class="hand-section">' +
        '<div class="hand-section-title">' +
          typeLabel +
        '</div>' +
        '<div>' +
          tileLabel +
        '</div>' +
        '<div class="draw-source-selector">' +

          '<label>' +
            '<input ' +
              'type="radio" ' +
              'name="meldVisibility-' +
              box.boxId +
              '" ' +
              'value="hidden" ' +
              (box.visibility === "hidden"
                ? 'checked '
                : '') +
 
             'onchange="setFHMeldState(' +
index +
', \'hidden\')">' +
  

          ' Hidden' +
          '</label>' +

          '<label>' +
            '<input ' +
              'type="radio" ' +
              'name="meldVisibility-' +
              box.boxId +
              '" ' +
              'value="exposed" ' +
              (box.visibility === "exposed"
                ? 'checked '
                : '') +

              'onchange="setFHMeldState(' +
index +
', \'exposed\')">' +

            ' Exposed' +
          '</label>' +

'<label>' +
  '<input ' +
    'type="radio" ' +
    'name="meldVisibility-' +
    box.boxId +
    '" ' +
    'value="remove" ' +
(box.visibility === "remove"
  ? 'checked '
  : '') +
'onchange="setFHMeldState(' +
index +
', \'remove\')">' +
' Remove' +
'</label>' +


        '</div>' +
      '</div>';
  });

html +=
  '<div class="hand-section-title" style="margin-top:16px;">' +
  'Added Melds' +
  '</div>';

if (addedMelds.length === 0) {
  html +=
    '<div class="empty-note">' +
    'None' +
    '</div>';
} else {
  addedMelds.forEach(function(box) {
    const index = fhMelds.indexOf(box);

    const typeLabel =
      box.type.charAt(0).toUpperCase() +
      box.type.slice(1);

    const tileLabel =
      box.tiles
        .map(function(tileKey) {
          return tileLabels[tileKey];
        })
        .join(", ");

    html +=
      '<div class="hand-section">' +
        '<div class="hand-section-title">' +
          typeLabel +
        '</div>' +
        '<div>' +
          tileLabel +
        '</div>' +
        '<div class="draw-source-selector">' +

          '<label>' +
            '<input type="radio" ' +
              'name="fhAddedMeld-' + index + '" ' +
              'value="hidden" ' +
              (box.visibility === "hidden" ? 'checked ' : '') +
              'onchange="setFHMeldState(' +
              index +
              ', \'hidden\')">' +
            ' Hidden' +
          '</label>' +

          '<label>' +
            '<input type="radio" ' +
              'name="fhAddedMeld-' + index + '" ' +
              'value="exposed" ' +
              (box.visibility === "exposed" ? 'checked ' : '') +
              'onchange="setFHMeldState(' +
              index +
              ', \'exposed\')">' +
            ' Exposed' +
          '</label>' +

          '<label>' +
            '<input type="radio" ' +
              'name="fhAddedMeld-' + index + '" ' +
              'value="remove" ' +
              (box.visibility === "remove" ? 'checked ' : '') +
              'onchange="setFHMeldState(' +
              index +
              ', \'remove\')">' +
            ' Remove' +
          '</label>' +

        '</div>' +
      '</div>';
  });
}

  container.innerHTML = html;
if (screenMode === "handCorrection") {
  updateDisplay();
}
}

let handCorrectionReturnAction = null;
let fhTurnCycle = null;

function setFHTurnCycle(action) {
  fhTurnCycle = action;
  revisionTouched = true;
  updateDisplay();
}

function openHandCorrectionScreen() {
  if (hdMode !== "current") return;

  handCorrectionReturnAction = gameAction;
  fhTurnCycle = handCorrectionReturnAction;
  handCorrectionSnapshot = makeSnapshot();
  handCorrectionTarget = null;
  revisionTarget = null;
  revisionReturnHDMode = "current";
  screenMode = "handCorrection";
  revisionTouched = false;
  initializeFHMelds();
  fhTranscriptBefore =
    makeFHTranscriptSnapshot(
      counts,
      fhMelds,
      handCorrectionReturnAction
    );

for (const key in counts) {
  counts[key] = 0;
}

tcsOriginalCounts = {};
tcsAddedCounts = {};

for (const key in counts) {
  tcsOriginalCounts[key] = 0;
  tcsAddedCounts[key] = 0;
}

renderMeldVisibilityCorrection();

  document.getElementById("hdScreen").classList.add("hidden");
  document.getElementById("drawScreen").classList.add("hidden");
  document.getElementById("discardScreen").classList.add("hidden");
  document.getElementById("tdScreen").classList.remove("hidden");
  document.getElementById("hcsIntro").classList.remove("hidden");
  document.querySelector("#hcsIntro .hcs-title").textContent = "Fix Hand";

  const hcsMeta = document.getElementById("hcsMeta");

if (hcsMeta) {
  hcsMeta.innerHTML =
    '<div style="margin-top:10px;">' +
      '<strong>What are you going to do next?</strong>' +
    '</div>' +
    '<div class="draw-source-selector" style="justify-content:center; margin-top:6px; margin-bottom:10px;">' +

      '<label>' +
        '<input type="radio" ' +
          'name="fhTurnCycle" ' +
          'value="draw" ' +
          (fhTurnCycle === "draw" ? 'checked ' : '') +
          'onchange="setFHTurnCycle(\'draw\')">' +
        ' Preparing to Draw' +
      '</label>' +

      '<label>' +
        '<input type="radio" ' +
          'name="fhTurnCycle" ' +
          'value="discard" ' +
          (fhTurnCycle === "discard" ? 'checked ' : '') +
          'onchange="setFHTurnCycle(\'discard\')">' +
        ' Preparing to Discard' +
      '</label>' +

    '</div>';
}

  showStartingHeader(true);
  hideUndo();
  applyDisplayOrderToScreens();
  updateDisplay();
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


