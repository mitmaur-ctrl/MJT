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

let sevenPairsBoxState = {
  active: false,
  pairTileKeys: [],
  allPairTileKeys: [],
  pairCount: 0,
  complete: false,
  completionOrder: [],
  meldBox: null
};

function resetSevenPairsBoxState() {
  sevenPairsBoxState.active = false;
  sevenPairsBoxState.pairTileKeys = [];
  sevenPairsBoxState.allPairTileKeys = [];
  sevenPairsBoxState.pairCount = 0;
  sevenPairsBoxState.complete = false;
  sevenPairsBoxState.completionOrder = [];
  sevenPairsBoxState.meldBox = null;
}


function getSevenPairsCandidates(
  tileCounts,
  excludedCounts = {}
) {
  const pairTileKeys = [];

  Object.keys(tileCounts).forEach(function(tileKey) {
    const availableCount =
  Math.max(
    0,
    (tileCounts[tileKey] || 0) -
    (excludedCounts[tileKey] || 0)
  );

const pairCopies =
  Math.floor(availableCount / 2);

    for (let i = 0; i < pairCopies; i++) {
      pairTileKeys.push(tileKey);
    }
  });

  return pairTileKeys;
}

function getSevenPairsExcludedCounts() {
  const excludedCounts = {};

  (mmrCommittedBoxes || []).forEach(
    function(commitment) {
      const candidate =
        commitment && commitment.candidate;

      if (
        !candidate ||
        !candidate.tiles ||
        (
          candidate.type !== "chow" &&
          candidate.type !== "pong" &&
          candidate.type !== "kang"
        )
      ) {
        return;
      }

      candidate.tiles.forEach(function(tileKey) {
        excludedCounts[tileKey] =
          (excludedCounts[tileKey] || 0) + 1;
      });
    }
  );

  return excludedCounts;
}


function updateSevenPairsBoxState(
  tileCounts,
  completeBoxes = null
) {
  if (
    !sevenPairsMode ||
    !sevenPairsBoxState.active
  ) {
    return false;
  }

  const previousTileKeys =
    [...sevenPairsBoxState.pairTileKeys];

  const previousCount =
    sevenPairsBoxState.pairCount;

  const excludedCounts =
  getSevenPairsExcludedCounts();

if (completeBoxes) {
  completeBoxes.forEach(function(box) {
    if (
      box.type !== "chow" &&
      box.type !== "pong" &&
      box.type !== "kang"
    ) {
      return;
    }

    box.tiles.forEach(function(tileKey) {
      excludedCounts[tileKey] =
        (excludedCounts[tileKey] || 0) + 1;
    });
  });
}

const nextTileKeys =
  getSevenPairsCandidates(
    tileCounts,
    excludedCounts
  );

  const nextCount =
  nextTileKeys.length;

/*
================================================
Siete Pares pair ownership

Keep every available pair as a strategic
candidate, but the Siete Pares Box itself
may contain no more than seven pairs.

When eight pairs exist, one pair remains
available to the ordinary meld side as the
Siete Pares Pong Candidate.
================================================
*/

sevenPairsBoxState.allPairTileKeys =
  [...nextTileKeys];

/*
If one of the pair candidates now has a third
available copy, release that pair from the
Siete Pares Box so the three copies can form
the required Pong.

This is what keeps all eight pairs strategically
interchangeable instead of permanently treating
one particular pair as "pair #8."
*/

const pongReadyPairKey =
  nextTileKeys.find(function(tileKey) {
    const availableCount =
      Math.max(
        0,
        (tileCounts[tileKey] || 0) -
        (excludedCounts[tileKey] || 0)
      );

    return availableCount >= 3;
  });

let sieteParesOwnedPairs =
  [...nextTileKeys];

if (
  nextCount > 7 &&
  pongReadyPairKey
) {
  const releaseIndex =
    sieteParesOwnedPairs.indexOf(
      pongReadyPairKey
    );

  if (releaseIndex !== -1) {
    sieteParesOwnedPairs.splice(
      releaseIndex,
      1
    );
  }
}

sevenPairsBoxState.pairTileKeys =
  sieteParesOwnedPairs.slice(0, 7);

sevenPairsBoxState.pairCount =
  nextCount;


sevenPairsBoxState.complete =
  nextCount >= 7;



  const changed =
    previousCount !== nextCount ||
    previousTileKeys.join("|") !==
    nextTileKeys.join("|");

  return changed;
}


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

