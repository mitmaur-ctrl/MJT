/*
==================================================
17 Tile Engine (17TE)
Mahjong Coach v2.0

Purpose:
Evaluate a 16- or 17-tile hand using Six Box Theory™
and classify every tile into:

- Complete Boxes
- Developing Boxes
- Reserves

No UI code belongs here.
==================================================
*/
/*
==================================================
MJC Engine
Version: 6BT v2.0
==================================================

Purpose:
- Receive the current hand from MJC_STATE
- Analyze hand structure
- Detect Complete Boxes (CB)
- Detect Developing Boxes (DB)
  - Sequence DBs
  - Pong DBs
  - Eye Candidates (EC)
  - Eye-Pong Candidates (EPC)
  - Chow-Pong Candidates (CPC)
- Identify Reserve tiles
- Generate coaching recommendations based on Six Box Theory™
- Support Six Box Theory™

Dependencies:
- context.js
- tile-entry.js
- draw-discard.js
- hand-display.js
- ui-utils.js

Used By:
- index.html
- hand-display.js

Notes:
- This module contains the Mahjong intelligence for Mahjong Coach.
- UI presentation belongs elsewhere.
- Engine decisions are based on Six Box Theory™.

==================================================
*/

/*
==================================================
17 Tile Engine (17TE)
Engine Entry Point
==================================================
*/

/*
==================================================
Stable Complete Box State
==================================================

Complete Boxes keep their assigned box number
for as long as that Complete Box continues to exist.

When a Complete Box disappears, its number becomes
available for the next newly completed box.

Example:

CB 1
CB 2
CB 4
CB 5

Available number: 3

The next newly completed box becomes CB 3.
==================================================
*/

let stableCompleteBoxState = [];


function getCompleteBoxSignature(box) {
  return (
    box.type +
    "|" +
    box.tiles.slice().sort().join(",")
  );
}


function assignStableCompleteBoxIds(
  detectedCompleteBoxes
) {
  /*
  ================================================
  Complete Box Numbering Rule

  1. Surviving Complete Boxes keep their relative
     order of completion.

  2. If a Complete Box disappears, later Complete
     Boxes shift up so numbering remains contiguous.

  3. Newly completed boxes are placed after all
     surviving Complete Boxes.

  Example:

  Previous:
  CB 1
  CB 2
  CB 3
  CB 4
  CB 5

  If CB 3 disappears:

  New:
  CB 1
  CB 2
  CB 3  <- former CB 4
  CB 4  <- former CB 5

  The next newly completed box becomes CB 5.
  ================================================
  */

  const unmatchedDetected =
    detectedCompleteBoxes.map(function(box) {
      return { ...box };
    });

  const orderedBoxes = [];

  /*
  First preserve surviving Complete Boxes
  in their previous relative order.
  */
  stableCompleteBoxState
    .slice()
    .sort(function(a, b) {
      return a.boxId - b.boxId;
    })
    .forEach(function(previousBox) {
      const previousSignature =
        getCompleteBoxSignature(previousBox);

      const matchIndex =
  unmatchedDetected.findIndex(function(box) {

    // Exact same Complete Box
    if (
      getCompleteBoxSignature(box) ===
      previousSignature
    ) {
      return true;
    }

    // Pong -> Kang promotion
    // Preserve the existing Complete Box position.
    if (
      previousBox.type === "pong" &&
      box.type === "kang" &&
      previousBox.tiles.length === 3 &&
      box.tiles.length === 4 &&
      previousBox.tiles.every(function(tileKey) {
        return tileKey === box.tiles[0];
      }) &&
      box.tiles.every(function(tileKey) {
        return tileKey === previousBox.tiles[0];
      })
    ) {
      return true;
    }

    return false;
  });

      if (matchIndex !== -1) {
        const survivingBox =
          unmatchedDetected.splice(
            matchIndex,
            1
          )[0];

        orderedBoxes.push(
          survivingBox
        );
      }
    });

  /*
  Any boxes still unmatched are newly completed.
  Add them after all surviving Complete Boxes.
  */
  unmatchedDetected.forEach(function(box) {
    orderedBoxes.push(box);
  });

  /*
  Renumber all current Complete Boxes
  consecutively: 1, 2, 3, 4, 5...
  */
  const assignedBoxes =
    orderedBoxes.map(function(box, index) {
      return {
        ...box,
        boxId: index + 1
      };
    });

  /*
  Save current ordered state for the
  next 17TE evaluation.
  */
  stableCompleteBoxState =
    assignedBoxes.map(function(box) {
      return { ...box };
    });

  return assignedBoxes;
}

