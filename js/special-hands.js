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
  distinctCount: 0
};

function resetEscaleraBoxState() {
  escaleraBoxState.active = false;
  escaleraBoxState.suit = null;
  escaleraBoxState.candidateTileKeys = [];
  escaleraBoxState.distinctCount = 0;
}


function checkEscaleraOpportunity(tileCounts) {
  const escaleraSuitCounts = {
    chars: 0,
    bams: 0,
    dots: 0
  };

  ["chars", "bams", "dots"].forEach(function(suitName) {
    const suitGroup =
      MJC_TILE_GROUP_DEFINITIONS[suitName];

    suitGroup.keys.forEach(function(tileKey) {
      if ((tileCounts[tileKey] || 0) > 0) {
        escaleraSuitCounts[suitName] += 1;
      }
    });
  });

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
