/*
=====================================================
 Mahjong Coach (MJC)
 Special Hands
 Version: 6BT v2.6
=====================================================

Responsibilities
----------------
Evaluate and manage special-hand opportunities.

Includes:
- Escalera
- Seven Pairs / Siete Pares
- Future special-hand logic

No hand-display rendering belongs in this file.
=====================================================
*/

let escaleraBoxState = {
  active: false,
  suit: null,
  candidateTileKeys: [],
  distinctCount: 0,
  complete: false,
  completedMeldCount: 0,
  remainingMeldCount: 2,
  eyeNeeded: true
};

function resetEscaleraBoxState() {
  escaleraBoxState.active = false;
  escaleraBoxState.suit = null;
  escaleraBoxState.candidateTileKeys = [];
  escaleraBoxState.distinctCount = 0;
  escaleraBoxState.complete = false;
  escaleraBoxState.completedMeldCount = 0;
  escaleraBoxState.remainingMeldCount = 2;
  escaleraBoxState.eyeNeeded = true;
}

function getEscaleraCandidates(
  tileCounts,
  completeBoxes
) {
  const candidatesBySuit = {
    chars: [],
    bams: [],
    dots: []
  };

  const exposedTileKeys = new Set();

  completeBoxes.forEach(function(box) {
    if (box.visibility === "exposed") {
      box.tiles.forEach(function(tileKey) {
        exposedTileKeys.add(tileKey);
      });
    }
  });

  ["chars", "bams", "dots"].forEach(function(suitName) {
    const suitGroup =
      MJC_TILE_GROUP_DEFINITIONS[suitName];

    suitGroup.keys.forEach(function(tileKey) {
      const totalCount =
        tileCounts[tileKey] || 0;

      if (
        totalCount > 0 &&
        !exposedTileKeys.has(tileKey)
      ) {
        candidatesBySuit[suitName].push(tileKey);
      }
    });
  });

  return candidatesBySuit;
}

function updateEscaleraBoxState(
  tileCounts,
  completeBoxes
) {
  if (
    !escaleraMode ||
    !escaleraBoxState.active ||
    !escaleraBoxState.suit
  ) {
    return false;
  }

  const previousTileKeys =
    [...escaleraBoxState.candidateTileKeys];

  const previousCount =
    escaleraBoxState.distinctCount;

  const candidatesBySuit =
    getEscaleraCandidates(
      tileCounts,
      completeBoxes
    );

  const nextTileKeys =
    candidatesBySuit[
      escaleraBoxState.suit
    ] || [];

  const nextCount =
    nextTileKeys.length;

  escaleraBoxState.candidateTileKeys =
    [...nextTileKeys];

  escaleraBoxState.distinctCount =
    nextCount;

  escaleraBoxState.complete =
    nextCount === 9;

  escaleraBoxState.completedMeldCount =
    escaleraBoxState.complete ? 3 : 0;

  /*
  ================================================
  Escalera Reconsideration Rule

  If the player had more than 6 distinct
  Escalera Candidates and later drops back
  to exactly 6, ask whether Escalera is still
  being pursued.
  ================================================
  */

  if (nextCount > 6) {
    escaleraStatusAsked = false;
  }

  if (
    previousCount > 6 &&
    nextCount === 6 &&
    !escaleraStatusAsked
  ) {
    escaleraStatusAsked = true;

    document
      .getElementById("escaleraStatusDialog")
      .classList.remove("hidden");
  }

  const changed =
    previousCount !== nextCount ||
    previousTileKeys.join("|") !==
      nextTileKeys.join("|");

  return changed;
}

function syncEscaleraAfterHandChange() {
  if (
    !escaleraMode ||
    !escaleraBoxState.active
  ) {
    return;
  }

  const result =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  const structureState =
    result.structureState || result;

  updateEscaleraBoxState(
    counts,
    structureState.completeBoxes
  );

  updateEscaleraRequirements(
    structureState
  );

}