function resetStableCompleteBoxState() {
  stableCompleteBoxState = [];
}

/*
==================================================
Canonical Structure State
==================================================

One authoritative structural representation
of the current hand.

SV and CV will both render from this state.

SV:
- Complete Boxes -> Hidden / Exposed Melds
- Everything else -> Loose Tiles

CV:
- Complete Boxes -> Completed Area
- Developing Boxes -> Active Area
- Reserves -> Reserves
- TIH -> all tiles outside Complete Boxes

Ambition mode:
- Seven Pairs
- Escalera (Filipino rules only)

When an Ambition is active, MJC continues to track
the full game state but suspends normal 6BT coaching
and discard evaluation.
==================================================
*/

let canonicalStructureState = {
  completeBoxes: [],
  developingBoxes: [],
  halfEye: [],
  reserves: [],

  ambition: {
    active: false,
    type: null,
    promptResolved: false
  }
};


function updateCanonicalStructureState(
  completeBoxes,
  developingBoxes,
  halfEye,
  reserves
) {
  canonicalStructureState = {
    ...canonicalStructureState,

  completeBoxes:
    completeBoxes.map(function(box) {

    const boxSignature =
      getCompleteBoxSignature(box);


   const existingBox =
  canonicalStructureState.completeBoxes.find(
    function(previousBox) {

      // Exact same Complete Box
      if (
        getCompleteBoxSignature(previousBox) ===
        boxSignature
      ) {
        return true;
      }

      // Pong -> Kang promotion
      // Preserve existing visibility.
      if (
        previousBox.type === "pong" &&
        box.type === "kang" &&
        previousBox.tiles.length === 3 &&
        box.tiles.length === 4 &&
        previousBox.tiles.every(function(tileKey) {
          return tileKey === box.tiles[0];
        }) &&
        box.tiles.every(function(tileKey) {
          return tileKey === previousBox.tiles[0];
        })
      ) {
        return true;
      }

      return false;
    }
  );

    return {
      ...box,
      visibility:
        box.visibility ||
        (existingBox && existingBox.visibility) ||
        "hidden"
    };
  }),

    developingBoxes:
      developingBoxes.map(function(box) {
        return { ...box };
      }),

    halfEye:
      halfEye.map(function(box) {
        return { ...box };
      }),

    reserves:
      reserves.slice()
  };

  return canonicalStructureState;
}


function resetCanonicalStructureState() {
  canonicalStructureState = {
    completeBoxes: [],
    developingBoxes: [],
    halfEye: [],
    reserves: [],

    ambition: {
      active: false,
      type: null,
      promptResolved: false
    }
  };
}

function setCompleteBoxVisibility(
  boxId,
  visibility
) {
  canonicalStructureState.completeBoxes =
    canonicalStructureState.completeBoxes.map(
      function(box) {
        if (box.boxId !== boxId) {
          return box;
        }

        return {
          ...box,
          visibility: visibility
        };
      }
    );

  return canonicalStructureState;
}

function findNewCompleteBoxes(
  previousCompleteBoxes,
  currentCompleteBoxes,
  tileKey = null
) {
  const previousSignatures =
    previousCompleteBoxes.map(function(box) {
      return getCompleteBoxSignature(box);
    });

  return currentCompleteBoxes.filter(function(box) {
    const isNewBox =
      !previousSignatures.includes(
        getCompleteBoxSignature(box)
      );

    if (!isNewBox) {
      return false;
    }

    if (tileKey === null) {
      return true;
    }

    return box.tiles.includes(tileKey);
  });
}

function getClaimedCompleteBoxes(
  claimedTileKey,
  previousCompleteBoxes,
  currentCompleteBoxes
) {
  return findNewCompleteBoxes(
    previousCompleteBoxes,
    currentCompleteBoxes,
    claimedTileKey
  );
}


