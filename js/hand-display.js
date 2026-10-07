/*
==================================================
MJC Hand Display
Version: 6BT v8.1
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

// Coaching View presentation form.
// "short" = compact live-play layout.
// "long" = expanded Pathways / teaching layout.
window.coachViewForm = "short";
window.pathwaysOn = false;
window.discardRecommendationsOn = true;
window.currentDiscardRecommendation = [];

try {
  window.discardRecommendationsOn =
    localStorage.getItem("mjcDiscardRecommendations") !== "off";
} catch (error) {
  // Keep the default if storage is unavailable.
}

function toggleDiscardRecommendations() {
  window.discardRecommendationsOn =
    !window.discardRecommendationsOn;

  try {
    localStorage.setItem(
      "mjcDiscardRecommendations",
      window.discardRecommendationsOn ? "on" : "off"
    );
  } catch (error) {
    // The toggle still works for this visit.
  }

  if (coachingOn) {
    renderCoachView();
  }
}

function togglePathways() {
  window.pathwaysOn =
    !window.pathwaysOn;

  const pathwaysBtn =
    document.getElementById("pathwaysBtn");

  if (pathwaysBtn) {
    pathwaysBtn.textContent =
      window.pathwaysOn
        ? "Pathways: Off"
        : "Pathways: On";
  }

const pathwaysHelpLink =
  document.getElementById("pathwaysHelpLink");

if (pathwaysHelpLink) {
  pathwaysHelpLink.classList.toggle(
    "hidden",
    !window.pathwaysOn
  );
}

  if (coachingOn) {
    renderCoachView();
  }
}

function getTileGroups() {
  const groupMap = MJC_TILE_GROUP_DEFINITIONS;

  const suitGroups = [displayOrder.firstSuit, displayOrder.secondSuit, displayOrder.thirdSuit].map(s => groupMap[s]);
  const honorGroups = displayOrder.honorsOrder === "dragonsFirst"
    ? [groupMap.dragons, groupMap.winds]
    : [groupMap.winds, groupMap.dragons];

  return suitGroups.concat(honorGroups);
}

function getBoxTypeLabel(boxType) {
  const boxLabels = {
    ec: {
      full: "Eye Candidate",
      abbreviated: "EC"
    },
    epc: {
      full: "Eye-Pong Candidate",
      abbreviated: "EPC"
    },
    cpc: {
      full: "Chow-Pong Candidate",
      abbreviated: "CPC"
    },
    cc: {
      full: "Chow Candidate",
      abbreviated: "CC"
    },
    dsw: {
      full: "Double-Sided Wait",
      abbreviated: "DSW"
    },
    mw: {
      full: "Middle Wait",
      abbreviated: "MW"
    },
    ew: {
      full: "Edge Wait",
      abbreviated: "EW"
    },
    he: {
      full: "Half Eye",
      abbreviated: "HE"
    },
    pc: {
      full: "Pong Candidate",
      abbreviated: "PC"
  }
  };

  const labels = boxLabels[boxType];

  if (!labels) {
    return boxType.toUpperCase();
  }

  return window.useFullBoxLabels !== false
  ? labels.full
  : labels.abbreviated;;
}

function toggleBoxLabels() {

  window.useFullBoxLabels =
    !window.useFullBoxLabels;

  if (coachingOn) {
    renderCoachView();
  }
}

function getBoxLabelToggleHtml() {
  const fullActive =
    window.useFullBoxLabels !== false;

 return (
  '<button ' +
    'type="button" ' +
    'class="box-label-toggle-button" ' +
    'onclick="toggleBoxLabels()">' +
    (fullActive ? 'Labels: Full' : 'Labels: Short') +
  '</button>'
);
}


window.showTileIndices = true;

function toggleTileIndices() {
  window.showTileIndices =
    !window.showTileIndices;

  if (coachingOn) {
    renderCoachView();
  } else {
    buildHandDisplay();
  }
}

function getTileIndexToggleHtml() {
  const indicesOn =
    window.showTileIndices !== false;

  return (
    '<button ' +
      'type="button" ' +
      'class="box-label-toggle-button" ' +
      'onclick="toggleTileIndices()">' +
      (indicesOn ? 'Indices: On' : 'Indices: Off') +
    '</button>'
  );
}



function buildStartingHandDisplay() {
  const groups = getTileGroups();
  let html =
  '<div class="coach-top-row">' +
    '<div></div>' +
    '<div class="coach-top-right">' +
      getTileIndexToggleHtml() +
    '</div>' +
  '</div>';

  for (const group of groups) {
    let groupHtml = "";

    for (const key of group.keys) {
  for (let i = 0; i < counts[key]; i++) {
    groupHtml += renderCoachTile(key);
  }
}

    if (groupHtml !== "") {
      html += '<div class="hand-section">';
      html += '<div class="hand-section-title">' + group.title + '</div>';
      html += groupHtml;
      html += '</div>';
    }
}
 const startingResult =
  evaluate17TE(
    MJC_STATE.getEngineInput()
  );

 const startingStructureState =
  startingResult.structureState ||
  startingResult;

 checkEscaleraOpportunity(
  counts,
  startingStructureState.completeBoxes
 );

  checkSevenPairsOpportunity(
    startingStructureState
  );

  configureHDMode();

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

function getMahjongResultMessage() {
  if (
    ruleset === "filipino16" &&
    lastActionSource === "draw"
  ) {
    return "Bunot!";
  }

  return "That's Mahjong!";
}

function selectSVDiscardTile(tileKey, tileElement) {
  if (
    hdMode !== "current" ||
    gameAction !== "discard"
  ) {
    return;
  }

  if (!tileKey || counts[tileKey] <= 0) {
    return;
  }

if (
  tileElement &&
  tileElement.classList.contains("exposed-meld-tile")
) {
  openDialog("exposedMeldDiscardDialog");
  return;
}

  selectedDiscardTileKey = tileKey;

  document
    .querySelectorAll("#handDisplay .hand-tile.discard-selected")
    .forEach(function(tile) {
      tile.classList.remove("discard-selected");
    });

  if (tileElement) {
    tileElement.classList.add("discard-selected");
  }

requestCHDDiscardConfirmation();

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

  const escaleraMahjong =
  isEscaleraMahjong();

const sevenPairsMahjong =
  isSevenPairsMahjong();

if (
  result.mahjong ||
  escaleraMahjong ||
  sevenPairsMahjong
) {

  gameAction = "mahjong";

  if (handInstruction) {
    handInstruction.textContent =
      getMahjongResultMessage();
  }

  const drawBtn =
    document.getElementById("drawBtn");
  const claimBtn =
    document.getElementById("claimBtn");


  [drawBtn, claimBtn].forEach(function(button) {
    if (!button) return;

    button.disabled = true;
    button.classList.remove("enabled");
    button.classList.add("disabled");
  });

  // Mahjong end-state controls.
  const hdPrimaryRow =
    document.getElementById("hdPrimaryRow");

  const startingUtilityRow =
    document.getElementById("startingUtilityRow");


  const currentCorrectionRow =
  document.getElementById("currentCorrectionRow");

const correctLastBtn =
  document.getElementById("correctLastBtn");

const handCorrectionBtn =
  document.getElementById("handCorrectionBtn");

const newGameRow =
  document.getElementById("newGameRow");

hdPrimaryRow.classList.add("hidden");
startingUtilityRow.classList.add("hidden");

currentCorrectionRow.classList.remove("hidden");

handCorrectionBtn.classList.add("hidden");
correctLastBtn.classList.remove("hidden");

newGameRow.classList.remove("hidden");
}
  const structureState =
    result.structureState || result;


 const eyeCandidates =
  checkSevenPairsOpportunity(structureState);


if (!escaleraMode) {
  checkEscaleraOpportunity(
    counts,
    structureState.completeBoxes
  );
}

checkBOLOEyesOpportunity(result, eyeCandidates);

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
  renderCoachTile(key, {
    extraClass:
      isLastDrawn ? 'last-drawn' : ''
  });


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

         return renderCoachTile(tileKey, {
  extraClass:
    (isLastDrawn ? "last-drawn " : "") +
    (box.visibility === "exposed" ? "exposed-meld-tile" : "")
});


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

  let html =
  '<div class="coach-top-row">' +
    '<div></div>' +
    '<div class="coach-top-right">' +
      getTileIndexToggleHtml() +
    '</div>' +
  '</div>';

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

  if (
    hdMode === "current" &&
    gameAction === "discard"
  ) {
    handDisplay
      .querySelectorAll(".coach-tile[data-key]")
      .forEach(function(tile) {
        tile.addEventListener("click", function() {
          selectSVDiscardTile(
            tile.dataset.key,
            tile
          );
        });
      });

    if (selectedDiscardTileKey) {
      const selectedTile =
        handDisplay.querySelector(
          '.coach-tile[data-key="' +
          selectedDiscardTileKey +
          '"]'
        );

      if (selectedTile) {
        selectedTile.classList.add("discard-selected");
      }
    }
  }
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

  const hdPrimaryRow =
    document.getElementById("hdPrimaryRow");
  
  const drawBtn = document.getElementById("drawBtn");
  const chowBtn = document.getElementById("chowBtn");
  const pongBtn = document.getElementById("pongBtn");
  const kangBtn = document.getElementById("kangBtn");
  const mahjongBtn = document.getElementById("mahjongBtn");
  const mahjongDrawBtn = document.getElementById("mahjongDrawBtn");
  
  const acquireActionGroup = document.getElementById("acquireActionGroup");

  const normalAcquireRow =
    document.getElementById("normalAcquireRow");

  const mahjongAcquireRow =
    document.getElementById("mahjongAcquireRow");
  
  const coachingBtn = document.getElementById("coachingBtn");
  const correctLastBtn = document.getElementById("correctLastBtn");
  const handCorrectionBtn = document.getElementById("handCorrectionBtn");
  const startingUtilityRow = document.getElementById("startingUtilityRow");
  const currentCorrectionRow = document.getElementById("currentCorrectionRow");
  const newGameRow = document.getElementById("newGameRow");
  const gameHistoryRow = document.getElementById("gameHistoryRow");
  const enginePanel = document.getElementById("enginePanel");

  const total = getTotal();
  const setupContext = "Seat: " + getWindLabel(seatWind) +
    " | Round: " + getWindLabel(prevailingWind);

  
// Clear DR until the current Coaching View is rendered.
const discardRecommendation =
  document.getElementById("discardRecommendation");

if (discardRecommendation) {
  discardRecommendation.classList.add("hidden");
}

const discardRecommendationText =
  document.getElementById("discardRecommendationText");

if (discardRecommendationText) {
  discardRecommendationText.textContent = "";
}

  enginePanel.classList.toggle("hidden", !coachingOn);

const pathwaysHelpLink =
  document.getElementById("pathwaysHelpLink");

if (pathwaysHelpLink) {
  pathwaysHelpLink.classList.toggle(
    "hidden",
    !coachingOn || !window.pathwaysOn
  );
}

const pathwaysBtn =
  document.getElementById("pathwaysBtn");

if (pathwaysBtn) {
  pathwaysBtn.disabled = !coachingOn;
  pathwaysBtn.textContent = !coachingOn
    ? "Pathways: NA"
    : (window.pathwaysOn ? "Pathways: Off" : "Pathways: On");
}

  drawBtn.classList.remove("hidden");
  chowBtn.classList.remove("hidden");
  pongBtn.classList.remove("hidden");
  kangBtn.classList.remove("hidden");



reviseBtn.classList.remove("hidden");
coachingBtn.classList.remove("hidden");
correctLastBtn.classList.remove("hidden");
handCorrectionBtn.classList.remove("hidden");


  const canAcquire =
  gameAction === "draw";

const canDraw =
  canAcquire;

const canMeld =
  canAcquire &&
  !kangReplacementDraw;

const canDiscard =
  gameAction === "discard";

drawBtn.disabled = !canDraw;
chowBtn.disabled = !canMeld;
pongBtn.disabled = !canMeld;
kangBtn.disabled = !canMeld;
if (mahjongDrawBtn) {
  mahjongDrawBtn.disabled = !canDraw;
}

drawBtn.classList.toggle("enabled", canDraw);
drawBtn.classList.toggle("disabled", !canDraw);

if (mahjongDrawBtn) {
  mahjongDrawBtn.classList.toggle("enabled", canDraw);
  mahjongDrawBtn.classList.toggle("disabled", !canDraw);
}


chowBtn.classList.toggle("enabled", canMeld);
chowBtn.classList.toggle("disabled", !canMeld);

pongBtn.classList.toggle("enabled", canMeld);
pongBtn.classList.toggle("disabled", !canMeld);

kangBtn.classList.toggle("enabled", canMeld);
kangBtn.classList.toggle("disabled", !canMeld);



acquireActionGroup.classList.toggle(
  "hidden",
  !canAcquire
);

if (hdMode === "starting") {
  const startingResult =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  const startingStructureState =
    startingResult.structureState ||
    startingResult;

  checkSevenPairsOpportunity(
    startingStructureState
  );
}

let isMahjongWatch = false;

if (canAcquire) {
  const currentResult =
    evaluate17TE(MJC_STATE.getEngineInput());

  isMahjongWatch =
    currentResult.mahjongWatch === true ||
    isSevenPairsMahjongWatch();
}

mahjongBtn.disabled = !isMahjongWatch;

mahjongBtn.classList.toggle(
  "enabled",
  isMahjongWatch
);

mahjongBtn.classList.toggle(
  "disabled",
  !isMahjongWatch
);

normalAcquireRow.classList.toggle(
  "hidden",
  !canAcquire || isMahjongWatch
);

mahjongAcquireRow.classList.toggle(
  "hidden",
  !canAcquire || !isMahjongWatch
);


  startingUtilityRow.classList.remove("hidden");
currentCorrectionRow.classList.remove("hidden");

reviseBtn.classList.toggle(
  "hidden",
  hdMode !== "starting"
);

handCorrectionBtn.classList.toggle(
  "hidden",
  hdMode !== "current"
);

correctLastBtn.classList.toggle(
  "hidden",
  hdMode !== "current"
);
  

  correctLastBtn.disabled = !(hdMode === "current" && lastActionSnapshot);
  correctLastBtn.classList.toggle("disabled", !(hdMode === "current" && lastActionSnapshot));
  handCorrectionBtn.disabled = hdMode !== "current";
  newGameRow.classList.toggle("hidden", hdMode !== "current");
  gameHistoryRow.classList.toggle("hidden", hdMode !== "current");

if (gameAction === "mahjong") {
  hdPrimaryRow.classList.add("hidden");
  startingUtilityRow.classList.add("hidden");

  currentCorrectionRow.classList.remove("hidden");
  handCorrectionBtn.classList.add("hidden");
  correctLastBtn.classList.remove("hidden");

  newGameRow.classList.remove("hidden");
}

if (gameAction !== "mahjong") {
  hdPrimaryRow.classList.remove("hidden");
}
  coachingBtn.textContent = coachingOn ? "Standard View" : "Coaching View";

  if (hdMode === "starting") {
    handTitle.textContent = "Starting Hand";
  
  if (coachingOn) {
  handInstruction.innerHTML =
  "Here's your hand organized using " +
  '<button type="button" id="sixBoxTheoryLink" class="six-box-link">Six Box Theory™</button>.<br>' +
  (gameAction === "draw"
      ? "Prepare to Draw or Claim a tile."
      : "Select a tile to discard.");

const sixBoxTheoryLink =
  document.getElementById("sixBoxTheoryLink");

if (sixBoxTheoryLink) {
  sixBoxTheoryLink.addEventListener(
    "click",
    openUnderstandingBoxesDialog
  );
}

} else {
  handInstruction.innerHTML =
  kangReplacementDraw
    ? (

        replacementDrawSource === "news"
  ? "NEWS declared.<br>Draw replacement tile."
  : (
      replacementDrawSource === "sagasa"
        ? "Sagasa declared.<br>Draw replacement tile."
        : "Kang declared.<br>Draw replacement tile."
    )

      )
    : (
        gameAction === "draw"
          ? "Prepare to Draw or Claim.<br>Press Draw or Claim when ready."
          : "Select a tile to discard.<br>Press Discard when ready."
      );

}
    handInstruction.classList.remove("hidden");
    handMeta.textContent =
      "Role: " + (role === "dealer" ? "Dealer" : "Player") +
      " | Tiles: " + total +
      " | " + setupContext;

    return;
  }

  handTitle.textContent = "Current Hand";
  handMeta.textContent = setupContext;
  handInstruction.innerHTML =
  kangReplacementDraw
    ? (
 
       replacementDrawSource === "news"
  ? "NEWS declared.<br>Draw replacement tile."
  : (
      replacementDrawSource === "sagasa"
        ? "Sagasa declared.<br>Draw replacement tile."
        : "Kang declared.<br>Draw replacement tile."
    )

      )
    : (
        gameAction === "draw"
  ? "Prepare to Draw or Claim a tile."
  : "Select a tile to discard."
      );
  handInstruction.classList.remove("hidden");

}

function renderEscaleraBox(highlightState) {
  if (
    !escaleraMode ||
    !escaleraBoxState.active ||
    !escaleraBoxState.candidateTileKeys.length
  ) {
    return "";
  }

  const tileHtml =
    escaleraBoxState.candidateTileKeys
      .map(function(tileKey) {
        const isLastDrawn =
          tileKey === lastDrawnTileKey &&
          !highlightState.used;

        if (isLastDrawn) {
          highlightState.used = true;
        }

        return renderCoachTile(tileKey, {
          extraClass:
            isLastDrawn ? "last-drawn" : ""
        });
      })
      .join("");

  const escaleraBoxLabel =
    escaleraBoxState.complete
      ? "Escalera Box — Complete"
      : "Escalera Box";

  return (
    '<div class="hand-section box-card developing-box escalera-box">' +
      '<div class="hand-section-title">' +
        escaleraBoxLabel +
      '</div>' +
      tileHtml +
    '</div>'
  );
}


function renderEscaleraShortForm(
  completeBoxes,
  developingBoxes,
  halfEye,
  reserves,
  highlightState
) {
  let html = "";

  /*
  ================================================
  ESCALERA SHORT-FORM STRUCTURE

  Escalera target = 4 structural boxes total.

  The Escalera itself occupies one box:
  - incomplete = Developing Box
  - complete   = Complete Box

  Remaining structures fill the other positions.
  ================================================
  */

  const supportCounts = { ...counts };

  /*
  Reserve one copy of every tile currently assigned
  to the Escalera.
  */

  escaleraBoxState.candidateTileKeys.forEach(function(tileKey) {
    supportCounts[tileKey] =
      Math.max(
        0,
        (supportCounts[tileKey] || 0) - 1
      );
  });

  function canUseSupportTiles(tileKeys) {
    const needed = {};

    tileKeys.forEach(function(tileKey) {
      needed[tileKey] =
        (needed[tileKey] || 0) + 1;
    });

    return Object.keys(needed).every(function(tileKey) {
      return (
        (supportCounts[tileKey] || 0) >=
        needed[tileKey]
      );
    });
  }

  function consumeSupportTiles(tileKeys) {
    tileKeys.forEach(function(tileKey) {
      supportCounts[tileKey] -= 1;
    });
  }

  /*
  ================================================
  Find supporting Complete Boxes first.
  ================================================
  */

  const supportingCBs = [];

  completeBoxes.forEach(function(box) {
    if (
      supportingCBs.length < 3 &&
      canUseSupportTiles(box.tiles)
    ) {
      supportingCBs.push(box);
      consumeSupportTiles(box.tiles);
    }
  });

  /*
  Escalera's structural position comes after any
  supporting CBs already complete.
  */

  const escaleraBoxNumber =
    supportingCBs.length + 1;

  /*
  ================================================
  Find remaining Developing Boxes.

  Total structural target is always 4, including
  the Escalera itself.
  ================================================
  */

  const supportingDBs = [];

  const maxSupportingDBs =
    Math.max(
      0,
      3 - supportingCBs.length
    );

  developingBoxes.forEach(function(box) {
    if (
      supportingDBs.length < maxSupportingDBs &&
      canUseSupportTiles(box.tiles)
    ) {
      supportingDBs.push({
        kind: "developing",
        box: box
      });

      consumeSupportTiles(box.tiles);
    }
  });

  if (
    supportingDBs.length < maxSupportingDBs &&
    halfEye &&
    halfEye.length > 0 &&
    canUseSupportTiles(halfEye[0].tiles)
  ) {
    supportingDBs.push({
      kind: "halfEye",
      box: halfEye[0]
    });

    consumeSupportTiles(halfEye[0].tiles);
  }

  /*
  ================================================
  Reserves
  ================================================
  */

  html += renderReserveArea(
    reserves,
    highlightState
  );

  /*
  ================================================
  Developing Boxes
  ================================================
  */

  html +=
    '<div class="developing-area">' +
      '<div class="engine-title">Developing Boxes</div>';

  /*
  Incomplete Escalera = DB.
  */

  if (!escaleraBoxState.complete) {
    const tileHtml =
      escaleraBoxState.candidateTileKeys
        .map(function(tileKey) {
          const isLastDrawn =
            tileKey === lastDrawnTileKey &&
            !highlightState.used;

          if (isLastDrawn) {
            highlightState.used = true;
          }

          return renderCoachTile(tileKey, {
            extraClass:
              isLastDrawn ? "last-drawn" : ""
          });
        })
        .join("");

    html +=
      '<div class="hand-section box-card developing-box escalera-box">' +
        '<div class="hand-section-title">DB' +
          escaleraBoxNumber +
          ' — Escalera Candidate</div>' +
        tileHtml +
      '</div>';
  }

  /*
  Supporting DB numbering begins after:
  supporting CBs + Escalera position.
  */

  supportingDBs.forEach(function(item, index) {
    const box = item.box;

    const dbNumber =
      supportingCBs.length +
      2 +
      index;

    const tileHtml =
      box.tiles.map(function(tileKey) {
        const isLastDrawn =
          tileKey === lastDrawnTileKey &&
          !highlightState.used;

        if (isLastDrawn) {
          highlightState.used = true;
        }

        return renderCoachTile(tileKey, {
          extraClass:
            isLastDrawn ? "last-drawn" : ""
        });
      }).join("");

    const label =
      item.kind === "halfEye"
        ? "Half Eye"
        : getBoxTypeLabel(box.type);

    html +=
      '<div class="hand-section box-card developing-box">' +
        '<div class="hand-section-title">DB' +
          dbNumber + ' — ' +
          label +
        '</div>' +
        tileHtml +
      '</div>';
  });

  /*
  Empty DB positions preserve the four-box model.
  */

  const occupiedBoxCount =
    supportingCBs.length +
    1 +
    supportingDBs.length;

  for (
    let boxNumber = occupiedBoxCount + 1;
    boxNumber <= 4;
    boxNumber++
  ) {
    html +=
      '<div class="hand-section box-card empty-box">' +
        '<div class="hand-section-title">DB' +
          boxNumber +
        '</div>' +
        '<span class="empty-note">Empty</span>' +
      '</div>';
  }

  html += '</div>';

  /*
  ================================================
  Completed Boxes
  ================================================
  */

  const hasCompletedEscalera =
    escaleraBoxState.complete === true;

  if (
    supportingCBs.length > 0 ||
    hasCompletedEscalera
  ) {
    html +=
      '<div class="completed-area">' +
        '<div class="engine-title">Completed Boxes</div>';

    supportingCBs.forEach(function(box, index) {
      const cbNumber = index + 1;

      const tileHtml =
        box.tiles.map(function(tileKey) {
          const isLastDrawn =
            tileKey === lastDrawnTileKey &&
            !highlightState.used;

          if (isLastDrawn) {
            highlightState.used = true;
          }

          return renderCoachTile(tileKey, {
            extraClass:
              isLastDrawn ? "last-drawn" : ""
          });
        }).join("");

      const cbExtraClass =
        box.type === "kang"
          ? " wide-box"
          : "";

      html +=
        '<div class="hand-section box-card complete-box' +
          cbExtraClass +
        '">' +
          '<div class="hand-section-title">CB' +
            cbNumber + ' — ' +
            box.type.charAt(0).toUpperCase() +
            box.type.slice(1) +
            (
              box.type === "eye"
                ? ""
                : " — " +
                  (
                    box.visibility === "exposed"
                      ? "Exposed"
                      : "Hidden"
                  )
            ) +
          '</div>' +
  '<div class="cb-tile-row">' +
    tileHtml +
  '</div>' +
'</div>';
    });

    /*
    Complete Escalera becomes a CB in the same
    structural position it occupied as a DB.
    */

    if (hasCompletedEscalera) {
      const tileHtml =
        escaleraBoxState.candidateTileKeys
          .map(function(tileKey) {
            const isLastDrawn =
              tileKey === lastDrawnTileKey &&
              !highlightState.used;

            if (isLastDrawn) {
              highlightState.used = true;
            }

            return renderCoachTile(tileKey, {
              extraClass:
                isLastDrawn ? "last-drawn" : ""
            });
          })
          .join("");

      html +=
        '<div class="hand-section box-card complete-box escalera-box">' +
          '<div class="hand-section-title">CB' +
            escaleraBoxNumber +
            ' — Escalera</div>' +
          tileHtml +
        '</div>';
    }

    html += '</div>';
  }

  return html;
}