function syncSevenPairsCompletionOrder() {
  if (
    !sevenPairsMode ||
    !sevenPairsBoxState.active
  ) {
    return;
  }

  const meldState =
    getSevenPairsMeldState();

  const sevenPairsComplete =
    sevenPairsBoxState.complete === true;

  const meldComplete =
    Boolean(meldState.completeBox);

  /*
  Remove any box that is no longer complete.
  If it later completes again, it will be added
  back at the end of the order.
  */
  sevenPairsBoxState.completionOrder =
    sevenPairsBoxState.completionOrder.filter(
      function(boxType) {
        if (boxType === "sevenPairs") {
          return sevenPairsComplete;
        }

        if (boxType === "meld") {
          return meldComplete;
        }

        return false;
      }
    );

  if (
    sevenPairsComplete &&
    !sevenPairsBoxState.completionOrder.includes(
      "sevenPairs"
    )
  ) {
    sevenPairsBoxState.completionOrder.push(
      "sevenPairs"
    );
  }

  if (
    meldComplete &&
    !sevenPairsBoxState.completionOrder.includes(
      "meld"
    )
  ) {
    sevenPairsBoxState.completionOrder.push(
      "meld"
    );
  }
}

function syncSevenPairsAfterHandChange() {
  if (
    !sevenPairsMode ||
    !sevenPairsBoxState.active
  ) {
    return;
  }

  updateSevenPairsBoxState(
  counts,
  sevenPairsBoxState.meldBox
    ? [sevenPairsBoxState.meldBox]
    : null
);
  syncSevenPairsCompletionOrder();
}