function evaluate17TE(engineInput) {
  const detectedCompleteBoxes =
  findCompleteBoxes(engineInput);

const completeBoxes =
  assignStableCompleteBoxIds(
    detectedCompleteBoxes
  );

 console.log(
  "Stable Complete Boxes:",
  completeBoxes
);

  const remainingCounts =
    getRemainingCounts(
      engineInput.counts,
      completeBoxes
    );

  const cpcCandidates =
  findCPCDevelopingBoxes(
    remainingCounts
  );

const pairCandidates =
  findPairDevelopingBoxes(
    remainingCounts,
    []
  );

const developingBoxes =
  evaluateDBPartitions(
    remainingCounts,
    cpcCandidates,
    pairCandidates
  );

const halfEye =
  findHalfEye(
    remainingCounts,
    developingBoxes,
    completeBoxes
  );

const reserves =
  findReserves(
    remainingCounts,
    [
      ...developingBoxes,
      ...halfEye
    ]
  );

const structureState =
  updateCanonicalStructureState(
    completeBoxes,
    developingBoxes,
    halfEye,
    reserves
  );



/*
================================================
Derived Evaluation State

These values are derived from the Canonical
Structure State on every evaluation.

They are NOT stored in Canonical Structure State.
================================================
*/

const phase =
  completeBoxes.length >= 4
    ? "finishing"
    : "building";

const mahjong =
  completeBoxes.length === 5 &&
  developingBoxes.some(
    box => box.type === "ec"
  ) &&
  reserves.length === 0 &&
  halfEye.length === 0;

// Future derived states:
//
// const mahjongWatch = ...
//
// const simultaneousCompletion = ...
//
// const finishingPotential = ...

  return {
  version: MJC_VERSION_LABEL,
  status: "ready",
  message:
    "17 Tile Evaluation completed.",
  completeBoxes,
  developingBoxes,
  halfEye,
  reserves,
  remainingCounts,
  structureState,
  phase,
  mahjong,
  input: engineInput
  };
}


function findCompleteBoxes(engineInput) {
  const workingCounts = { ...engineInput.counts };
  const completeBoxes = [];

// MMR-committed Complete Boxes get first priority.
if (
  engineInput.mmrCommittedBoxes &&
  engineInput.mmrCommittedBoxes.length > 0
) {
  engineInput.mmrCommittedBoxes.forEach(
    function(commitment) {
      const selectedBox =
        commitment.candidate;

      const requiredCounts = {};

      selectedBox.tiles.forEach(function(tileKey) {
        requiredCounts[tileKey] =
          (requiredCounts[tileKey] || 0) + 1;
      });

      const canCommitSelectedBox =
        Object.keys(requiredCounts).every(
          function(tileKey) {
            return (
              (workingCounts[tileKey] || 0) >=
              requiredCounts[tileKey]
            );
          }
        );

      if (canCommitSelectedBox) {
        completeBoxes.push({
          type: selectedBox.type,
          tiles: [...selectedBox.tiles]
        });

        selectedBox.tiles.forEach(
          function(tileKey) {
            workingCounts[tileKey] -= 1;
          }
        );
      }
    }
  );
}

    

// 1. Find NEWS.
// NEWS is one Complete Box consisting of
// North, East, West, and South.
// It is available only when the Filipino 16-Tile
// ruleset is active and NEWS is allowed.

if (
  engineInput.context.ruleset === "filipino16" &&
  engineInput.context.newsAllowed === true
) {
  const newsTiles = [
    "north",
    "east",
    "west",
    "south"
  ];

  const hasNEWS =
    newsTiles.every(function(tileKey) {
      return (workingCounts[tileKey] || 0) >= 1;
    });

  if (hasNEWS) {
    completeBoxes.push({
      type: "news",
      tiles: newsTiles
    });

    newsTiles.forEach(function(tileKey) {
      workingCounts[tileKey] -= 1;
    });
  }
}

// 2. Find Kangs.
// Four identical tiles form one Complete Box.
for (const tileKey in workingCounts) {
  while ((workingCounts[tileKey] || 0) >= 4) {
    completeBoxes.push({
      type: "kang",
      tiles: [
        tileKey,
        tileKey,
        tileKey,
        tileKey
      ]
    });

    workingCounts[tileKey] -= 4;
  }
}

// 3. Find Pongs.
for (const tileKey in workingCounts) {
  while ((workingCounts[tileKey] || 0) >= 3) {
    completeBoxes.push({
      type: "pong",
      tiles: [
        tileKey,
        tileKey,
        tileKey
      ]
    });

    workingCounts[tileKey] -= 3;
  }
}

  // 4. Find Chows in the three suited families.
  const suits = ["char", "bam", "dot"];

  for (const suit of suits) {
    for (let start = 1; start <= 7; start++) {
      const first = suit + start;
      const second = suit + (start + 1);
      const third = suit + (start + 2);

      while (
        (workingCounts[first] || 0) > 0 &&
        (workingCounts[second] || 0) > 0 &&
        (workingCounts[third] || 0) > 0
      ) {
        completeBoxes.push({
          type: "chow",
          tiles: [first, second, third]
        });

        workingCounts[first] -= 1;
        workingCounts[second] -= 1;
        workingCounts[third] -= 1;
      }
    }
  }

  console.log("Complete Boxes found:", completeBoxes);

  return completeBoxes;
}