function renderSevenPairsShortForm(
  highlightState
) {
  const meldState =
    getSevenPairsMeldState();

  let html = "";

  const completionOrder =
    sevenPairsBoxState.completionOrder || [];

  const sevenPairsComplete =
    sevenPairsBoxState.complete === true;

  const meldComplete =
    Boolean(meldState.completeBox);

  /*
  ================================================
  RESERVES
  ================================================
  */

  html += renderReserveArea(
    meldState.reserves,
    highlightState
  );

  /*
  ================================================
  DEVELOPING BOXES
  ================================================
  */

  html +=
    '<div class="developing-area">' +
      '<div class="engine-title">Developing Boxes</div>';

  if (!sevenPairsComplete) {
    const pairHtml =
      sevenPairsBoxState.pairTileKeys
        .map(function(tileKey) {
          let html = "";

          for (let i = 0; i < 2; i++) {
            const isLastDrawn =
              tileKey === lastDrawnTileKey &&
              !highlightState.used;

            if (isLastDrawn) {
              highlightState.used = true;
            }

            html += renderCoachTile(tileKey, {
              extraClass:
                isLastDrawn ? "last-drawn" : ""
            });
          }

          return html;
        })
        .join("");

    html +=
      '<div class="hand-section box-card developing-box seven-pairs-box">' +
        '<div class="hand-section-title">DB1 — ' +
          (
            ruleset === "filipino16"
              ? "Siete Pares Box"
              : "Seven Pairs Box"
          ) +
        '</div>' +
        pairHtml +
      '</div>';
  }

  if (!meldComplete) {
    if (meldState.developingBox) {
      const box =
        meldState.developingBox;

      const tileHtml =
        box.tiles.map(function(tileKey) {
          const isLastDrawn =
            tileKey === lastDrawnTileKey &&
            !highlightState.used;

          if (isLastDrawn) {
            highlightState.used = true;
          }

          return renderCoachTile(tileKey, {
            extraClass:
              isLastDrawn ? "last-drawn" : ""
          });
        }).join("");

      const dbNumber =
        sevenPairsComplete ? 1 : 2;

      html +=
        '<div class="hand-section box-card developing-box">' +
          '<div class="hand-section-title">DB' +
            dbNumber +
            ' — ' +
            getBoxTypeLabel(box.type) +
          '</div>' +
          tileHtml +
        '</div>';
    } else {
      const dbNumber =
        sevenPairsComplete ? 1 : 2;

      html +=
        '<div class="hand-section box-card empty-box">' +
          '<div class="hand-section-title">DB' +
            dbNumber +
          '</div>' +
          '<span class="empty-note">Empty</span>' +
        '</div>';
    }
  }

  html += '</div>';

  /*
  ================================================
  COMPLETED BOXES
  ================================================
  */

  if (
    sevenPairsComplete ||
    meldComplete
  ) {
    html +=
      '<div class="completed-area">' +
        '<div class="engine-title">Completed Boxes</div>';

    completionOrder.forEach(
      function(boxType, index) {
        const cbNumber =
          index + 1;

        if (boxType === "sevenPairs") {
          const pairHtml =
            sevenPairsBoxState.pairTileKeys
              .map(function(tileKey) {
                let html = "";

                for (let i = 0; i < 2; i++) {
                  const isLastDrawn =
                    tileKey === lastDrawnTileKey &&
                    !highlightState.used;

                  if (isLastDrawn) {
                    highlightState.used = true;
                  }

                  html += renderCoachTile(tileKey, {
                    extraClass:
                      isLastDrawn
                        ? "last-drawn"
                        : ""
                  });
                }

                return html;
              })
              .join("");

          html +=
            '<div class="hand-section box-card complete-box seven-pairs-box">' +
              '<div class="hand-section-title">CB' +
                cbNumber +
                ' — ' +
                (
                  ruleset === "filipino16"
                    ? "Siete Pares"
                    : "Seven Pairs"
                ) +
              '</div>' +
              pairHtml +
            '</div>';
        }

        if (
          boxType === "meld" &&
          meldState.completeBox
        ) {
          const box =
            meldState.completeBox;

          const tileHtml =
            box.tiles.map(function(tileKey) {
              const isLastDrawn =
                tileKey === lastDrawnTileKey &&
                !highlightState.used;

              if (isLastDrawn) {
                highlightState.used = true;
              }

              return renderCoachTile(tileKey, {
                extraClass:
                  isLastDrawn ? "last-drawn" : ""
              });
            }).join("");

          const cbExtraClass =
            box.type === "kang"
              ? " wide-box"
              : "";

          html +=
            '<div class="hand-section box-card complete-box' +
              cbExtraClass +
            '">' +
              '<div class="hand-section-title">CB' +
                cbNumber +
                ' — ' +
                box.type.charAt(0).toUpperCase() +
                box.type.slice(1) +
              '</div>' +
              '<div class="cb-tile-row">' +
                tileHtml +
              '</div>' +
            '</div>';
        }
      }
    );

    html += '</div>';
  }

  return html;
}