function getSevenPairsMeldState() {
  if (
    !sevenPairsMode ||
    !sevenPairsBoxState.active
  ) {
    return {
      completeBox: null,
      developingBox: null,
      reserves: []
    };
  }

  /*
  ================================================
  Siete Pares Two-Box Structure

  Pair copies committed to the Siete Pares Box
  are removed first.

  Only the remaining tiles may form the single
  required meld box.
  ================================================
  */

  const workingCounts = { ...counts };

const committedMeld =
  (mmrCommittedBoxes || [])
    .map(function(commitment) {
      return commitment && commitment.candidate;
    })
    .find(function(candidate) {
      return (
        candidate &&
        candidate.tiles &&
        (
          candidate.type === "chow" ||
          candidate.type === "pong" ||
          candidate.type === "kang"
        )
      );
    });

const protectedMeld =
  sevenPairsBoxState.meldBox;

if (protectedMeld) {
  const requiredCounts = {};

  protectedMeld.tiles.forEach(function(tileKey) {
    requiredCounts[tileKey] =
      (requiredCounts[tileKey] || 0) + 1;
  });

  const meldStillExists =
    Object.keys(requiredCounts).every(
      function(tileKey) {
        return (
          (counts[tileKey] || 0) >=
          requiredCounts[tileKey]
        );
      }
    );

  if (!meldStillExists) {
    sevenPairsBoxState.meldBox = null;
  }
}


if (committedMeld) {
  const committedCounts = {};

  committedMeld.tiles.forEach(function(tileKey) {
    committedCounts[tileKey] =
      (committedCounts[tileKey] || 0) + 1;
  });

  const pairTileKeys =
    getSevenPairsCandidates(
      counts,
      committedCounts
    );

  const reserveCounts = { ...counts };

  committedMeld.tiles.forEach(function(tileKey) {
    reserveCounts[tileKey] =
      Math.max(
        0,
        (reserveCounts[tileKey] || 0) - 1
      );
  });

  pairTileKeys.forEach(function(tileKey) {
    reserveCounts[tileKey] =
      Math.max(
        0,
        (reserveCounts[tileKey] || 0) - 2
      );
  });

  sevenPairsBoxState.pairTileKeys =
    [...pairTileKeys];

  sevenPairsBoxState.pairCount =
    pairTileKeys.length;

  sevenPairsBoxState.complete =
    pairTileKeys.length >= 7;

  return {
    completeBox: {
      type: committedMeld.type,
      tiles: [...committedMeld.tiles],
      visibility: "exposed"
    },
    developingBox: null,
    reserves:
      findReserves(
        reserveCounts,
        []
      )
  };
}

if (sevenPairsBoxState.meldBox) {
  const protectedMeld =
    sevenPairsBoxState.meldBox;

  const protectedCounts = {};

  protectedMeld.tiles.forEach(function(tileKey) {
    protectedCounts[tileKey] =
      (protectedCounts[tileKey] || 0) + 1;
  });

  const pairTileKeys =
    getSevenPairsCandidates(
      counts,
      protectedCounts
    );

  const reserveCounts = { ...counts };

  protectedMeld.tiles.forEach(function(tileKey) {
    reserveCounts[tileKey] =
      Math.max(
        0,
        (reserveCounts[tileKey] || 0) - 1
      );
  });

  pairTileKeys.forEach(function(tileKey) {
    reserveCounts[tileKey] =
      Math.max(
        0,
        (reserveCounts[tileKey] || 0) - 2
      );
  });

  sevenPairsBoxState.pairTileKeys =
    [...pairTileKeys];

  sevenPairsBoxState.pairCount =
    pairTileKeys.length;

  sevenPairsBoxState.complete =
    pairTileKeys.length >= 7;

  return {
    completeBox: {
      type: protectedMeld.type,
      tiles: [...protectedMeld.tiles],
      visibility:
        protectedMeld.visibility || "hidden"
    },
    developingBox: null,
    reserves:
      findReserves(
        reserveCounts,
        []
      )
  };
}


  sevenPairsBoxState.pairTileKeys.forEach(
    function(tileKey) {
      workingCounts[tileKey] =
        Math.max(
          0,
          (workingCounts[tileKey] || 0) - 2
        );
    }
  );

  /*
  ================================================
  Look first for a completed ordinary meld.

  NEWS is not the required Siete Pares meld.
  Valid completed melds:
  - Chow
  - Pong
  - Kang
  ================================================
  */

  const meldInput = {
    ...MJC_STATE.getEngineInput(),
    counts: workingCounts,
    context: {
      ...MJC_STATE.getEngineInput().context,
      newsAllowed: false
    }
  };

  const completedMelds =
    findCompleteBoxes(meldInput).filter(
      function(box) {
        return (
          box.type === "chow" ||
          box.type === "pong" ||
          box.type === "kang"
        );
      }
    );

  if (completedMelds.length > 0) {
  const completeBox = completedMelds[0];

  sevenPairsBoxState.meldBox = {
    type: completeBox.type,
    tiles: [...completeBox.tiles],
    visibility:
      completeBox.visibility || "hidden"
  };

  return {
      completeBox: completeBox,
      developingBox: null,
      reserves:
        findReserves(
          getRemainingCounts(
            workingCounts,
            [completeBox]
          ),
          []
        )
    };
  }

  /*
  ================================================
  No completed meld yet.

  Select only the strongest available developing
  meld candidate using the established hierarchy:

  CPC > DSW > MW > EW
  ================================================
  */

/*
================================================
Siete Pares Pong Candidate

When the Siete Pares Box is complete and the
remaining structure is exactly a pair, that
pair is the developing path to the one required
ordinary Pong.

This is specific to Siete Pares. It is not an
Eye Candidate or the normal four-tile PKC.
================================================
*/

if (sevenPairsBoxState.complete) {
  const pongCandidateKey =
    Object.keys(workingCounts).find(
      function(tileKey) {
        return (
          (workingCounts[tileKey] || 0) === 2
        );
      }
    );

  if (pongCandidateKey) {
    const pongCandidate = {
      type: "pc",
      tiles: [
        pongCandidateKey,
        pongCandidateKey
      ]
    };

    return {
      completeBox: null,
      developingBox: pongCandidate,
      reserves:
        findReserves(
          workingCounts,
          [pongCandidate]
        )
    };
  }
}

  const cpcCandidates =
    findCPCDevelopingBoxes(workingCounts);

  if (cpcCandidates.length > 0) {
    return {
      completeBox: null,
      developingBox: cpcCandidates[0],
      reserves:
        findReserves(
          workingCounts,
          [cpcCandidates[0]]
        )
    };
  }

  const dswCandidates =
    findDSWDevelopingBoxes(
      workingCounts,
      []
    );

  if (dswCandidates.length > 0) {
    return {
      completeBox: null,
      developingBox: dswCandidates[0],
      reserves:
        findReserves(
          workingCounts,
          [dswCandidates[0]]
        )
    };
  }

  const mwCandidates =
    findMWDevelopingBoxes(
      workingCounts,
      []
    );

  if (mwCandidates.length > 0) {
    return {
      completeBox: null,
      developingBox: mwCandidates[0],
      reserves:
        findReserves(
          workingCounts,
          [mwCandidates[0]]
        )
    };
  }

  const ewCandidates =
    findEWDevelopingBoxes(
      workingCounts,
      []
    );

  if (ewCandidates.length > 0) {
    return {
      completeBox: null,
      developingBox: ewCandidates[0],
      reserves:
        findReserves(
          workingCounts,
          [ewCandidates[0]]
        )
    };
  }

  return {
    completeBox: null,
    developingBox: null,
    reserves:
      findReserves(
        workingCounts,
        []
      )
  };
}