function findIncomingTileMeldCandidates(
  engineInput,
  incomingTileKey
) {
  const counts = engineInput.counts;
  const candidates = [];

  // 1. NEWS candidate.
  if (
    engineInput.context.ruleset === "filipino16" &&
    engineInput.context.newsAllowed === true
  ) {
    const newsTiles = [
      "north",
      "east",
      "west",
      "south"
    ];

    if (newsTiles.includes(incomingTileKey)) {
      const otherNewsTiles =
        newsTiles.filter(function(tileKey) {
          return tileKey !== incomingTileKey;
        });

      const completesNEWS =
        otherNewsTiles.every(function(tileKey) {
          return (counts[tileKey] || 0) >= 1;
        });

      if (completesNEWS) {
        candidates.push({
          type: "news",
          tiles: newsTiles
        });
      }
    }
  }

  // 2. Pong candidate.
  // The incoming tile creates a new Pong only
  // when exactly two matching tiles existed before it.
  if ((counts[incomingTileKey] || 0) === 2) {
    candidates.push({
      type: "pong",
      tiles: [
        incomingTileKey,
        incomingTileKey,
        incomingTileKey
      ]
    });
  }

  // 3. Kang candidate.
  if ((counts[incomingTileKey] || 0) >= 3) {
    candidates.push({
      type: "kang",
      tiles: [
        incomingTileKey,
        incomingTileKey,
        incomingTileKey,
        incomingTileKey
      ]
    });
  }

  // 4. Chow candidates.
  const suitMatch =
    incomingTileKey.match(/^(char|bam|dot)([1-9])$/);

  if (suitMatch) {
    const suit = suitMatch[1];
    const rank = Number(suitMatch[2]);

    const possibleStarts = [
      rank - 2,
      rank - 1,
      rank
    ];

    possibleStarts.forEach(function(start) {
      if (start < 1 || start > 7) {
        return;
      }

      const chowTiles = [
        suit + start,
        suit + (start + 1),
        suit + (start + 2)
      ];

      const requiredTiles =
        chowTiles.filter(function(tileKey) {
          return tileKey !== incomingTileKey;
        });

      const canFormChow =
        requiredTiles.every(function(tileKey) {
          return (counts[tileKey] || 0) >= 1;
        });

      if (canFormChow) {
        candidates.push({
          type: "chow",
          tiles: chowTiles
        });
      }
    });
  }

  return candidates;
}


function getRemainingCounts(originalCounts, completeBoxes) {
  const remainingCounts = { ...originalCounts };

  completeBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      remainingCounts[tileKey] -= 1;
    });
  });

  return remainingCounts;
}