function renderThreeTileCPCPathways(box, tileParts) {
  const chow = box.fp.structuralPossibilities[0];
  const pong = box.fp.structuralPossibilities[1];
  const pairFirst = box.tiles[0] === box.tiles[1];

  function indicator(pathway, isPong) {
    return '<div class="pathway-indicator">' +
      '<div class="pathway-ea">' +
        pathway.effectiveAcceptance +
      '</div>' +
      '<div class="pathway-arrow pathway-arrow-left' +
        (isPong ? ' pathway-complex' : '') +
      '">↓</div>' +
    '</div>';
  }

  function summary(label, pathway) {
    return '<div class="pathway-fp-summary pathway-cpc-summary">' +
      '<span>' + label + '</span>' +
      '<span>Acceptance: ' + pathway.acceptance + '</span>' +
      '<span>Sources: ' + pathway.currentSources + '</span>' +
    '</div>';
  }

  const row = pairFirst
    ? tileParts[0] + tileParts[1] +
      indicator(pong, true) +
      indicator(chow, false) +
      tileParts[2]
    : tileParts[0] +
      indicator(chow, false) +
      tileParts[1] + tileParts[2] +
      indicator(pong, true);

  return '<div class="pathway-dsw-display">' +
    '<div class="pathway-tile-row">' + row + '</div>' +
  '</div>' +
    summary('Chow', chow) +
    summary('Pong', pong);
}
function renderActiveArea(
  completeBoxes,
  developingBoxes,
  halfEye,
  highlightState,
  options = {}
) {
  let html =
  '<div class="developing-area">' +
    '<div class="engine-title">Developing Boxes</div>';

  html += renderEscaleraBox(highlightState);
if (typeof renderSevenPairsBox === "function") {
  html += renderSevenPairsBox(highlightState);
}

  const firstActiveBoxNumber =
  options.firstActiveBoxNumber ||
  (completeBoxes.length + 1);

  developingBoxes.forEach(function(box, index) {
    const boxNumber = firstActiveBoxNumber + index;

    const tileHtmlParts = box.tiles.map(function(tileKey) {
  const isLastDrawn =
    tileKey === lastDrawnTileKey &&
!highlightState.used

  if (isLastDrawn) {
    highlightState.used = true;
  }

  return renderCoachTile(tileKey, {
  extraClass: isLastDrawn ? "last-drawn" : ""
});


});

const tileHtml = tileHtmlParts.join("");

    const dbExtraClass =
  box.type === "cpc"
    ? " wide-box"
    : "";

const isDSW =
  box.type === "dsw";

const showDSWPathways =
    isDSW && window.pathwaysOn;

const isMW =
  box.type === "mw";

const showMWPathways =
  isMW && window.pathwaysOn;

const isEW =
  box.type === "ew";

const showEWPathways =
  isEW && window.pathwaysOn;

const isEPC =
  box.type === "epc";

const showEPCPathways =
  isEPC && window.pathwaysOn;

const isCPC =
  box.type === "cpc";

const showThreeTileCPCPathways =
  isCPC &&
  window.pathwaysOn &&
  box.tiles.length === 3 &&
  box.fp.structuralPossibilities.length === 2;

const showCPCPathways =
  isCPC &&
  window.pathwaysOn &&
  box.tiles.length === 4 &&
  box.fp.structuralPossibilities.length >= 3;

if (isCPC) console.log("CPC BOX:", box);
const isCPCMirror =
  isCPC &&
  box.fp.structuralPossibilities[0].keyTile.endsWith("7");

html +=
  '<div class="hand-section box-card developing-box' +
    dbExtraClass +
    (showDSWPathways ? ' pathway-dsw' : '') +
  '">' +
    '<div class="hand-section-title">DB' + boxNumber + ' — ' +
      getBoxTypeLabel(box.type) +
    '</div>' +

    (showDSWPathways
  ? '<div class="pathway-dsw-display">' +
      '<div class="pathway-indicator">' +
        '<div class="pathway-ea">' +
          box.fp.pathways[0].effectiveAcceptance +
        '</div>' +
        '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
      '</div>' +
      '<div class="pathway-tile-row">' + tileHtml + '</div>' +
      '<div class="pathway-indicator">' +
        '<div class="pathway-ea">' +
          box.fp.pathways[1].effectiveAcceptance +
        '</div>' +
        '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
      '</div>' +
    '</div>' +
    '<div class="pathway-fp-summary">' +
      '<span>Acceptance: ' + box.fp.acceptance + '</span>' +
      '<span>Sources: ' + box.fp.currentSources + '</span>' +
    '</div>'

  : showMWPathways
    ? '<div class="pathway-dsw-display">' +
        '<div class="pathway-tile-row">' +
          renderCoachTile(box.tiles[0]) +
          '<div class="pathway-indicator">' +
            '<div class="pathway-ea">' +
              box.fp.pathways[0].effectiveAcceptance +
            '</div>' +
            '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
'</div>' +
          renderCoachTile(box.tiles[1]) +

        '</div>' +
      '</div>' +
      '<div class="pathway-fp-summary">' +
        '<span>Acceptance: ' + box.fp.acceptance + '</span>' +
        '<span>Sources: ' +
  box.fp.pathways[0].currentSources +
'</span>' +
      '</div>'

: showEWPathways
  ? '<div class="pathway-dsw-display">' +
      (
       box.fp.pathways[0].completingTile.endsWith("3")

          ? '<div class="pathway-tile-row">' +
    tileHtml +
  '</div>' +
  '<div class="pathway-indicator">' +
    '<div class="pathway-ea">' +
      box.fp.pathways[0].effectiveAcceptance +
    '</div>' +
    '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
  '</div>'

: '<div class="pathway-indicator">' +
    '<div class="pathway-ea">' +
      box.fp.pathways[0].effectiveAcceptance +
    '</div>' +
    '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
  '</div>' +
  '<div class="pathway-tile-row">' +
    tileHtml +
  '</div>'

      ) +
    '</div>' +
    '<div class="pathway-fp-summary">' +
      '<span>Acceptance: ' + box.fp.acceptance + '</span>' +
      '<span>Sources: ' +
        box.fp.pathways[0].currentSources +
      '</span>' +
    '</div>'

        : showEPCPathways
      ? '<div class="pathway-dsw-display">' +
          '<div class="pathway-tile-row">' +
            tileHtml +
          '</div>' +
          '<div class="pathway-indicator">' +
            '<div class="pathway-ea">' +
              box.fp.pathways[0].effectiveAcceptance +
            '</div>' +
            '<div class="pathway-arrow pathway-arrow-left pathway-complex">↓</div>' +
          '</div>' +
        '</div>' +
        '<div class="pathway-fp-summary">' +
          '<span>Acceptance: ' +
            box.fp.pathways[0].acceptance +
          '</span>' +
          '<span>Sources: ' +
            box.fp.pathways[0].currentSources +
          '</span>' +
        '</div>'

                    : showThreeTileCPCPathways
  ? renderThreeTileCPCPathways(box, tileHtmlParts)
  : showCPCPathways
        ? '<div class="pathway-dsw-display">' +
            '<div class="pathway-tile-row">' +

             renderCoachTile(box.tiles[0]) +
(isCPCMirror
  ? '<div class="pathway-indicator">' +
      '<div class="pathway-ea">' +
        box.fp.structuralPossibilities[0].effectiveAcceptance +
      '</div>' +
      '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
    '</div>' +
'<div class="pathway-indicator">' +
  '<div class="pathway-ea">' +
    box.fp.structuralPossibilities[2].effectiveAcceptance +
  '</div>' +
  '<div class="pathway-arrow pathway-arrow-left pathway-complex">↓</div>' +
'</div>' +
renderCoachTile(box.tiles[1])
  : renderCoachTile(box.tiles[1])) +

              (isCPCMirror
  ? ''
  : '<div class="pathway-indicator">' +
      '<div class="pathway-ea">' +
        box.fp.structuralPossibilities[0].effectiveAcceptance +
      '</div>' +
      '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
    '</div>') +

              (isCPCMirror
  ? '<div class="pathway-indicator">' +
      '<div class="pathway-ea">' +
        box.fp.structuralPossibilities[1].effectiveAcceptance +
      '</div>' +
      '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
    '</div>'
  : '') +

              renderCoachTile(box.tiles[2]) +

              (isCPCMirror
  ? ''
  : '<div class="pathway-indicator">' +
      '<div class="pathway-ea">' +
        box.fp.structuralPossibilities[2].effectiveAcceptance +
      '</div>' +
      '<div class="pathway-arrow pathway-arrow-left pathway-complex">↓</div>' +
    '</div>') +



(isCPCMirror
  ? ''
  : '<div class="pathway-indicator">' +
      '<div class="pathway-ea">' +
        box.fp.structuralPossibilities[1].effectiveAcceptance +
      '</div>' +
      '<div class="pathway-arrow pathway-arrow-left">↓</div>' +
    '</div>') +
              renderCoachTile(box.tiles[3]) +

'</div>' +
'</div>' +
'<div class="pathway-fp-summary pathway-cpc-summary">' +
  '<span>Chow</span>' +
  '<span>Acceptance: ' +
    box.fp.structuralPossibilities[0].acceptance +
  '</span>' +
  '<span>Sources: ' +
    box.fp.structuralPossibilities[0].currentSources +
  '</span>' +
'</div>'

+
'<div class="pathway-fp-summary pathway-cpc-summary">' +
  '<span>Pong</span>' +
  '<span>Acceptance: ' +
    box.fp.structuralPossibilities[2].acceptance +
  '</span>' +
  '<span>Sources: ' +
    box.fp.structuralPossibilities[2].currentSources +
  '</span>' +
'</div>'

: tileHtml) +

  '</div>';


  });

if (halfEye && halfEye.length > 0) {


    const boxNumber =
      firstActiveBoxNumber + developingBoxes.length;

    const tileHtml =
  halfEye[0].tiles.map(function(tileKey) {
    const isLastDrawn =
      tileKey === lastDrawnTileKey &&
      !highlightState.used;

    if (isLastDrawn) {
      highlightState.used = true;
    }

    return renderCoachTile(tileKey, {
      extraClass:
        isLastDrawn ? "last-drawn" : ""
    });
  }).join("");

    const showHEPathways =
  window.pathwaysOn &&
  halfEye[0].fp &&
  halfEye[0].fp.pathways &&
  halfEye[0].fp.pathways.length > 0;

html +=
  '<div class="hand-section box-card developing-box">' +
    '<div class="hand-section-title">DB' +
      boxNumber +
      ' — HE</div>' +

    (showHEPathways
      ? '<div class="pathway-dsw-display">' +
          '<div class="pathway-tile-row">' +
            tileHtml +
          '</div>' +
          '<div class="pathway-indicator">' +
            '<div class="pathway-ea">' +
              halfEye[0].fp.pathways[0].effectiveAcceptance +
            '</div>' +
            '<div class="pathway-arrow pathway-arrow-left pathway-complex">↓</div>' +
          '</div>' +
        '</div>' +
        '<div class="pathway-fp-summary">' +
          '<span>Acceptance: ' +
            halfEye[0].fp.acceptance +
          '</span>' +
          '<span>Sources: ' +
            halfEye[0].fp.pathways[0].currentSources +
          '</span>' +
        '</div>'
      : tileHtml) +

  '</div>';
  }

  const totalBoxes =
  completeBoxes.length +
  developingBoxes.length +
  (halfEye ? halfEye.length : 0);

const targetBoxCount =
  escaleraMode ? 3 : 6;

if (!options.hideEmptyBoxes) {
  for (
    let boxNumber = totalBoxes + 1;
    boxNumber <= targetBoxCount;
    boxNumber++
  ) {
    html +=
      '<div class="hand-section box-card empty-box">' +
        '<div class="hand-section-title">DB' + boxNumber + '</div>' +
        '<span class="empty-note">Empty</span>' +
      '</div>';
  }
}

  html += '</div>';

return html;
}


