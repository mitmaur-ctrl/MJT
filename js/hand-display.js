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

  const handDisplay =
  document.getElementById("handDisplay");

if (coachingOn) {
  handDisplay.innerHTML = "";
  handDisplay.classList.add("hidden");
} else {
  handDisplay.innerHTML =
    html || "No tiles selected.";

  handDisplay.classList.remove("hidden");
}

}

function getTilesInHand(structureState) {
  let tih = 0;

  const completeTileCounts = {};

  structureState.completeBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      completeTileCounts[tileKey] =
        (completeTileCounts[tileKey] || 0) + 1;
    });
  });

  Object.keys(counts).forEach(function(tileKey) {
    const totalCount = counts[tileKey] || 0;
    const completeCount = completeTileCounts[tileKey] || 0;

    tih += Math.max(0, totalCount - completeCount);
  });

  return tih;
}

function buildCurrentHandDisplay() {
  const groups = getTileGroups();

  /*
  ================================================
  Read the current hand from Canonical Structure State
  ================================================
  */

  const result =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  const handInstruction =
  document.getElementById("handInstruction");

if (result.mahjong) {
  gameAction = "mahjong";

  if (handInstruction) {
    handInstruction.textContent = "🀄 Mahjong!";
  }

  const drawBtn =
    document.getElementById("drawBtn");
  const claimBtn =
    document.getElementById("claimBtn");
  const discardBtn =
    document.getElementById("discardBtn");

  [drawBtn, claimBtn, discardBtn].forEach(function(button) {
    if (!button) return;

    button.disabled = true;
    button.classList.remove("enabled");
    button.classList.add("disabled");
  });
}

  const structureState =
    result.structureState || result;

  

  /*
  ================================================
  Build Loose Tile counts.

  In Standard View:
  - Complete Box tiles are Melds
  - Everything else remains Loose
  ================================================
  */

  const looseCounts = { ...counts };

  structureState.completeBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      looseCounts[tileKey] -= 1;
    });
  });

  /*
  ================================================
  Render Loose Tiles
  ================================================
  */

  let looseHtml = "";
  const looseTileTotal = getTilesInHand(structureState);
  let drawnHighlightUsed = false;

  for (const group of groups) {
    let groupHtml = "";

    for (const key of group.keys) {
      const tileCount =
        Math.max(
          0,
          looseCounts[key] || 0
        );


      for (let i = 0; i < tileCount; i++) {
        const isLastDrawn =
          key === lastDrawnTileKey &&
          !drawnHighlightUsed;

        groupHtml +=
          '<span class="hand-tile' +
          (isLastDrawn ? ' last-drawn' : '') +
          '">' +
          tileLabels[key] +
          '</span>';

        if (isLastDrawn) {
          drawnHighlightUsed = true;
        }
      }
    }

    if (groupHtml !== "") {
      looseHtml +=
        '<div class="hand-section">';

      looseHtml +=
        '<div class="hand-section-title">' +
        group.title +
        '</div>';

      looseHtml += groupHtml;
      looseHtml += '</div>';
    }
  }

  /*
  ================================================
  Render Hidden Melds

  For now, all Complete Boxes are treated as
  Hidden Melds until exposed/hidden status is added
  to Canonical Structure State.
  ================================================
  */

  let hiddenMeldHtml = "";
  let exposedMeldHtml = "";

  structureState.completeBoxes.forEach(
    function(box) {
      const tileHtml =
        box.tiles.map(function(tileKey) {
          const isLastDrawn =
            tileKey === lastDrawnTileKey &&
            !drawnHighlightUsed;

          if (isLastDrawn) {
            drawnHighlightUsed = true;
          }

          return (
            '<span class="hand-tile' +
            (isLastDrawn ? ' last-drawn' : '') +
            '">' +
            tileLabels[tileKey] +
            '</span>'
          );
        }).join("");

      const meldHtml =
  '<div class="hand-section">' +
    '<div class="hand-section-title">' +
      box.type.charAt(0).toUpperCase() +
      box.type.slice(1) +
    '</div>' +
    tileHtml +
  '</div>';

if (box.visibility === "exposed") {
  exposedMeldHtml += meldHtml;
} else {
  hiddenMeldHtml += meldHtml;
}
});

  /*
  ================================================
  Build Standard View
  ================================================
  */

  let html = "";

  html += '<div class="hand-section">';
  html +=
    '<div class="hand-section-title">' +
    'Loose Tiles (' +
    looseTileTotal +
    ')' +
    '</div>';

  html +=
    looseHtml ||
    '<span class="empty-note">' +
    'No loose tiles entered.' +
    '</span>';

  html += '</div>';

  html += '<div class="hand-section">';
  html +=
    '<div class="hand-section-title">' +
    'Hidden Melds' +
    '</div>';

  html +=
    hiddenMeldHtml ||
    '<span class="empty-note">None yet</span>';

  html += '</div>';

  html += '<div class="hand-section">';
  html +=
    '<div class="hand-section-title">' +
    'Exposed Melds' +
    '</div>';

    html +=
    exposedMeldHtml ||
    '<span class="empty-note">None yet</span>';  

  html += '</div>';

  const handDisplay =
  document.getElementById("handDisplay");

