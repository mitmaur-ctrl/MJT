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

// Kang -> Pong fallback
// Preserve the existing Complete Box position.
if (
  previousBox.type === "kang" &&
  box.type === "pong" &&
  previousBox.tiles.length === 4 &&
  box.tiles.length === 3 &&
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

// Kang -> Pong fallback
// Preserve existing visibility when a Kang
// opportunity is declined or ignored.
if (
  previousBox.type === "kang" &&
  box.type === "pong" &&
  previousBox.tiles.length === 4 &&
  box.tiles.length === 3 &&
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

function getStructuralEngineInput(engineInput) {
  const structuralCounts = {
    ...engineInput.counts
  };

  const escaleraProtectedTileKeys =
    engineInput.escaleraProtectedTileKeys || [];

  escaleraProtectedTileKeys.forEach(
    function(tileKey) {
      if ((structuralCounts[tileKey] || 0) > 0) {
        structuralCounts[tileKey] -= 1;
      }
    }
  );

  return {
    ...engineInput,
    counts: structuralCounts
  };
}

/*
==================================================
Continuous Game Timing Ramp
==================================================

Timing is represented as one continuous progression
from the beginning of the game to its theoretical end.

0.0 = beginning
1.0 = theoretical end

There are no Timing periods, steps, or switches.
==================================================
*/

function getGameTimingProgress(
  discardCount,
  role
) {
  const theoreticalRotations = 18;

  // The dealer's opening discard establishes
  // the beginning of the Timing ramp.
  const elapsedRotations =
    role === "dealer"
      ? Math.max(0, (discardCount || 0) - 1)
      : Math.max(0, discardCount || 0);

  const normalizedRotations =
    Math.min(
      elapsedRotations,
      theoreticalRotations
    );

  return normalizedRotations / theoreticalRotations;
}

function evaluate17TE(engineInput, options = {}) {
  const structuralInput =
    getStructuralEngineInput(engineInput);

  const gameTimingProgress =
    getGameTimingProgress(
      engineInput.context?.playerDiscardCount || 0,
      engineInput.context?.role
    );


  const detectedCompleteBoxes =
    findCompleteBoxes(structuralInput);

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
    structuralInput.counts,
    completeBoxes
  );

const pkcCandidates =
  findPKCDevelopingBoxes(
    remainingCounts,
    engineInput.deferredKangTileKeys || [],
    engineInput.context &&
      engineInput.context.phase === "starting"
  );

const pkcAdjustedCounts = {
  ...remainingCounts
};

pkcCandidates.forEach(function(box) {
  box.tiles.forEach(function(tileKey) {
    pkcAdjustedCounts[tileKey] -= 1;
  });
});

const cpcCandidates =
  findCPCDevelopingBoxes(
    pkcAdjustedCounts,
    structuralInput.counts
  );



const pairCandidates =
  findPairDevelopingBoxes(
    pkcAdjustedCounts,
    [],
    engineInput.protectedECTileKey
  );

const ordinaryDevelopingBoxes =
  evaluateDBPartitions(
    pkcAdjustedCounts,
    cpcCandidates,
    pairCandidates,
    completeBoxes,
    structuralInput.counts
  );

const developingBoxes = [
  ...pkcCandidates,
  ...ordinaryDevelopingBoxes
];



const halfEye =
  findHalfEye(
    remainingCounts,
    developingBoxes,
    completeBoxes,
    engineInput
  );

const reserves =
  findReserves(
    remainingCounts,
    [
      ...developingBoxes,
      ...halfEye
    ],
    engineInput.counts
  );

const mahjongEC =
  developingBoxes.find(function(box) {
    return box.type === "ec";
  });

const mahjong =
  completeBoxes.length === 5 &&
  Boolean(mahjongEC) &&
  reserves.length === 0 &&
  halfEye.length === 0;

let mahjongWatch = false;
let mahjongWatchTiles = [];

const escaleraMahjongWatch =
  engineInput.escaleraProtectedTileKeys &&
  engineInput.escaleraProtectedTileKeys.length === 9 &&
  completeBoxes.length === 2 &&
  halfEye.length === 1 &&
  reserves.length === 0;

if (!options.skipMahjongWatch && !mahjong) {
  for (const tileKey in engineInput.counts) {
    const currentCount =
      engineInput.counts[tileKey] || 0;

    if (currentCount >= 4) {
      continue;
    }

    const testInput = {
      ...engineInput,
      counts: {
        ...engineInput.counts,
        [tileKey]: currentCount + 1
      }
    };

    const savedStableCompleteBoxState =
  stableCompleteBoxState.map(function(box) {
    return {
      ...box,
      tiles: [...box.tiles]
    };
  });

const savedCanonicalStructureState = {
  ...canonicalStructureState,

  completeBoxes:
    canonicalStructureState.completeBoxes.map(function(box) {
      return {
        ...box,
        tiles: [...box.tiles]
      };
    }),

  developingBoxes:
    canonicalStructureState.developingBoxes.map(function(box) {
      return {
        ...box,
        tiles: [...box.tiles]
      };
    }),

  halfEye:
    canonicalStructureState.halfEye.map(function(box) {
      return {
        ...box,
        tiles: [...box.tiles]
      };
    }),

  reserves:
    [...canonicalStructureState.reserves],

  ambition: {
    ...canonicalStructureState.ambition
  }
};

const testResult =
  evaluate17TE(
    testInput,
    { skipMahjongWatch: true }
  );

// Hypothetical Mahjong Watch evaluations must not
// alter the real hand's stable or canonical state.
stableCompleteBoxState =
  savedStableCompleteBoxState;

canonicalStructureState =
  savedCanonicalStructureState;


    if (testResult.mahjong) {
      mahjongWatchTiles.push(tileKey);
    }
  }

  mahjongWatch =
  escaleraMahjongWatch ||
  mahjongWatchTiles.length > 0;

developingBoxes.forEach(function(box) {
  if (
    box.type !== "mw" ||
    !box.fp ||
    !box.fp.pathways
  ) {
    return;
  }



  const hasMahjongPathway =
  box.fp.pathways.some(function(pathway) {
    return mahjongWatchTiles.includes(
      pathway.completingTile
    );
  });


  if (hasMahjongPathway) {
  box.fp.currentSources = 4;

  box.fp.pathways.forEach(function(pathway) {
    if (
      mahjongWatchTiles.includes(
        pathway.completingTile
      )
    ) {
      pathway.currentSources = 4;
    }
  });
}


});
}


developingBoxes.forEach(function(box) {
  if (
    box.type !== "ew" ||
    !box.fp ||
    !box.fp.pathways
  ) {
    return;
  }


  const hasMahjongPathway =
    box.fp.pathways.some(function(pathway) {
      return mahjongWatchTiles.includes(
        pathway.completingTile
      );
    });

  if (hasMahjongPathway) {
  box.fp.currentSources = 4;

  box.fp.pathways.forEach(function(pathway) {
    if (
      mahjongWatchTiles.includes(
        pathway.completingTile
      )
    ) {
      pathway.currentSources = 4;
    }
  });
}


});

developingBoxes.forEach(function(box) {
  if (
    box.type !== "dsw" ||
    !box.fp ||
    !box.fp.pathways
  ) {
    return;
  }


  box.fp.pathways.forEach(function(pathway) {
    if (
      mahjongWatchTiles.includes(
        pathway.completingTile
      )
    ) {
      pathway.currentSources = 4;
    }
  });
});


let finalCompleteBoxes =
  completeBoxes;

let finalDevelopingBoxes =
  developingBoxes;

if (mahjong) {
  finalCompleteBoxes = [
    ...completeBoxes,
    {
  boxId: 6,
  type: "eye",
  tiles: [...mahjongEC.tiles]
}
  ];

  finalDevelopingBoxes =
    developingBoxes.filter(function(box) {
      return box !== mahjongEC;
    });
}

const structureState =
  updateCanonicalStructureState(
    finalCompleteBoxes,
    finalDevelopingBoxes,
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
  finalCompleteBoxes.length >= 4
    ? "finishing"
    : "building";

const eyeStatus =
  finalCompleteBoxes.some(function(box) {
    return box.type === "eye";
  }) ||
  finalDevelopingBoxes.some(function(box) {
    return box.type === "ec";
  })
    ? "secured"
    : finalDevelopingBoxes.some(function(box) {
        return box.type === "epc";
      })
      ? "developing"
      : "missing";


const structuralContext = {
  completeBoxCount:
    completeBoxes.length,

  hasEC:
    finalDevelopingBoxes.some(function(box) {
      return box.type === "ec";
    }),

  hasEPC:
    finalDevelopingBoxes.some(function(box) {
      return box.type === "epc";
    }),

  eyeStatus,

completeBoxesNeeded:
  Math.max(0, 5 - completeBoxes.length),

eyeNeed:
  eyeStatus === "secured"
    ? "none"
    : eyeStatus === "developing"
      ? "resolve"
      : "establish"
  };

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
  completeBoxes: finalCompleteBoxes,
  developingBoxes: finalDevelopingBoxes,
  halfEye,
  reserves,
  remainingCounts,
  structureState,
  structuralContext,
  phase,
  mahjong,
  mahjongWatch,
  mahjongWatchTiles,
  input: engineInput
    };
  }

function findCompleteBoxes(engineInput) {
  const workingCounts = { ...engineInput.counts };
  const completeBoxes = [];

const isStartingHand =
  engineInput.context &&
  engineInput.context.phase === "starting";


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
  tiles: [...selectedBox.tiles],
  visibility: selectedBox.visibility
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

const newsDeferred =
  engineInput.deferredKangTileKeys &&
  engineInput.deferredKangTileKeys.includes("news");

const newsIgnored =
  engineInput.ignoredNEWS === true;

if (
  hasNEWS &&
  !newsDeferred &&
  !newsIgnored &&
  !isStartingHand
) {
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
// Four identical tiles form one Complete Box
// unless the player explicitly ignored that Kang.


for (const tileKey in workingCounts) {
  const kangIgnored =
    engineInput.ignoredKangTileKeys &&
    engineInput.ignoredKangTileKeys.includes(tileKey);

  const kangDeferred =
    engineInput.deferredKangTileKeys &&
    engineInput.deferredKangTileKeys.includes(tileKey);

 while (
  (workingCounts[tileKey] || 0) >= 4 &&
  !kangIgnored &&
  !kangDeferred &&
  !isStartingHand
) {

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
  const ecProtected =
    engineInput.protectedECTileKey === tileKey;

  const deferredKang =
  (
    engineInput.deferredKangTileKeys &&
    engineInput.deferredKangTileKeys.includes(tileKey)
  ) ||
  (
    isStartingHand &&
    (workingCounts[tileKey] || 0) >= 4
  );

  while (
    (workingCounts[tileKey] || 0) >= 3 &&
    !ecProtected &&
    !deferredKang
  ) {
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
  const structuralInput =
    getStructuralEngineInput(engineInput);

  const counts =
    structuralInput.counts;

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

function findPKCDevelopingBoxes(
  remainingCounts,
  deferredKangTileKeys = [],
  isStartingHand = false
) {

  const pkcBoxes = [];

const hasDeferredNEWS =
  deferredKangTileKeys.includes("news");

const hasNEWS =
  (remainingCounts.north || 0) >= 1 &&
  (remainingCounts.east || 0) >= 1 &&
  (remainingCounts.west || 0) >= 1 &&
  (remainingCounts.south || 0) >= 1;

const shouldCreateNEWSPKC =
  hasNEWS &&
  (
    isStartingHand ||
    hasDeferredNEWS
  );

if (shouldCreateNEWSPKC) {

  pkcBoxes.push({
    type: "pkc",
    tiles: [
      "north",
      "east",
      "west",
      "south"
    ],
    candidateType: "news"
  });
}

  for (const tileKey in remainingCounts) {
  const isDeferredKang =
    deferredKangTileKeys.includes(tileKey);

  const isStartingPKC =
    isStartingHand &&
    (remainingCounts[tileKey] || 0) >= 4;

  if (
    tileKey !== "news" &&
    (remainingCounts[tileKey] || 0) >= 4 &&
    (isDeferredKang || isStartingPKC)
  ) {
    pkcBoxes.push({
      type: "pkc",
      tiles: [
        tileKey,
        tileKey,
        tileKey,
        tileKey
      ]
    });
  }
}

  console.log(
    "PKC Developing Boxes found:",
    pkcBoxes
  );

  return pkcBoxes;
}


function findCPCDevelopingBoxes(
  remainingCounts,
  originalCounts = {}
) {


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

cpcBoxes.forEach(function(box) {
  const structuralPossibilities =
    getCPCStructuralPossibilities(box);

  box.fp = {
    structuralPossibilities:
      analyzeCPCCondition(
        structuralPossibilities,
        originalCounts
      )
  };
});



  console.log(
    "CPC Developing Boxes found:",
    cpcBoxes
  );

  return cpcBoxes;
}


function getCPCStructuralPossibilities(box) {
  if (
    !box ||
    !box.tiles ||
    (box.tiles.length !== 3 &&
      box.tiles.length !== 4)
  ) {
    return null;
  }

  const matches =
    box.tiles.map(function(tileKey) {
      return tileKey.match(
        /^(char|bam|dot)([1-9])$/
      );
    });

  if (
    matches.some(function(match) {
      return !match;
    })
  ) {
    return null;
  }

  const suit = matches[0][1];

  if (
    matches.some(function(match) {
      return match[1] !== suit;
    })
  ) {
    return null;
  }

  const ranks =
    matches
      .map(function(match) {
        return Number(match[2]);
      })
      .sort(function(a, b) {
        return a - b;
      });

  const possibilities = [];

  /*
  ================================================
  3-tile CPC

  x,x,x+2
  x,x+2,x+2
  ================================================
  */

  if (ranks.length === 3) {
    const low = ranks[0];
    const middle = ranks[1];
    const high = ranks[2];

    if (
      low === middle &&
      high === low + 2
    ) {
      possibilities.push({
        structureType: "chow",
        tiles: [
          suit + low,
          suit + (low + 1),
          suit + high
        ],
        keyTile: suit + (low + 1),
        acceptance: 4,
        baselineSources: 2
      });

      possibilities.push({
        structureType: "pong",
        tiles: [
          suit + low,
          suit + low,
          suit + low
        ],
        keyTile: suit + low,
        acceptance: 2,
        baselineSources: 4
      });

      return possibilities;
    }

    if (
      middle === high &&
      high === low + 2
    ) {
      possibilities.push({
        structureType: "chow",
        tiles: [
          suit + low,
          suit + (low + 1),
          suit + high
        ],
        keyTile: suit + (low + 1),
        acceptance: 4,
        baselineSources: 2
      });

      possibilities.push({
        structureType: "pong",
        tiles: [
          suit + high,
          suit + high,
          suit + high
        ],
        keyTile: suit + high,
        acceptance: 2,
        baselineSources: 4
      });

      return possibilities;
    }
  }

  /*
  ================================================
  4-tile CPC

  Pattern A:
  x,x+1,x+1,x+3

  Pattern B:
  x,x+2,x+2,x+3
  ================================================
  */

  if (ranks.length === 4) {
    const first = ranks[0];
    const second = ranks[1];
    const third = ranks[2];
    const fourth = ranks[3];

    // Pattern A: x,x+1,x+1,x+3
    if (
      second === first + 1 &&
      third === second &&
      fourth === first + 3
    ) {
      const sharedKey =
        suit + (first + 2);

      possibilities.push({
        structureType: "chow",
        tiles: [
          suit + first,
          suit + (first + 1),
          sharedKey
        ],
        keyTile: sharedKey,
        acceptance: 4,
        baselineSources: 2
      });

      possibilities.push({
        structureType: "chow",
        tiles: [
          suit + (first + 1),
          sharedKey,
          suit + (first + 3)
        ],
        keyTile: sharedKey,
        acceptance: 4,
        baselineSources: 2
      });

      possibilities.push({
        structureType: "pong",
        tiles: [
          suit + (first + 1),
          suit + (first + 1),
          suit + (first + 1)
        ],
        keyTile: suit + (first + 1),
        acceptance: 2,
        baselineSources: 4
      });

      return possibilities;
    }

    // Pattern B: x,x+2,x+2,x+3
    if (
      second === first + 2 &&
      third === second &&
      fourth === first + 3
    ) {
      const sharedKey =
        suit + (first + 1);

      possibilities.push({
        structureType: "chow",
        tiles: [
          suit + first,
          sharedKey,
          suit + (first + 2)
        ],
        keyTile: sharedKey,
        acceptance: 4,
        baselineSources: 2
      });

      possibilities.push({
        structureType: "chow",
        tiles: [
          sharedKey,
          suit + (first + 2),
          suit + (first + 3)
        ],
        keyTile: sharedKey,
        acceptance: 4,
        baselineSources: 2
      });

      possibilities.push({
        structureType: "pong",
        tiles: [
          suit + (first + 2),
          suit + (first + 2),
          suit + (first + 2)
        ],
        keyTile: suit + (first + 2),
        acceptance: 2,
        baselineSources: 4
      });

      return possibilities;
    }
  }

  return null;
}

function analyzeCPCCondition(
  structuralPossibilities,
  originalCounts
) {
  if (!structuralPossibilities) {
    return null;
  }

  return structuralPossibilities.map(
    function(possibility) {
 
     const availability =
        getKnownTileAvailability(
          possibility.keyTile,
          originalCounts
        );

      return {
  ...possibility,

  availability,

  effectiveAcceptance: availability,

  pathwayCondition:
    availability > 0
      ? "open"
      : "closed",

currentSources: possibility.baselineSources,

};

    }
  );
}




function findPairDevelopingBoxes(
  remainingCounts,
  existingDevelopingBoxes = [],
  protectedECTileKey = null
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
    const tileCount =
  workingCounts[tileKey] || 0;

if (
  tileCount === 2 ||
  (
    tileKey === protectedECTileKey &&
    tileCount >= 2
  )
) {
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

function getPartitionEyeStatus(boxes) {
  if (
    boxes.some(function(box) {
      return box.type === "ec";
    })
  ) {
    return "secured";
  }

  if (
    boxes.some(function(box) {
      return box.type === "epc";
    })
  ) {
    return "developing";
  }

  return "missing";
}

function normalizePartitionPairTypes(
  pairBoxes,
  originalCounts = {}
) {
  const pairType =
    pairBoxes.length === 1
      ? "ec"
      : "epc";

  return pairBoxes.map(function(box) {
  const normalizedBox = {
    ...box,
    type: pairType
  };

  if (pairType === "epc") {
    normalizedBox.fp =
      analyzeEPCPongPathways(
        normalizedBox,
        originalCounts
      );
  }

  return normalizedBox;
});
}


function evaluateDBPartitions(
  remainingCounts,
  cpcCandidates,
  pairCandidates,
  completeBoxes = [],
  originalCounts = {}
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
  normalizePartitionPairTypes(
    cpcPairResult.pairBoxes,
    originalCounts
  );

  const cpcFirstDSWCandidates =
  findDSWDevelopingBoxes(
    remainingCounts,
    cpcFirstPairs,
    originalCounts
  );

  const cpcFirstMWCandidates =
    findMWDevelopingBoxes(
      remainingCounts,
      [
        ...cpcFirstPairs,
        ...cpcFirstDSWCandidates
      ],
      originalCounts	
    );

  const cpcFirstEWCandidates =
    findEWDevelopingBoxes(
      remainingCounts,
      [
        ...cpcFirstPairs,
        ...cpcFirstDSWCandidates,
        ...cpcFirstMWCandidates
      ],
      originalCounts
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
  normalizePartitionPairTypes(
    pairCandidates,
    originalCounts
  );

  const pairFirstDSWs =
  findDSWDevelopingBoxes(
    remainingCounts,
    pairFirstPairs,
    originalCounts
  );

  const pairFirstMWs =
    findMWDevelopingBoxes(
      remainingCounts,
      [
        ...pairFirstPairs,
        ...pairFirstDSWs
      ],
      originalCounts
    );

  const pairFirstEWs =
    findEWDevelopingBoxes(
      remainingCounts,
      [
        ...pairFirstPairs,
        ...pairFirstDSWs,
        ...pairFirstMWs
      ],
      originalCounts
    );

  const pairFirstBoxes = [
    ...pairFirstPairs,
    ...pairFirstDSWs,
    ...pairFirstMWs,
    ...pairFirstEWs
  ];

  /*
  ================================================
  Partition C — Chow-first interpretation

  Accepted CPCs keep priority.

  After CPC ownership is established, Chow
  Candidates are allowed to compete with pairs.

  This allows:
  3,4,4
  ->
  DSW 3,4 + Reserve 4

  without changing pair detection itself.
  ================================================
  */

  const chowFirstDSWs =
  findDSWDevelopingBoxes(
    remainingCounts,
    cpcFirstCPCs,
    originalCounts
  );

  const chowFirstMWs =
    findMWDevelopingBoxes(
      remainingCounts,
      [
        ...cpcFirstCPCs,
        ...chowFirstDSWs
      ],
      originalCounts
    );

  const chowFirstEWs =
    findEWDevelopingBoxes(
      remainingCounts,
      [
        ...cpcFirstCPCs,
        ...chowFirstDSWs,
        ...chowFirstMWs
      ],
      originalCounts
    );

  const chowFirstWorkingCounts = {
    ...remainingCounts
  };

  [
    ...cpcFirstCPCs,
    ...chowFirstDSWs,
    ...chowFirstMWs,
    ...chowFirstEWs
  ].forEach(function(box) {
    box.tiles.forEach(function(tileKey) {
      chowFirstWorkingCounts[tileKey] -= 1;
    });
  });

  const chowFirstPairs = [];

  pairCandidates.forEach(function(box) {
    const tileKey = box.tiles[0];

    if (
      (chowFirstWorkingCounts[tileKey] || 0) >= 2
    ) {
      chowFirstPairs.push(box);
      chowFirstWorkingCounts[tileKey] -= 2;
    }
  });

const normalizedChowFirstPairs =
  normalizePartitionPairTypes(
    chowFirstPairs,
    originalCounts
  );

  const chowFirstBoxes = [
    ...cpcFirstCPCs,
    ...chowFirstDSWs,
    ...chowFirstMWs,
    ...chowFirstEWs,
    ...normalizedChowFirstPairs
  ];

const cpcFirstEyeStatus =
  getPartitionEyeStatus(cpcFirstBoxes);

const pairFirstEyeStatus =
  getPartitionEyeStatus(pairFirstBoxes);

const chowFirstEyeStatus =
  getPartitionEyeStatus(chowFirstBoxes);



  /*
  ================================================
  Compare useful tile participation.

  More tiles participating in DBs wins.

  If tied, preserve CPC flexibility.
  ================================================
  */


    /*
  ================================================
  Compare useful tile participation.

  1. More tiles participating in DBs wins.

  2. If tile participation ties, a structure
     containing more DSWs wins.

  3. Otherwise preserve the existing CPC-first
     interpretation.
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

  const chowFirstTileCount =
    countTilesInBoxes(
      chowFirstBoxes
    );

  let bestBoxes = cpcFirstBoxes;
  let bestTileCount = cpcFirstTileCount;

  if (
    pairFirstTileCount >
    bestTileCount
  ) {
    bestBoxes = pairFirstBoxes;
    bestTileCount = pairFirstTileCount;
  }

/*
================================================
Structural Eye protection — 4 CB Completion

At 4 Complete Boxes, if the existing best
partition secures the Eye and the Chow-first
partition would leave the Eye missing, preserve
the Eye-secured structure.

Structure takes priority over DB Opportunity.
================================================
*/

if (
  completeBoxes.length === 4 &&
  getPartitionEyeStatus(bestBoxes) === "secured" &&
  chowFirstEyeStatus === "missing"
) {
  return bestBoxes;
}

  if (
    chowFirstTileCount >
    bestTileCount
  ) {
    return chowFirstBoxes;
  }

  if (
    chowFirstTileCount ===
    bestTileCount
  ) {
    const chowFirstDSWCount =
      chowFirstBoxes.filter(function(box) {
        return box.type === "dsw";
      }).length;

    const bestDSWCount =
      bestBoxes.filter(function(box) {
        return box.type === "dsw";
      }).length;

    if (
      chowFirstDSWCount >
      bestDSWCount
    ) {
      return chowFirstBoxes;
    }
  }

  return bestBoxes;
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
    [],
    engineInput.protectedECTileKey
  );

  const developingBoxes =
  evaluateDBPartitions(
    remainingCounts,
    cpcCandidates,
    pairCandidates,
    completeBoxes,
    testCounts
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
    ],
    testCounts
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

function getReserveDevelopmentPotential(
  tileKey,
  remainingCounts
) {
  const suitedMatch =
    tileKey.match(/^(char|bam|dot)([1-9])$/);

  // Honors have no Chow-family relationships.
  if (!suitedMatch) {
    return 0;
  }

  const suit = suitedMatch[1];
  const rank = Number(suitedMatch[2]);

  let richness = 0;

  [-2, -1, 1, 2].forEach(function(offset) {
    const familyRank = rank + offset;

    if (
      familyRank < 1 ||
      familyRank > 9
    ) {
      return;
    }

    const familyKey =
      suit + familyRank;

    richness +=
      remainingCounts[familyKey] || 0;
  });

  return richness;
}

function getDSWPathwayStructure(box) {
  const firstMatch =
    box.tiles[0].match(/^(char|bam|dot)([1-9])$/);

  const secondMatch =
    box.tiles[1].match(/^(char|bam|dot)([1-9])$/);

  if (!firstMatch || !secondMatch) {
    return null;
  }

  const suit = firstMatch[1];
  const firstRank = Number(firstMatch[2]);
  const secondRank = Number(secondMatch[2]);

  return {
    structuralPathways: 2,
    acceptance: 8,

    completingTiles: [
      suit + (firstRank - 1),
      suit + (secondRank + 1)
    ]
  };
}


function getMWPathwayStructure(box) {
  const firstMatch =
    box.tiles[0].match(/^(char|bam|dot)([1-9])$/);

  const secondMatch =
    box.tiles[1].match(/^(char|bam|dot)([1-9])$/);

  if (!firstMatch || !secondMatch) {
    return null;
  }

  const suit = firstMatch[1];
  const firstRank = Number(firstMatch[2]);
  const secondRank = Number(secondMatch[2]);

  return {
    structuralPathways: 1,
    acceptance: 4,

    completingTiles: [
      suit + (firstRank + 1)
    ]
  };
}

function getEWPathwayStructure(box) {
  const firstMatch =
    box.tiles[0].match(/^(char|bam|dot)([1-9])$/);

  const secondMatch =
    box.tiles[1].match(/^(char|bam|dot)([1-9])$/);

  if (!firstMatch || !secondMatch) {
    return null;
  }

  const suit = firstMatch[1];
  const firstRank = Number(firstMatch[2]);
  const secondRank = Number(secondMatch[2]);

  let completingTile = null;

  if (firstRank === 1 && secondRank === 2) {
    completingTile = suit + "3";
  }

  if (firstRank === 8 && secondRank === 9) {
    completingTile = suit + "7";
  }

  if (!completingTile) {
    return null;
  }

  return {
    structuralPathways: 1,
    acceptance: 4,

    completingTiles: [
      completingTile
    ]
  };
}

function getEPCPongPathwayStructure(box) {
  if (!box || !box.tiles || box.tiles.length !== 2) {
    return null;
  }

  const first = box.tiles[0];
  const second = box.tiles[1];

  if (first !== second) {
    return null;
  }

  return {
    structuralPathways: 1,
    acceptance: 2,
    completingTiles: [first]
  };
}

function analyzeEPCPongPathways(
  box,
  originalCounts
) {
  const structure =
    getEPCPongPathwayStructure(box);

  if (!structure) {
    return null;
  }

  const pathways =
    structure.completingTiles.map(
      function(tileKey) {
        const knownAvailability =
          getKnownTileAvailability(
            tileKey,
            originalCounts
          );

        return {
  completingTile: tileKey,
  acceptance: 2,
  knownAvailability,
  effectiveAcceptance: knownAvailability,
  effective:
    knownAvailability > 0,
  baselineSources: 4,
  currentSources: 4
};
      }
    );

console.log(
  "EPC PATHWAY TRACE",
  pathways
);



  return {
    structuralPathways:
      structure.structuralPathways,

    acceptance:
      structure.acceptance,

    pathways,

    effectivePathways:
      pathways.filter(function(pathway) {
        return pathway.effective;
      }).length,

    effectiveAcceptance:
      pathways.map(function(pathway) {
        return pathway.knownAvailability;
      }),

    totalKnownAvailability:
      pathways.reduce(function(total, pathway) {
        return total + pathway.knownAvailability;
      }, 0),

    sources: 4
  };
}




function getKnownTileAvailability(
  tileKey,
  originalCounts
) {
  return Math.max(
    0,
    4 - (originalCounts[tileKey] || 0)
  );
}

function analyzeDSWPathways(
  box,
  originalCounts
) {
  const structure =
    getDSWPathwayStructure(box);

  if (!structure) {
    return null;
  }

  const pathways =
    structure.completingTiles.map(
      function(tileKey) {
        const knownAvailability =
          getKnownTileAvailability(
            tileKey,
            originalCounts
          );

        return {
  completingTile: tileKey,
  acceptance: 4,
  effectiveAcceptance: knownAvailability,
  knownAvailability,
  effective:
    knownAvailability > 0,
  baselineSources: 2,
  currentSources: 2
}; 
    }
    );

  return {
  structuralPathways:
    structure.structuralPathways,

  acceptance:
    structure.acceptance,

  pathways,

  effectivePathways:
    pathways.filter(function(pathway) {
      return pathway.effective;
    }).length,

  effectiveAcceptance:
  pathways.map(function(pathway) {
    return pathway.knownAvailability;
  }),

totalKnownAvailability:
  pathways.reduce(function(total, pathway) {
    return total + pathway.knownAvailability;
  }, 0),

sources: 2,
currentSources: 2

  };
}

function analyzeMWPathways(
  box,
  originalCounts
) {
  const structure =
    getMWPathwayStructure(box);

  if (!structure) {
    return null;
  }

  const pathways =
    structure.completingTiles.map(
      function(tileKey) {
        const knownAvailability =
          getKnownTileAvailability(
            tileKey,
            originalCounts
          );

  return {
    completingTile: tileKey,
    acceptance: 4,
    effectiveAcceptance: knownAvailability,
    knownAvailability,
    effective:
    knownAvailability > 0,
    baselineSources: 2,
    currentSources: 2
  };
 

     }
    );

  return {
    structuralPathways:
      structure.structuralPathways,

    acceptance:
      structure.acceptance,

    pathways,

    effectivePathways:
      pathways.filter(function(pathway) {
        return pathway.effective;
      }).length,

    effectiveAcceptance:
      pathways.map(function(pathway) {
        return pathway.knownAvailability;
      }),

    totalKnownAvailability:
      pathways.reduce(function(total, pathway) {
        return total + pathway.knownAvailability;
      }, 0),

    sources: 2,
    currentSources: 2
  };
}

function analyzeEWPathways(
  box,
  originalCounts
) {
  const structure =
    getEWPathwayStructure(box);

  if (!structure) {
    return null;
  }

  const pathways =
    structure.completingTiles.map(
      function(tileKey) {
        const knownAvailability =
          getKnownTileAvailability(
            tileKey,
            originalCounts
          );

        return {
  completingTile: tileKey,
  acceptance: 4,
  knownAvailability,
  effectiveAcceptance: knownAvailability,
  effective:
    knownAvailability > 0,
  baselineSources: 2,
  currentSources: 2
};


      }
    );

  return {
    structuralPathways:
      structure.structuralPathways,

    acceptance:
      structure.acceptance,

    pathways,

    effectivePathways:
      pathways.filter(function(pathway) {
        return pathway.effective;
      }).length,

    effectiveAcceptance:
      pathways.map(function(pathway) {
        return pathway.knownAvailability;
      }),

    totalKnownAvailability:
      pathways.reduce(function(total, pathway) {
        return total + pathway.knownAvailability;
      }, 0),

    sources: 2,
    currentSources: 2
  };
}



function findDSWDevelopingBoxes(
  remainingCounts,
  existingDevelopingBoxes,
  originalCounts = {}
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

        const dswBox = {
  type: "dsw",
  tiles: [first, second]
};

dswBox.fp =
  analyzeDSWPathways(
    dswBox,
    originalCounts
  );

dswBoxes.push(dswBox);

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
  existingDevelopingBoxes,
  originalCounts = {}
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
 
       const mwBox = {
  type: "mw",
  tiles: [first, second]
};

mwBox.fp =
  analyzeMWPathways(
    mwBox,
    originalCounts
  );

mwBoxes.push(mwBox);

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
  existingDevelopingBoxes,
  originalCounts = {}
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
 
       const ewBox = {
  type: "ew",
  tiles: [first, second]
};

ewBox.fp =
  analyzeEWPathways(
    ewBox,
    originalCounts
  );

ewBoxes.push(ewBox);

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
  completeBoxes,
  engineInput
) {
  // Normal 6BT:
// HE exists after 5 Complete Boxes.
//
// Escalera 6BT:
// A completed Escalera is protected outside the
// ordinary Complete Box array, so HE exists after
// 2 ordinary Complete Boxes + the completed Escalera.

const completedEscalera =
  engineInput &&
  engineInput.escaleraProtectedTileKeys &&
  engineInput.escaleraProtectedTileKeys.length === 9;

const halfEyeEligible =
  completeBoxes.length === 5 ||
  (
    completedEscalera &&
    completeBoxes.length === 2
  );

if (!halfEyeEligible) {
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

function findReserves(
  remainingCounts,
  developingBoxes,
  knownCounts
) {
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

  reserves.sort(function(tileA, tileB) {
  const rdpA =
    getReserveDevelopmentPotential(
      tileA,
      remainingCounts
    );

  const rdpB =
    getReserveDevelopmentPotential(
      tileB,
      remainingCounts
    );

  if (rdpA !== rdpB) {
    return rdpB - rdpA;
  }

  return (
    getTileCentricityScore(tileB) -
    getTileCentricityScore(tileA)
  );
});

  return reserves;
}