function renderReserveArea(
  reserves,
  highlightState
) {
  let html =
    '<div class="hand-section reserves-area">' +
      '<div class="hand-section-title">Reserves</div>' +
      '<div class="reserves-holding-area">';

  if (!reserves || reserves.length === 0) {
    html += '<span class="empty-note">None</span>';
  } else {
    html += reserves.map(function(tileKey) {
      const isLastDrawn =
        tileKey === lastDrawnTileKey &&
        !highlightState.used;

      if (isLastDrawn) {
        highlightState.used = true;
      }

      return renderCoachTile(tileKey, {
        extraClass: isLastDrawn ? "last-drawn" : ""
      });
    }).join("");
  }

  html +=
      '</div>' +
    '</div>';

  return html;
}


function renderCompletedArea(
  completeBoxes,
  highlightState
) {
  if (!completeBoxes || completeBoxes.length === 0) {
    return '<div class="engine-placeholder">No Complete Boxes found.</div>';
  }

  let html =
  '<div class="completed-area">' +
    '<div class="engine-title">Completed Boxes</div>';

  
  completeBoxes.forEach(function(box, index) {
    

const tileHtml = box.tiles.map(function(tileKey) {
  const isLastDrawn =
    tileKey === lastDrawnTileKey &&
!highlightState.used

  if (isLastDrawn) {
    highlightState.used = true;
  }

  return renderCoachTile(tileKey, {
  extraClass:
  (isLastDrawn ? "last-drawn " : "") +
  (box.visibility === "exposed" ? "exposed-meld-tile" : "")
});

}).join("");

  const cbExtraClass =
  box.type === "kang" ||
  box.type === "news"
    ? " wide-box"
    : "";

const showReleaseTile =
  hdMode === "current" &&
  gameAction === "draw" &&
  box.visibility !== "exposed" &&
  box.type !== "eye";

    html +=
  '<div class="hand-section box-card complete-box' +
    cbExtraClass +
  '">' +
  '<div class="hand-section-title">CB' + box.boxId + ' — ' +
    box.type.charAt(0).toUpperCase() + box.type.slice(1) +
    (
      box.type === "eye"
        ? ""
        : " — " +
          (box.visibility === "exposed" ? "Exposed" : "Hidden")
        ) +
    (showReleaseTile
  ? ' <button type="button" class="release-tile-button" ' +
    'data-box-id="' + box.boxId + '">RT</button>'
  : '') +

  '</div>' +

  '<div class="cb-tile-row">' +
    tileHtml +
  '</div>' +
'</div>';
  });

  html += '</div>';

return html;
}