if (coachingOn) {
  handDisplay.innerHTML = "";
  handDisplay.classList.add("hidden");
} else {
  handDisplay.innerHTML = html;
  handDisplay.classList.remove("hidden");
}
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
  const claimBtn = document.getElementById("claimBtn");
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
  claimBtn.classList.remove("hidden");
  reviseBtn.classList.remove("hidden");
  coachingBtn.classList.remove("hidden");
  correctLastBtn.classList.remove("hidden");
  handCorrectionBtn.classList.remove("hidden");

  const canDraw = gameAction === "draw";
  const canDiscard = gameAction === "discard";

  drawBtn.disabled = !canDraw;
  claimBtn.disabled = !canDraw;
  discardBtn.disabled = !canDiscard;

  drawBtn.classList.toggle("enabled", canDraw);
  drawBtn.classList.toggle("disabled", !canDraw);

  claimBtn.classList.toggle("enabled", canDraw);
  claimBtn.classList.toggle("disabled", !canDraw);

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

  coachingBtn.textContent = coachingOn ? "Standard View" : "Coaching View";

  if (hdMode === "starting") {
    handTitle.textContent = "Starting Hand";
  
  if (coachingOn) {
    handInstruction.innerHTML =
        "Here's your hand organized using Six Box Theory™.<br>" +
        (gameAction === "draw"
            ? "Prepare to Draw or Claim. Press Draw or Claim when ready."
            : "Prepare to Discard. Press Discard when ready.");
} else {
    handInstruction.textContent =
        gameAction === "draw"
            ? "Prepare to Draw or Claim. Press Draw or Claim when ready."
            : "Prepare to Discard. Press Discard when ready.";
}
    handInstruction.classList.remove("hidden");
    handMeta.textContent =
      "Role: " + (role === "dealer" ? "Dealer" : "Player") +
      " | Tiles: " + total +
      " | " + setupContext;

    return;
  }

  handTitle.textContent = "Current Hand";
  handMeta.textContent = "";
  handInstruction.textContent =
  gameAction === "draw"
    ? "Prepare to Draw or Claim. Press Draw or Claim when ready."
    : "Prepare to Discard. Press Discard when ready.";
  handInstruction.classList.remove("hidden");

}

function renderActiveArea(completeBoxes, developingBoxes, halfEye) {
  let html = '<div class="engine-title">Active Area</div>';
  let drawnHighlightUsed = false;
  const firstActiveBoxNumber = completeBoxes.length + 1;

  developingBoxes.forEach(function(box, index) {
    const boxNumber = firstActiveBoxNumber + index;

    const tileHtml = box.tiles.map(function(tileKey) {
  const isLastDrawn =
    tileKey === lastDrawnTileKey &&
    !drawnHighlightUsed;

  if (isLastDrawn) {
    drawnHighlightUsed = true;
  }

  return (
    '<span class="hand-tile' +
    (isLastDrawn ? ' last-drawn' : '') +
    '">' +
    tileLabels[tileKey] +
    '</span>'
  );
}).join("");

    html +=
      '<div class="hand-section box-card developing-box">' +
        '<div class="hand-section-title">Box ' + boxNumber + ' — ' +
          box.type.toUpperCase() +
        '</div>' +
        tileHtml +
      '</div>';
  });

if (halfEye && halfEye.length > 0) {
    const boxNumber =
      firstActiveBoxNumber + developingBoxes.length;

    const tileHtml = halfEye[0].tiles.map(function(tileKey) {
  const isLastDrawn =
    tileKey === lastDrawnTileKey &&
    !drawnHighlightUsed;

  if (isLastDrawn) {
    drawnHighlightUsed = true;
  }

  return (
    '<span class="hand-tile' +
    (isLastDrawn ? ' last-drawn' : '') +
    '">' +
    tileLabels[tileKey] +
    '</span>'
  );
}).join("");

    html +=
      '<div class="hand-section box-card developing-box">' +
        '<div class="hand-section-title">Box ' +
          boxNumber +
          ' — HE</div>' +
        tileHtml +
      '</div>';
  }

  const totalBoxes =
  completeBoxes.length +
  developingBoxes.length +
  (halfEye ? halfEye.length : 0);

  for (let boxNumber = totalBoxes + 1; boxNumber <= 6; boxNumber++) {
  html +=
    '<div class="hand-section box-card empty-box">' +
      '<div class="hand-section-title">Box ' + boxNumber + '</div>' +
      '<span class="empty-note">Empty</span>' +
    '</div>';
}

  return html;
}

