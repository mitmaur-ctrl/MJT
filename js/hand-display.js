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

// Coaching View presentation form.
// "short" = compact live-play layout.
// "long" = expanded Pathways / teaching layout.
window.coachViewForm = "short";


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
  '<span class="hand-tile' +
  (isLastDrawn ? ' last-drawn' : '') +
  '" data-key="' + key + '">' +
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

  if (
    hdMode === "current" &&
    gameAction === "discard"
  ) {
    handDisplay
      .querySelectorAll(".hand-tile[data-key]")
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
          '.hand-tile[data-key="' +
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
  const enginePanel = document.getElementById("enginePanel");

  const total = getTotal();
  const setupContext = "Seat: " + getWindLabel(seatWind) +
    " | Round: " + getWindLabel(prevailingWind);

  
  enginePanel.classList.toggle("hidden", !coachingOn);



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



let isMahjongWatch = false;

if (canAcquire) {
  const currentResult =
    evaluate17TE(MJC_STATE.getEngineInput());

  isMahjongWatch =
    currentResult.mahjongWatch === true;
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
          : "Kang declared.<br>Draw replacement tile."
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
          : "Kang declared.<br>Draw replacement tile."
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


function renderActiveArea(
  completeBoxes,
  developingBoxes,
  halfEye,
  highlightState
) {
  let html =
  '<div class="developing-area">' +
    '<div class="engine-title">Developing Boxes</div>';

  html += renderEscaleraBox(highlightState);
if (typeof renderSevenPairsBox === "function") {
  html += renderSevenPairsBox(highlightState);
}

  const firstActiveBoxNumber = completeBoxes.length + 1;

  developingBoxes.forEach(function(box, index) {
    const boxNumber = firstActiveBoxNumber + index;

    const tileHtml = box.tiles.map(function(tileKey) {
  const isLastDrawn =
    tileKey === lastDrawnTileKey &&
!highlightState.used

  if (isLastDrawn) {
    highlightState.used = true;
  }

  return renderCoachTile(tileKey, {
  extraClass: isLastDrawn ? "last-drawn" : ""
});


}).join("");

    const dbExtraClass =
  box.type === "cpc"
    ? " wide-box"
    : "";

html +=
  '<div class="hand-section box-card developing-box' +
    dbExtraClass +
  '">' +
    '<div class="hand-section-title">DB' + boxNumber + ' — ' +
      getBoxTypeLabel(box.type) +
    '</div>' +
    tileHtml +
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

    html +=
      '<div class="hand-section box-card developing-box">' +
        '<div class="hand-section-title">DB' +
  boxNumber +
  ' — HE</div>' +
        tileHtml +
      '</div>';
  }

  const totalBoxes =
  completeBoxes.length +
  developingBoxes.length +
  (halfEye ? halfEye.length : 0);

const targetBoxCount =
  escaleraMode ? 3 : 6;

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
  extraClass: isLastDrawn ? "last-drawn" : ""
});

}).join("");

  const cbExtraClass =
  box.type === "kang" ||
  box.type === "news"
    ? " wide-box"
    : "";

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
  '</div>' +
  '<div class="cb-tile-row">' +
    tileHtml +
  '</div>' +
'</div>';
  });

  html += '</div>';

return html;
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

  enginePanel.innerHTML =
  '<div class="coach-top-row">' +
    '<div id="coachMessageArea" class="coach-message-area"></div>' +

    '<div class="coach-top-right">' +
  getBoxLabelToggleHtml() +
  getTileIndexToggleHtml() +
  '<div class="tih-counter">' +
        'TIH: ' + tih +
      '</div>' +
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