let selectedReleaseTileKey = null;
let selectedReleaseBoxId = null;
let releaseTileStep = "tile";

let selectedRTConstraint = null;

function confirmReleaseTile() {

  if (
    releaseTileStep !== "preview" ||
    !selectedRTConstraint
  ) {
    return;
  }

  const rtCommitResult =
    evaluate17TE(
      MJC_STATE.getEngineInput(),
      {
        rtPreviewConstraint:
          selectedRTConstraint,

        rtCommit: true
      }
    );

  if (coachingOn) {
    renderCoachView();
  } else {
    buildHandDisplay();
  }

  cancelReleaseTile();
}

function cancelReleaseTile() {
  selectedReleaseTileKey = null;
  selectedReleaseBoxId = null;
  releaseTileStep = "tile";

  document
    .getElementById("releaseTileBackBtn")
    .classList.add("hidden");

  document
    .getElementById("releaseTileOkBtn")
    .classList.add("hidden");

  document
    .getElementById("releaseTilePreview")
    .classList.add("hidden");

  document
    .getElementById("releaseTileConfirmBtn")
    .classList.add("hidden");

  document
    .getElementById("releaseTilePreview")
    .innerHTML = "";

  closeDialog("releaseTileDialog");
}

function closeReleaseTileNoDestination() {
  selectedReleaseTileKey = null;
  selectedReleaseBoxId = null;
  releaseTileStep = "tile";

  document
    .getElementById("releaseTileOkBtn")
    .classList.add("hidden");

  document
    .getElementById("releaseTileCancelBtn")
    .classList.remove("hidden");

  closeDialog("releaseTileDialog");
}