function findCPCDevelopingBoxes(remainingCounts) {
  const workingCounts = { ...remainingCounts };
  const cpcBoxes = [];
  const suits = ["char", "bam", "dot"];

  /*
  ================================================
  1. Find 4-tile CPCs first.

  Pattern A:
  x, x+1, x+1, x+3

  Examples:
  1,2,2,4
  2,3,3,5
  6,7,7,9

  Pattern B:
  x, x+2, x+2, x+3

  Examples:
  1,3,3,4
  2,4,4,5
  6,8,8,9
  ================================================
  */

  for (const suit of suits) {
    // x+3 must not exceed rank 9.
    for (let rank = 1; rank <= 6; rank += 1) {
      const firstTile = suit + rank;
      const secondTile = suit + (rank + 1);
      const thirdTile = suit + (rank + 2);
      const fourthTile = suit + (rank + 3);

      // Pattern A: x, x+1, x+1, x+3
      while (
        (workingCounts[firstTile] || 0) >= 1 &&
        (workingCounts[secondTile] || 0) >= 2 &&
        (workingCounts[fourthTile] || 0) >= 1
      ) {
        cpcBoxes.push({
          type: "cpc",
          tiles: [
            firstTile,
            secondTile,
            secondTile,
            fourthTile
          ]
        });

        workingCounts[firstTile] -= 1;
        workingCounts[secondTile] -= 2;
        workingCounts[fourthTile] -= 1;
      }

      // Pattern B: x, x+2, x+2, x+3
      while (
        (workingCounts[firstTile] || 0) >= 1 &&
        (workingCounts[thirdTile] || 0) >= 2 &&
        (workingCounts[fourthTile] || 0) >= 1
      ) {
        cpcBoxes.push({
          type: "cpc",
          tiles: [
            firstTile,
            thirdTile,
            thirdTile,
            fourthTile
          ]
        });

        workingCounts[firstTile] -= 1;
        workingCounts[thirdTile] -= 2;
        workingCounts[fourthTile] -= 1;
      }
    }
  }

  /*
  ================================================
  2. Find the existing 3-tile CPCs afterward.

  Pattern:
  x, x, x+2

  Mirror:
  x, x+2, x+2
  ================================================
  */

  for (const suit of suits) {
    for (let rank = 1; rank <= 7; rank += 1) {
      const lowTile = suit + rank;
      const highTile = suit + (rank + 2);

      // Pattern: x, x, x+2
      while (
        (workingCounts[lowTile] || 0) >= 2 &&
        (workingCounts[highTile] || 0) >= 1
      ) {
        cpcBoxes.push({
          type: "cpc",
          tiles: [
            lowTile,
            lowTile,
            highTile
          ]
        });

        workingCounts[lowTile] -= 2;
        workingCounts[highTile] -= 1;
      }

      // Mirror pattern: x, x+2, x+2
      while (
        (workingCounts[lowTile] || 0) >= 1 &&
        (workingCounts[highTile] || 0) >= 2
      ) {
        cpcBoxes.push({
          type: "cpc",
          tiles: [
            lowTile,
            highTile,
            highTile
          ]
        });

        workingCounts[lowTile] -= 1;
        workingCounts[highTile] -= 2;
      }
    }
  }

  console.log(
    "CPC Developing Boxes found:",
    cpcBoxes
  );

  return cpcBoxes;
}

function findPairDevelopingBoxes(
  remainingCounts,
  existingDevelopingBoxes = []
) {
  const workingCounts = { ...remainingCounts };
  const pairs = [];

  // Remove tiles already assigned to CPCs.
  existingDevelopingBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      workingCounts[tileKey] =
        (workingCounts[tileKey] || 0) - 1;
    });
  });

  for (const tileKey in workingCounts) {
    if ((workingCounts[tileKey] || 0) === 2) {
      pairs.push({
        type: "pair",
        tiles: [tileKey, tileKey]
      });
    }
  }

  const pairType =
    pairs.length === 1 ? "ec" : "epc";

  return pairs.map(function(pair) {
    return {
      type: pairType,
      tiles: pair.tiles
    };
  });
}

function evaluateCPCVsPairs(
  remainingCounts,
  cpcCandidates,
  pairCandidates
) {
  const workingCounts = { ...remainingCounts };

  const acceptedCPCs = [];
  const acceptedPairs = [];

  // Rule #1:
  // CPCs take priority over overlapping pair candidates.
  cpcCandidates.forEach(function(box) {
    const canUseAllTiles = box.tiles.every(function(tileKey) {
      return (workingCounts[tileKey] || 0) > 0;
    });

    if (canUseAllTiles) {
      acceptedCPCs.push(box);

      box.tiles.forEach(function(tileKey) {
        workingCounts[tileKey] -= 1;
      });
    }
  });

  // After CPCs are accepted, keep only pairs whose
  // tiles are still available.
  pairCandidates.forEach(function(box) {
    const tileKey = box.tiles[0];

    if ((workingCounts[tileKey] || 0) >= 2) {
      acceptedPairs.push(box);
      workingCounts[tileKey] -= 2;
    }
  });

  return {
    cpcBoxes: acceptedCPCs,
    pairBoxes: acceptedPairs
  };
}