function isSevenPairsMahjongWatch() {
  if (
    !sevenPairsMode ||
    !sevenPairsBoxState.active ||
    !sevenPairsBoxState.complete
  ) {
    return false;
  }

  const meldState =
    getSevenPairsMeldState();

  const mahjongWatchTypes = [
    "pc",
    "cpc",
    "dsw",
    "mw",
    "ew"
  ];

  return Boolean(
    !meldState.completeBox &&
    meldState.developingBox &&
    mahjongWatchTypes.includes(
      meldState.developingBox.type
    )
  );
}

function isSevenPairsMahjong() {
  if (
    !sevenPairsMode ||
    !sevenPairsBoxState.active ||
    !sevenPairsBoxState.complete
  ) {
    return false;
  }

  const meldState =
    getSevenPairsMeldState();

  return Boolean(
    meldState.completeBox
  );
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

  const excludedCounts = {};

structureState.completeBoxes.forEach(function(box) {
  box.tiles.forEach(function(tileKey) {
    excludedCounts[tileKey] =
      (excludedCounts[tileKey] || 0) + 1;
  });
});

const pairCount =
  getSevenPairsCandidates(
    counts,
    excludedCounts
  ).length;

const overPairedThreshold = 4;

  if (pairCount >= overPairedThreshold) {
    sevenPairsStatusAsked = false;
  }

  if (pairCount < overPairedThreshold) {
  overPairedActive = false;
  overPairedDelayOneEvaluation = false;

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
  overPairedDelayOneEvaluation &&
  !sevenPairsMode
) {
  overPairedDelayOneEvaluation = false;

  document
    .getElementById("overPairedAdviceDialog")
    .classList.remove("hidden");
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