function backReleaseTileStep() {
  if (releaseTileStep === "preview") {
    releaseTileStep = "destination";

    document.querySelector(
      "#releaseTileDialog h2"
    ).textContent = "Select Alternate Grouping";

    document
      .getElementById("releaseTilePreview")
      .classList.add("hidden");

    document
      .getElementById("releaseTileConfirmBtn")
      .classList.add("hidden");

    return;
  }

  if (releaseTileStep !== "destination") {
    return;
  }

  releaseTileStep = "tile";

  selectedReleaseTileKey = null;

  document.querySelector(
    "#releaseTileDialog h2"
  ).textContent = "Select Tile to Release";

  const releaseTileChoices =
    document.querySelectorAll(
      "#releaseTileChoices .release-tile-choice"
    );

  releaseTileChoices.forEach(function(choice) {
    choice.classList.remove("discard-selected");
    choice.style.pointerEvents = "";
  });

  document
    .getElementById("releaseTileBackBtn")
    .classList.add("hidden");
}

function selectReleaseTileBox(boxId) {
  console.log("RT SELECTED CB:", boxId);
  selectedReleaseBoxId = boxId;
  releaseTileStep = "tile";

document.querySelector(
  "#releaseTileDialog h2"
).textContent = "Select Tile to Release";

  const result = evaluate17TE(MJC_STATE.getEngineInput());
  const structureState =
    result.structureState || result;

const selectedBox =
  structureState.completeBoxes.find(function(box) {
    return String(box.boxId) === String(boxId);
  });

console.log("RT SELECTED BOX:", selectedBox);

console.log(
  "RT DESTINATION DBS:",
  structureState.developingBoxes
);
console.log(
  "RT FIRST DESTINATION DB NUMBER:",
  structureState.completeBoxes.length + 1
);
console.log("RT TILES:", selectedBox.tiles);
const choices = document.getElementById("releaseTileChoices");
console.log("RT CHOICES CONTAINER:", choices);
choices.innerHTML =
  selectedBox.tiles.map(function(tileKey) {
    return renderCoachTile(tileKey, {
     extraClass: "release-tile-choice"
   });
  }).join("");

const releaseTileChoices =
  choices.querySelectorAll(".release-tile-choice");

console.log("RT TILE CHOICES:", releaseTileChoices.length);

releaseTileChoices.forEach(function(tile) {
  tile.addEventListener("click", function() {
    console.log("RT TILE CLICKED:", tile.dataset.key);
releaseTileChoices.forEach(function(choice) {
  choice.classList.remove("discard-selected");
});
  tile.classList.add("discard-selected");
selectedReleaseTileKey = tile.dataset.key;
console.log("RT SELECTED TILE:", selectedReleaseTileKey);

console.log(
  "RT SELECTION:",
  selectedReleaseBoxId,
  selectedReleaseTileKey
);

const viableDestinations =
  findReleaseTileDestinations(
    selectedReleaseTileKey,
    structureState.developingBoxes
  );

console.log(
  "RT VIABLE DESTINATIONS:",
  viableDestinations
);

if (viableDestinations.length === 0) {
  document.querySelector(
    "#releaseTileDialog h2"
  ).textContent =
    "No viable alternate groupings available.";

  document
    .getElementById("releaseTileCancelBtn")
    .classList.add("hidden");

  document
    .getElementById("releaseTileOkBtn")
    .classList.remove("hidden");

  return;
}

releaseTileStep = "destination";

document.querySelector(
  "#releaseTileDialog h2"
).textContent = "Select Alternate Grouping";

releaseTileChoices.forEach(function(choice) {
  choice.style.pointerEvents = "none";
});

document
  .getElementById("releaseTileBackBtn")
  .classList.remove("hidden");

document
  .getElementById("releaseTileCancelBtn")
  .classList.remove("hidden");

document
  .getElementById("releaseTileOkBtn")
  .classList.add("hidden");

const firstDestinationDbNumber =
  structureState.completeBoxes.length + 1;

console.log(
  "RT DESTINATION START:",
  firstDestinationDbNumber
);

let groupingChoicesHtml = "";

viableDestinations.forEach(
  function(destination) {
    const destinationTileHtml =
      destination.tiles
        .map(function(tileKey) {
          return renderCoachTile(tileKey);
        })
        .join("");

    const destinationDbNumber =
      structureState.developingBoxes.indexOf(
        destination
      ) + firstDestinationDbNumber;

    const destinationLabel =
      getBoxTypeLabel(destination.type);

    groupingChoicesHtml +=
      '<div class="rt-grouping" ' +
        'data-db-number="' +
        destinationDbNumber + '">' +
        '<div class="hand-section-title">' +
          'DB' + destinationDbNumber +
          ' — ' + destinationLabel +
        '</div>' +
        '<div>' +
          destinationTileHtml +
        '</div>' +
      '</div>';
  }
);

choices.insertAdjacentHTML(
  "beforeend",
  '<div class="rt-alternate-groupings">' +
    '<div class="rt-alternate-groupings-title">' +
      'Alternate Groupings' +
    '</div>' +
    groupingChoicesHtml +
  '</div>'
);

choices
  .querySelectorAll(".rt-grouping")
  .forEach(function(groupingChoice) {

    groupingChoice.addEventListener(
  "click",
  function() {

    choices
      .querySelectorAll(".rt-grouping-selected")
      .forEach(function(choice) {
        choice.classList.remove(
          "rt-grouping-selected"
        );
      });

    groupingChoice.classList.add(
      "rt-grouping-selected"
    );

const selectedDestinationDbNumber =
  Number(groupingChoice.dataset.dbNumber);

const selectedDestination =
  viableDestinations.find(
    function(destination) {
      return (
        structureState.developingBoxes.indexOf(
          destination
        ) + firstDestinationDbNumber ===
        selectedDestinationDbNumber
      );
    }
  );

    selectedRTConstraint = {
  releasedTileKey:
    selectedReleaseTileKey,

  originBoxId:
    selectedReleaseBoxId,

  originBoxType:
    selectedBox.type,

  originBoxTiles:
    [...selectedBox.tiles],

  destinationDbNumber:
  selectedDestinationDbNumber,

destinationType:
  selectedDestination.type,

destinationTiles:
  [...selectedDestination.tiles]
};

const rtBeforeResult =
  evaluate17TE(
    MJC_STATE.getEngineInput()
  );

const rtBeforeStructure =
  rtBeforeResult.structureState ||
  rtBeforeResult;

const rtPreviewResult =
  evaluate17TE(
    MJC_STATE.getEngineInput(),
    {
      rtPreviewConstraint:
        selectedRTConstraint
    }
  );

  console.warn(
    "RT PREVIEW RESULT RECEIVED:",
    rtPreviewResult
  );

const rtPreviewStructure =
  rtPreviewResult.structureState ||
  rtPreviewResult;

console.warn(
  "RT BEFORE STRUCTURE:",
  rtBeforeStructure
);

console.warn(
  "RT AFTER STRUCTURE:",
  rtPreviewStructure
);

function rtBoxSignature(box) {
  return (
    box.type +
    ":" +
    [...box.tiles].sort().join("|")
  );
}

const rtBeforeSignatures =
  new Set(
    [
      ...rtBeforeStructure.completeBoxes,
      ...rtBeforeStructure.developingBoxes,
      ...(rtBeforeStructure.halfEye || [])
    ].map(rtBoxSignature)
  );

const rtImpactedAfterBoxes =
  [
    ...rtPreviewStructure.completeBoxes,
    ...rtPreviewStructure.developingBoxes,
    ...(rtPreviewStructure.halfEye || [])
  ].filter(function(box) {
    return !rtBeforeSignatures.has(
      rtBoxSignature(box)
    );
  });

console.warn(
  "RT IMPACTED AFTER BOXES:",
  rtImpactedAfterBoxes
);


console.warn(
  "RT PREVIEW STRUCTURE FOR DISPLAY:",
  rtPreviewStructure
);

const rtPreviewHighlightState = {
  used: false
};

const rtImpactedCompleteBoxes =
  rtImpactedAfterBoxes.filter(function(box) {
    return (
      rtPreviewStructure.completeBoxes.includes(box)
    );
  });

const rtImpactedDevelopingBoxes =
  rtImpactedAfterBoxes.filter(function(box) {
    return (
      rtPreviewStructure.developingBoxes.includes(box)
    );
  });

const rtImpactedHalfEye =
  rtImpactedAfterBoxes.filter(function(box) {
    return (
      (rtPreviewStructure.halfEye || [])
        .includes(box)
    );
  });

const rtPreviewHtml =
  '<div class="rt-expected-results-title">' +
    'Expected Results' +
  '</div>' +
  renderActiveArea(
    rtImpactedCompleteBoxes,
    rtImpactedDevelopingBoxes,
    rtImpactedHalfEye,
    rtPreviewHighlightState,
    {
  hideEmptyBoxes: true,
  firstActiveBoxNumber:
    rtPreviewStructure.completeBoxes.length + 1
}
  ) +
  renderCompletedArea(
    rtImpactedCompleteBoxes,
    rtPreviewHighlightState
  );


console.warn(
  "RT PREVIEW HTML:",
  rtPreviewHtml
);

const previewContainer =
  document.getElementById("releaseTilePreview");

previewContainer.innerHTML =
  rtPreviewHtml;
previewContainer.classList.remove("hidden");

previewContainer
  .querySelectorAll(".release-tile-button")
  .forEach(function(button) {
    button.remove();
  });

document.querySelector(
  "#releaseTileDialog h2"
).textContent = "Preview";

releaseTileStep = "preview";

document
  .getElementById("releaseTileConfirmBtn")
  .classList.remove("hidden");

        }
    );
  });


  });
});

  openDialog("releaseTileDialog");
}