function evaluateCPCVsCCs(
  remainingCounts,
  cpcBoxes,
  dswCandidates,
  mwCandidates,
  ewCandidates
) {
  const workingCounts = { ...remainingCounts };

  // Rule #2:
  // Accepted CPCs take priority over overlapping
  // Chow Candidate interpretations.
  cpcBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      workingCounts[tileKey] -= 1;
    });
  });

  function acceptAvailableBoxes(candidates) {
    const acceptedBoxes = [];

    candidates.forEach(function(box) {
      const testCounts = { ...workingCounts };
      let canUseAllTiles = true;

      box.tiles.forEach(function(tileKey) {
        if ((testCounts[tileKey] || 0) <= 0) {
          canUseAllTiles = false;
        } else {
          testCounts[tileKey] -= 1;
        }
      });

      if (canUseAllTiles) {
        acceptedBoxes.push(box);

        box.tiles.forEach(function(tileKey) {
          workingCounts[tileKey] -= 1;
        });
      }
    });

    return acceptedBoxes;
  }

  const dswBoxes =
    acceptAvailableBoxes(dswCandidates);

  const mwBoxes =
    acceptAvailableBoxes(mwCandidates);

  const ewBoxes =
    acceptAvailableBoxes(ewCandidates);

  return {
    dswBoxes,
    mwBoxes,
    ewBoxes
  };
}

function countTilesInBoxes(boxes) {
  return boxes.reduce(function(total, box) {
    return total + box.tiles.length;
  }, 0);
}

function evaluateDBPartitions(
  remainingCounts,
  cpcCandidates,
  pairCandidates
) {
  /*
  ================================================
  Partition A — CPC-first interpretation
  ================================================
  */

  const cpcPairResult =
    evaluateCPCVsPairs(
      remainingCounts,
      cpcCandidates,
      pairCandidates
    );

  const cpcFirstCPCs =
    cpcPairResult.cpcBoxes;

  const cpcFirstPairs =
    cpcPairResult.pairBoxes;

  const cpcFirstDSWCandidates =
    findDSWDevelopingBoxes(
      remainingCounts,
      cpcFirstPairs
    );

  const cpcFirstMWCandidates =
    findMWDevelopingBoxes(
      remainingCounts,
      [
        ...cpcFirstPairs,
        ...cpcFirstDSWCandidates
      ]
    );

  const cpcFirstEWCandidates =
    findEWDevelopingBoxes(
      remainingCounts,
      [
        ...cpcFirstPairs,
        ...cpcFirstDSWCandidates,
        ...cpcFirstMWCandidates
      ]
    );

  const cpcFirstCCResult =
    evaluateCPCVsCCs(
      remainingCounts,
      cpcFirstCPCs,
      cpcFirstDSWCandidates,
      cpcFirstMWCandidates,
      cpcFirstEWCandidates
    );

  const cpcFirstBoxes = [
    ...cpcFirstCPCs,
    ...cpcFirstPairs,
    ...cpcFirstCCResult.dswBoxes,
    ...cpcFirstCCResult.mwBoxes,
    ...cpcFirstCCResult.ewBoxes
  ];

  /*
  ================================================
  Partition B — Pair-first interpretation

  Pairs are preserved first. Remaining tiles may
  then form Chow Candidates.

  This allows:
  5,5,7,8
  ->
  Pair 5,5 + DSW 7,8
  ================================================
  */

  const pairFirstPairs =
    pairCandidates;

  const pairFirstDSWs =
    findDSWDevelopingBoxes(
      remainingCounts,
      pairFirstPairs
    );

  const pairFirstMWs =
    findMWDevelopingBoxes(
      remainingCounts,
      [
        ...pairFirstPairs,
        ...pairFirstDSWs
      ]
    );

  const pairFirstEWs =
    findEWDevelopingBoxes(
      remainingCounts,
      [
        ...pairFirstPairs,
        ...pairFirstDSWs,
        ...pairFirstMWs
      ]
    );

  const pairFirstBoxes = [
    ...pairFirstPairs,
    ...pairFirstDSWs,
    ...pairFirstMWs,
    ...pairFirstEWs
  ];

  /*
  ================================================
  Compare useful tile participation.

  More tiles participating in DBs wins.

  If tied, preserve CPC flexibility.
  ================================================
  */

  const cpcFirstTileCount =
    countTilesInBoxes(
      cpcFirstBoxes
    );

  const pairFirstTileCount =
    countTilesInBoxes(
      pairFirstBoxes
    );

  if (
    pairFirstTileCount >
    cpcFirstTileCount
  ) {
    return pairFirstBoxes;
  }

  return cpcFirstBoxes;
}