function updateEscaleraRequirements(structureState) {
  if (
    !escaleraMode ||
    !escaleraBoxState.active
  ) {
    return;
  }

  const ordinaryMeldCount =
    structureState.completeBoxes.filter(
      function(box) {
        return (
          box.type !== "eye"
        );
      }
    ).length;

  const eyeComplete =
  structureState.completeBoxes.some(
    function(box) {
      return box.type === "eye";
    }
  ) ||
  structureState.developingBoxes.some(
    function(box) {
      return box.type === "ec";
    }
  );

  escaleraBoxState.remainingMeldCount =
    Math.max(
      0,
      2 - ordinaryMeldCount
    );

  escaleraBoxState.eyeNeeded =
    !eyeComplete;
}

function isEscaleraMahjong() {
  return (
    escaleraMode &&
    escaleraBoxState.active &&
    escaleraBoxState.complete &&
    escaleraBoxState.remainingMeldCount === 0 &&
    escaleraBoxState.eyeNeeded === false
  );
}



function checkEscaleraOpportunity(
  tileCounts,
  completeBoxes
) {


  const candidatesBySuit =
  getEscaleraCandidates(
    tileCounts,
    completeBoxes
  );

const escaleraSuitCounts = {
  chars: candidatesBySuit.chars.length,
  bams: candidatesBySuit.bams.length,
  dots: candidatesBySuit.dots.length
};


  const escaleraThreshold = 6;

  const escaleraSuit =
    Object.keys(escaleraSuitCounts).find(
      function(suitName) {
        return (
          escaleraSuitCounts[suitName] >=
          escaleraThreshold
        );
      }
    );

  if (
    escaleraSuit &&
    escaleraDrawCount <= 2 &&
    !escaleraPromptAsked &&
    !escaleraMode
  ) {

    escaleraBoxState.suit = escaleraSuit;
 
    escaleraPromptAsked = true;

    const escaleraTitle =
      document.querySelector(
        "#escaleraDialog h2"
      );

    const escaleraMessage =
      document.querySelector(
        "#escaleraDialog p"
      );

    if (ruleset === "filipino16") {
      escaleraTitle.textContent =
        "Escalera";

      escaleraMessage.textContent =
        "You have 6 distinct numbered tiles in one suit. " +
        "Are you pursuing Escalera (a Straight)?";
    } else {
      escaleraTitle.textContent =
        "Straight";

      escaleraMessage.textContent =
        "You have 6 distinct numbered tiles in one suit. " +
        "Are you pursuing a Straight?";
    }

    document
      .getElementById("escaleraDialog")
      .classList.remove("hidden");
  }
}


function checkSevenPairsOpportunity(structureState) {
  const eyeCandidates =
    structureState.developingBoxes.filter(
      function(box) {
        return (
          box.type === "ec" ||
          box.type === "epc"
        );
      }
    );

  const pairCount = eyeCandidates.length;
  const overPairedThreshold = 4;

  if (pairCount >= overPairedThreshold) {
    sevenPairsStatusAsked = false;
  }

  if (pairCount < overPairedThreshold) {
    overPairedActive = false;

    if (
      sevenPairsMode &&
      !sevenPairsStatusAsked
    ) {
      sevenPairsStatusAsked = true;

      const statusTitle =
        document.querySelector(
          "#sevenPairsStatusDialog h2"
        );

      const statusMessage =
        document.querySelector(
          "#sevenPairsStatusDialog p"
        );

      if (ruleset === "filipino16") {
        statusTitle.textContent =
          "Siete Pares";

        statusMessage.textContent =
          "Are you still pursuing Siete Pares (Seven Pairs)?";
      } else {
        statusTitle.textContent =
          "Seven Pairs";

        statusMessage.textContent =
          "Are you still pursuing Seven Pairs?";
      }

      document
        .getElementById("sevenPairsStatusDialog")
        .classList.remove("hidden");
    }
  }

  if (
  handStarted &&
  pairCount >= overPairedThreshold &&
  !overPairedActive &&
  !sevenPairsMode
) {
  overPairedActive = true;
  showOverPairedDialog(pairCount);
}

return eyeCandidates;
}

function checkBOLOEyesOpportunity(result, eyeCandidates) {
  if (
    hdMode === "current" &&
    phase === "game" &&
    result.phase === "finishing" &&
    eyeCandidates.length === 0 &&
    !result.mahjong &&
    !boloEyesShown
  ) {
    boloEyesShown = true;
    showBOLOEyesDialog();
  }
}