function selectCHDDiscardTile(tileKey, tileElement) {
  if (
  gameAction !== "discard" ||
  (
    hdMode !== "current" &&
    !(hdMode === "starting" && role === "dealer")
  )
) {
  return;
}

  if (!tileKey || counts[tileKey] <= 0) {
    return;
  }

if (
  tileElement &&
  tileElement.classList.contains("exposed-meld-tile")
) {
  openDialog("exposedMeldDiscardDialog");
  return;
}

  selectedDiscardTileKey = tileKey;

  document
    .querySelectorAll("#enginePanel .coach-tile.discard-selected")
    .forEach(function(tile) {
      tile.classList.remove("discard-selected");
    });

  if (tileElement) {
    tileElement.classList.add("discard-selected");
  }

requestCHDDiscardConfirmation();

}

function getCoachAlertMessages(
  result,
  structureState
) {
  const messages = [];

if (
  hdMode !== "current" ||
  phase !== "game" ||
  result.mahjong ||
  isEscaleraMahjong() ||
  isSevenPairsMahjong()
) {
  return messages;
}

  const eyeCandidates =
    structureState.developingBoxes.filter(
      function(box) {
        return (
          box.type === "ec" ||
          box.type === "epc"
        );
      }
    );

  const completeBoxCount =
    structureState.completeBoxes.length;

  /*
  ================================================
  Special-Hand Pursuits
  ================================================
  */

  if (
    sevenPairsMode &&
    sevenPairsBoxState.active
  ) {
    messages.push(
      ruleset === "filipino16"
        ? "Pursuing Siete Pares"
        : "Pursuing Seven Pairs"
    );
  }

  if (
    escaleraMode &&
    escaleraBoxState.active
  ) {
    messages.push(
      ruleset === "filipino16"
        ? "Pursuing Escalera"
        : "Pursuing Straight"
    );
  }

  /*
  ================================================
  Eye Coaching

  Siete Pares does not require an Eye.
  Escalera does, so Eye coaching remains active.
  ================================================
  */

  const escaleraBOLOReady =
  escaleraMode &&
  escaleraBoxState.active &&
  escaleraBoxState.complete &&
  escaleraBoxState.remainingMeldCount === 0 &&
  escaleraBoxState.eyeNeeded === true;

const escaleraProtectEyeReady =
  escaleraMode &&
  escaleraBoxState.active &&
  escaleraBoxState.complete &&
  eyeCandidates.length === 1;

if (!sevenPairsMode) {
  if (
    eyeCandidates.length === 0 &&
    (
      completeBoxCount >= 4 ||
      escaleraBOLOReady
    )
  ) {
    messages.push("BOLO for Eyes");
  } else if (
    eyeCandidates.length === 1 &&
    (
      completeBoxCount >= 4 ||
      escaleraProtectEyeReady
    )
  ) {
    messages.push("Protect Your Only Eye");
  }
}

  /*
  ================================================
  Over-Paired

  Existing special-hands logic determines whether
  the normal hand is currently Over-Paired.
  ================================================
  */

  if (
    overPairedActive &&
    !sevenPairsMode
  ) {
    messages.push("Over-Paired");
  }

  /*
  ================================================
  Kang Deferred
  ================================================
  */

  if (
    deferredKangTileKeys.some(function(tileKey) {
      return tileKey !== "news";
    })
  ) {
    messages.push("Kang Deferred");
  }


  return messages;
}

function renderCoachView() {
  const enginePanel =
    document.getElementById("enginePanel");

enginePanel.classList.toggle(
  "coach-short-form",
  window.coachViewForm === "short"
);

enginePanel.classList.toggle(
  "coach-long-form",
  window.coachViewForm === "long"
);

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
  (
    result.mahjong ||
    isEscaleraMahjong()
  ) &&
  handInstruction
) {
  handInstruction.textContent =
    getMahjongResultMessage();
}

  const structureState =
    result.structureState || result;

const hasReserves =
  (structureState.reserves || []).length > 0;

const noReserveTileKeys = hasReserves
  ? []
  : getNoReserveDiscardCandidates(structureState);

const timedRecommendation =
  !hasReserves && noReserveTileKeys.length === 0
    ? getTimedEyeCPCRecommendation(
        structureState,
        result.input?.context || {}
      )
    : null;

const recommendedTileKeys = hasReserves
  ? getReserveDiscardCandidates(
      structureState.reserves,
      result.remainingCounts
    )
  : timedRecommendation
    ? timedRecommendation.tileKeys
    : noReserveTileKeys;

window.currentDiscardRecommendation =
  [...recommendedTileKeys];

const recommendedTileName =
  recommendedTileKeys
    .map(function(tileKey) {
      return tileLabels[tileKey];
    })
    .join(" or ");

const tiedReserves =
  recommendedTileKeys.length > 1;

const reserveTileKeys =
  [...new Set(structureState.reserves || [])];

const allReservesRecommended =
  reserveTileKeys.length > 0 &&
  reserveTileKeys.every(function(tileKey) {
    return recommendedTileKeys.includes(tileKey);
  });

const recommendedDiscardSummary =
  recommendedTileKeys.length > 3
    ? (
        allReservesRecommended
          ? "Any of your " + reserveTileKeys.length + " Reserves"
          : recommendedTileKeys.length +
            (
  hasReserves
    ? " equally recommended Reserves—see Insight"
    : " equally recommended tiles—see Insight"
)
      )
    : recommendedTileName;


const showDiscardRecommendation =
  (
    hdMode === "current" ||
    (hdMode === "starting" && role === "dealer")
  ) &&
  coachingOn &&
  gameAction === "discard" &&
  !kangReplacementDraw &&
  !result.mahjong &&
  !escaleraBoxState.active &&
  !sevenPairsBoxState.active &&
  !!recommendedTileName;