function evaluateMMRCandidate(
  engineInput,
  incomingTileKey,
  candidate
) {
  const testCounts = {
    ...engineInput.counts
  };

  testCounts[incomingTileKey] =
    (testCounts[incomingTileKey] || 0) + 1;

  const testInput = {
    ...engineInput,
    counts: testCounts,
    mmrCommittedBoxes: [
      ...(engineInput.mmrCommittedBoxes || []),
      {
        action: "mmr-test",
        tileKey: incomingTileKey,
        candidate: {
          type: candidate.type,
          tiles: [...candidate.tiles]
        }
      }
    ]
  };

  const completeBoxes =
    findCompleteBoxes(testInput);

  const remainingCounts =
    getRemainingCounts(
      testCounts,
      completeBoxes
    );

  const cpcCandidates =
    findCPCDevelopingBoxes(
      remainingCounts
    );

  const pairCandidates =
    findPairDevelopingBoxes(
      remainingCounts,
      []
    );

  const developingBoxes =
    evaluateDBPartitions(
      remainingCounts,
      cpcCandidates,
      pairCandidates
    );

  const halfEye =
    findHalfEye(
      remainingCounts,
      developingBoxes,
      completeBoxes
    );

  const reserves =
    findReserves(
      remainingCounts,
      [
        ...developingBoxes,
        ...halfEye
      ]
    );

  return {
    candidate,
    completeBoxes,
    developingBoxes,
    halfEye,
    reserves,
    remainingCounts
  };
}

function getMMRStructureMetrics(result) {
  const developingBoxes =
    result.developingBoxes || [];

  const reserves =
    result.reserves || [];

  return {
    completeBoxCount:
      result.completeBoxes.length,

    developingTileCount:
      countTilesInBoxes(
        developingBoxes
      ),

    dswCount:
      developingBoxes.filter(function(box) {
        return box.type === "dsw";
      }).length,

    mwCount:
      developingBoxes.filter(function(box) {
        return box.type === "mw";
      }).length,

    ewCount:
  developingBoxes.filter(function(box) {
    return box.type === "ew";
  }).length,

reserveCount:
  reserves.length,

reserveCentricity:
  reserves.reduce(function(total, tileKey) {
    return total +
      getTileCentricityScore(tileKey);
  }, 0)
};
}

function compareMMRResults(
  resultA,
  resultB
) {
  const a =
    getMMRStructureMetrics(resultA);

  const b =
    getMMRStructureMetrics(resultB);

  // 1. More Complete Boxes wins.
  if (a.completeBoxCount !== b.completeBoxCount) {
    return (
      b.completeBoxCount -
      a.completeBoxCount
    );
  }

  // 2. More tiles participating in DBs wins.
  if (
    a.developingTileCount !==
    b.developingTileCount
  ) {
    return (
      b.developingTileCount -
      a.developingTileCount
    );
  }

  // 3. Protect the strongest Chow Candidates.
  if (a.dswCount !== b.dswCount) {
    return b.dswCount - a.dswCount;
  }

  if (a.mwCount !== b.mwCount) {
    return b.mwCount - a.mwCount;
  }

  if (a.ewCount !== b.ewCount) {
    return b.ewCount - a.ewCount;
  }

  // 4. Fewer Reserves is better.
if (a.reserveCount !== b.reserveCount) {
  return a.reserveCount - b.reserveCount;
}

// 5. If Reserve count ties,
// preserve the more central Reserve tiles.
if (
  a.reserveCentricity !==
  b.reserveCentricity
) {
  return (
    b.reserveCentricity -
    a.reserveCentricity
  );
}

// Structurally tied for now.
return 0;
}

function recommendMMRCandidate(
  engineInput,
  incomingTileKey,
  candidates
) {
  if (!candidates || candidates.length === 0) {
    return null;
  }

  const evaluatedCandidates =
    candidates.map(function(candidate) {
      return evaluateMMRCandidate(
        engineInput,
        incomingTileKey,
        candidate
      );
    });

  evaluatedCandidates.sort(
    compareMMRResults
  );

  console.log(
    "MMR evaluated candidates:",
    evaluatedCandidates
  );

  // Only one candidate exists.
  if (evaluatedCandidates.length === 1) {
    return evaluatedCandidates[0].candidate;
  }

  // Compare the two strongest results.
  const comparison =
    compareMMRResults(
      evaluatedCandidates[0],
      evaluatedCandidates[1]
    );

  // If the two strongest structures are tied,
  // MJC does not make an arbitrary recommendation.
  if (comparison === 0) {
    return null;
  }

  return evaluatedCandidates[0].candidate;
}

function getTileCentricityScore(tileKey) {
  const match =
    tileKey.match(/^(char|bam|dot)([1-9])$/);

  if (!match) {
    return 0;
  }

  const rank = Number(match[2]);

  return 5 - Math.abs(5 - rank);
}