function renderReserveArea(reserves) {
  let html = '<div class="hand-section reserve-area">';
  html += '<div class="hand-section-title">Reserves</div>';

  if (!reserves || reserves.length === 0) {
    html += '<span class="empty-note">None</span>';
  } else {
    let drawnHighlightUsed = false;

html += reserves.map(function(tileKey) {
  const isLastDrawn =
    tileKey === lastDrawnTileKey &&
    !drawnHighlightUsed;

  if (isLastDrawn) {
    drawnHighlightUsed = true;
  }

  return (
    '<span class="hand-tile' +
    (isLastDrawn ? ' last-drawn' : '') +
    '">' +
    tileLabels[tileKey] +
    '</span>'
  );
}).join("");
  }

  html += '</div>';
  return html;
}

function renderCompletedArea(completeBoxes) {
  if (!completeBoxes || completeBoxes.length === 0) {
    return '<div class="engine-placeholder">No Complete Boxes found.</div>';
  }

  let html = '<div class="engine-title">Completed Area</div>';
  let drawnHighlightUsed = false;
  
  completeBoxes.forEach(function(box, index) {
    

const tileHtml = box.tiles.map(function(tileKey) {
  const isLastDrawn =
    tileKey === lastDrawnTileKey &&
    !drawnHighlightUsed;

  if (isLastDrawn) {
    drawnHighlightUsed = true;
  }

  return (
    '<span class="hand-tile' +
    (isLastDrawn ? ' last-drawn' : '') +
    '">' +
    tileLabels[tileKey] +
    '</span>'
  );
}).join("");

    html +=
  '<div class="hand-section box-card complete-box">' +
    '<div class="hand-section-title">Box ' + box.boxId + ' — ' +
      box.type.charAt(0).toUpperCase() + box.type.slice(1) +
      ' — ' +
      (box.visibility === "exposed" ? "Exposed" : "Hidden") +
    '</div>' +
    tileHtml +
  '</div>';
  });

  return html;
}

function renderCoachView() {
  const enginePanel =
    document.getElementById("enginePanel");

  const result =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  console.log(
    "17TE result:",
    result
  );

  const handInstruction =
    document.getElementById(
      "handInstruction"
    );

  if (
    result.mahjong &&
    handInstruction
  ) {
    handInstruction.textContent =
      "🀄 Mahjong!";
  }

  const structureState =
    result.structureState || result;

  const tih =
    getTilesInHand(
      structureState
    );

  enginePanel.innerHTML =
    '<div class="tih-counter">' +
      'TIH: ' + tih +
    '</div>' +
    renderActiveArea(
      structureState.completeBoxes,
      structureState.developingBoxes,
      structureState.halfEye
    ) +
    renderReserveArea(
      structureState.reserves
    ) +
    renderCompletedArea(
      structureState.completeBoxes
    );
}


function toggleCoaching() {
  coachingOn = !coachingOn;

  const coachingBtn =
    document.getElementById("coachingBtn");

  const enginePanel =
    document.getElementById("enginePanel");

  coachingBtn.textContent =
    coachingOn
      ? "Standard View"
      : "Coaching View";

  enginePanel.classList.toggle(
    "hidden",
    !coachingOn
  );

  configureHDMode();
  buildHandDisplay();

  if (coachingOn) {
    renderCoachView();
  }
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

if (coachingOn) {
  renderCoachView();
}

scrollToTopForScreen();
}