const recommendationArea =
  document.getElementById("discardRecommendation");
const recommendationText =
  document.getElementById("discardRecommendationText");
const insightText =
  document.getElementById("discardInsightText");

const recommendationsVisible =
  window.discardRecommendationsOn !== false;

const recommendationToggle =
  document.getElementById("discardRecommendationToggle");

if (recommendationArea) {
  recommendationArea.classList.toggle(
    "hidden",
    !showDiscardRecommendation
  );

  recommendationArea.classList.toggle(
    "recommendation-hidden",
    !recommendationsVisible
  );
}

if (recommendationToggle) {
  recommendationToggle.textContent =
    recommendationsVisible
      ? "Hide"
      : "Show Recommended Discards";

  recommendationToggle.setAttribute(
    "aria-label",
    recommendationsVisible
      ? "Hide recommended discards"
      : "Show recommended discards"
  );
}

if (recommendationText) {
  recommendationText.classList.toggle(
    "hidden",
    !recommendationsVisible
  );

  recommendationText.textContent =
    showDiscardRecommendation && recommendationsVisible
      ? "Recommended Discard: " +
                recommendedDiscardSummary + "."
      : "";
}

if (insightText) {
  insightText.textContent = "";

  if (showDiscardRecommendation) {
    const recommendedNames = document.createElement("strong");
    recommendedNames.textContent = recommendedTileName;
    insightText.appendChild(recommendedNames);

           const terminalCPCFallback =
      !hasReserves &&
      !(structureState.developingBoxes || []).some(function(box) {
        return ["dsw", "mw", "ew"].includes(box.type);
      });

    const timedExplanation =
  timedRecommendation?.kind === "eye"
    ? ": with little time pressure, MJC favors preserving " +
      "both Chow-Pong Candidates. Their existing pairs " +
      "remain possible Eyes. Discarding this tile breaks " +
      "your Eye Candidate and leaves a Half Eye. " +
      "Your Complete Boxes remain intact."
    : timedRecommendation?.kind === "cpc"
      ? ": as time pressure increases, MJC favors keeping " +

        "your Eye Candidate. Removing this unpaired tile from " +
"a three-tile Chow-Pong Candidate leaves its pair. " +
"Among eligible unpaired tiles, MJC favors the one whose " +
"Chow option has the lowest Effective Acceptance " +
"(EA). Your other Developing Boxes " +

        "and all Complete Boxes remain intact."
      : ": at the current timing, MJC gives equal preference " +
        "to breaking the Eye Candidate or removing the " +    
        "unpaired tile from a three-tile Chow-Pong Candidate. " +

        "The latter leaves its pair. Discard only one of " +
        "the recommended tiles. Your Complete Boxes " +
        "remain intact.";

const explanation = timedRecommendation
  ? timedExplanation
  : terminalCPCFallback
      ? ": this terminal tile can be removed from a " +
        "four-tile Chow-Pong Candidate, leaving a " +
        "three-tile Chow-Pong Candidate with both " +
        "Chow and Pong options. Your other Developing " +
        "Boxes and all Complete Boxes remain intact."
      : !hasReserves
  ? ": with no Reserves, MJC compares your simple " +
    "Chow Candidates by their remaining capacity " +
    "to complete (EA). When EA ties, it considers " +
    "Edge Waits before Middle Waits, then " +
    "Double-Sided Waits, and favors keeping the " +
    "more central tile. Discarding one of the " +
    "recommended tiles breaks its Developing Box " +
    "and leaves your Complete Boxes intact."
  : tiedReserves
      ? ": these Reserves offer equally low contribution " +
        "to developing your hand, based on nearby same-suit " +
        "support, then centricity—how close a tile’s number " +
        "is to the middle of its suit. " +
        "Discarding any one leaves your displayed " +
        "Developing and Complete Boxes intact."
      : " is a Reserve. Discarding it leaves your " +
        "displayed Developing and Complete Boxes intact. " +
        "Among your Reserves, it offers the least contribution " +
        "to developing your hand, based on nearby same-suit " +
        "support, then centricity—how close a tile’s number " +
        "is to the middle of its suit.";

    insightText.appendChild(
      document.createTextNode(explanation)
    );
  }
}

const targetBoxCount =
  escaleraMode &&
  escaleraBoxState.active
    ? 4
    : (
        sevenPairsMode &&
        sevenPairsBoxState.active
          ? 2
          : 6
      );


console.log(
  "Rendered Complete Boxes:",
  structureState.completeBoxes
);

  const tih =
    getTilesInHand(
      structureState
    );

const highlightState = {
  used: false
};

const coachAlertMessages =
  getCoachAlertMessages(
    result,
    structureState
  );

const coachAlertHtml =
  coachAlertMessages.length > 0
    ? (
        '<div id="coachAlertArea" class="coach-alert-area">' +
          coachAlertMessages
            .map(function(message) {
              return (
                '<div class="coach-alert-message">' +
                  message +
                '</div>'
              );
            })
            .join("") +
        '</div>'
      )
    : "";


const displayedCompleteBoxCount =
  sevenPairsMode &&
  sevenPairsBoxState.active
    ? sevenPairsBoxState.completionOrder.length
    : structureState.completeBoxes.length;


  enginePanel.innerHTML =
  '<div class="coach-top-row">' +

    '<div class="coach-status-left">' +
    '<div id="coachMessageArea" class="coach-message-area">' +
      'Boxes Complete: ' +
      displayedCompleteBoxCount +
      ' of ' +
      targetBoxCount +
    '</div>' +
    '<div class="tih-counter">' +
      'Tiles In Hand: ' + tih +
    '</div>' +
    coachAlertHtml +
  '</div>' +

  '<div class="coach-top-right">' +
        getTileIndexToggleHtml() +
    getBoxLabelToggleHtml() +
  '</div>' +

'</div>' +

  (
  window.coachViewForm === "short" &&
  escaleraMode &&
  escaleraBoxState.active
    ? renderEscaleraShortForm(
        structureState.completeBoxes,
        structureState.developingBoxes,
        structureState.halfEye,
        structureState.reserves,
        highlightState
      )
    : (
        window.coachViewForm === "short" &&
        sevenPairsMode &&
        sevenPairsBoxState.active
          ? renderSevenPairsShortForm(
              highlightState
            )
          : (
              renderActiveArea(
                structureState.completeBoxes,
                structureState.developingBoxes,
                structureState.halfEye,
                highlightState
              ) +
              renderReserveArea(
                structureState.reserves,
                highlightState
              ) +
              renderCompletedArea(
                structureState.completeBoxes,
                highlightState
              )
            )
      )
)

if (hdMode === "current" && gameAction === "draw") {
  const rtHeading = enginePanel.querySelector(".completed-area .engine-title");
  if (rtHeading && enginePanel.querySelector(".release-tile-button")) {
    rtHeading.insertAdjacentHTML(
      "afterend",
                  `<div style="grid-column:1 / -1; flex-basis:100%; text-align:center; margin:4px 0 8px;">
                <button type="button" class="six-box-link" style="font-size:13px; font-weight:400;" onclick="openDialog('understandingReleaseTileDialog')">RT Explained</button>
      </div>`
    );
  }
}



enginePanel
  .querySelectorAll(".release-tile-button")
  .forEach(function(button) {
    button.addEventListener("click", function() {
      selectReleaseTileBox(button.dataset.boxId);
    });
  });

if (
  gameAction === "discard" &&
  (
    hdMode === "current" ||
    (hdMode === "starting" && role === "dealer")
  )
) {

  enginePanel
    .querySelectorAll(".coach-tile[data-key]")
    .forEach(function(tile) {
      tile.addEventListener("click", function() {
        selectCHDDiscardTile(
          tile.dataset.key,
          tile
        );
      });
    });

  if (selectedDiscardTileKey) {
    const selectedTile =
      enginePanel.querySelector(
        '.coach-tile[data-key="' +
        selectedDiscardTileKey +
        '"]'
      );

    if (selectedTile) {
      selectedTile.classList.add("discard-selected");
    }
  }
}

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

function focusLastDrawDestination() {
  if (
    hdMode !== "current" ||
    !coachingOn ||
    !lastDrawnTileKey
  ) {
    return;
  }

  const drawnTile =
    document.querySelector(
      "#enginePanel .last-drawn"
    );

  if (!drawnTile) return;

  const destination =
    drawnTile.closest(
      ".developing-box, .reserves-area, .complete-box"
    );

  if (!destination) return;

  destination.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
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

if (hdMode === "starting") {
  configureHDMode();
}

if (coachingOn) {
  renderCoachView();
}

if (
  hdMode === "current" &&
  coachingOn &&
  lastDrawnTileKey
) {
  requestAnimationFrame(function() {
    focusLastDrawDestination();
  });
} else {
  scrollToTopForScreen();
}
}