function findDSWDevelopingBoxes(
  remainingCounts,
  existingDevelopingBoxes
) {
  const workingCounts = { ...remainingCounts };
  const dswBoxes = [];

  // Remove tiles already assigned to EC/EPC boxes.
  existingDevelopingBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      workingCounts[tileKey] -= 1;
    });
  });

  const suits = ["char", "bam", "dot"];

  for (const suit of suits) {
    // DSW contents may begin with ranks 2 through 7:
    // 2-3, 3-4, 4-5, 5-6, 6-7, or 7-8.
    for (let start = 2; start <= 7; start++) {
      const first = suit + start;
      const second = suit + (start + 1);

      while (
        (workingCounts[first] || 0) > 0 &&
        (workingCounts[second] || 0) > 0
      ) {
        dswBoxes.push({
          type: "dsw",
          tiles: [first, second]
        });

        workingCounts[first] -= 1;
        workingCounts[second] -= 1;
      }
    }
  }

  console.log("DSW Developing Boxes found:", dswBoxes);

  return dswBoxes;
}

function findMWDevelopingBoxes(
  remainingCounts,
  existingDevelopingBoxes
) {
  const workingCounts = { ...remainingCounts };
  const mwBoxes = [];

  // Remove tiles already assigned to EC/EPC and DSW boxes.
  existingDevelopingBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      workingCounts[tileKey] -= 1;
    });
  });

  const suits = ["char", "bam", "dot"];

  for (const suit of suits) {
    // Valid MW patterns:
    // 1-3, 2-4, 3-5, 4-6, 5-7, 6-8, 7-9.
    for (let start = 1; start <= 7; start++) {
      const first = suit + start;
      const second = suit + (start + 2);

      while (
        (workingCounts[first] || 0) > 0 &&
        (workingCounts[second] || 0) > 0
      ) {
        mwBoxes.push({
          type: "mw",
          tiles: [first, second]
        });

        workingCounts[first] -= 1;
        workingCounts[second] -= 1;
      }
    }
  }

  console.log("MW Developing Boxes found:", mwBoxes);

  return mwBoxes;
}

function findEWDevelopingBoxes(
  remainingCounts,
  existingDevelopingBoxes
) {
  const workingCounts = { ...remainingCounts };
  const ewBoxes = [];

  // Remove tiles already assigned to EC/EPC, DSW, and MW boxes.
  existingDevelopingBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      workingCounts[tileKey] -= 1;
    });
  });

  const suits = ["char", "bam", "dot"];

  for (const suit of suits) {
    const edgePatterns = [
      [suit + 1, suit + 2],
      [suit + 8, suit + 9]
    ];

    edgePatterns.forEach(function(pattern) {
      const first = pattern[0];
      const second = pattern[1];

      while (
        (workingCounts[first] || 0) > 0 &&
        (workingCounts[second] || 0) > 0
      ) {
        ewBoxes.push({
          type: "ew",
          tiles: [first, second]
        });

        workingCounts[first] -= 1;
        workingCounts[second] -= 1;
      }
    });
  }

  console.log("EW Developing Boxes found:", ewBoxes);

  return ewBoxes;
}

function findHalfEye(
  remainingCounts,
  developingBoxes,
  completeBoxes
) {
  // HE exists only when exactly 5 Complete Boxes
  // have already been formed.
  if (completeBoxes.length !== 5) {
    return [];
  }

  const workingCounts = { ...remainingCounts };

  // Remove all tiles already assigned
  // to Developing Boxes.
  developingBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      workingCounts[tileKey] -= 1;
    });
  });

  const unassignedTiles = [];

  for (const tileKey in workingCounts) {
    for (
      let i = 0;
      i < (workingCounts[tileKey] || 0);
      i++
    ) {
      unassignedTiles.push(tileKey);
    }
  }

  // A Half Eye exists only when exactly
  // one unassigned tile remains.
  if (unassignedTiles.length !== 1) {
    return [];
  }

  return [
    {
      type: "he",
      tiles: [unassignedTiles[0]]
    }
  ];
}

function findReserves(remainingCounts, developingBoxes) {
  const reserveCounts = { ...remainingCounts };

  developingBoxes.forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      reserveCounts[tileKey] -= 1;
    });
  });

  const reserves = [];

  for (const tileKey in reserveCounts) {
    for (let i = 0; i < (reserveCounts[tileKey] || 0); i++) {
      reserves.push(tileKey);
    }
  }

  return reserves;
}

