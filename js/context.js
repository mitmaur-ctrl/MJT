/*
==================================================
MJC v1.25 CONTEXT MODULE
==================================================

Purpose:
- Manage Role, Ruleset, Seat, and Round context
- Lock and unlock hand context controls
- Update wind labels and icons
- Preserve context behavior during entry and revision

Dependencies:
- tile-entry.js
- ui-utils.js

Used By:
- index.html
- hand-display.js
- draw-discard.js
- dialogs.js

Notes:
- Refactor-only module.
- No intended user-visible behavior changes.
- Preserves stable v1.24 context workflows.

==================================================
*/

function getWindIcon(value) {
  if (value === "east") return "🀀";
  if (value === "south") return "🀁";
  if (value === "west") return "🀂";
  if (value === "north") return "🀃";
  return "";
}

function updateWindIcons() {
  const seatIcon = document.getElementById("seatWindIcon");
  const prevailingIcon = document.getElementById("prevailingWindIcon");
  if (seatIcon) seatIcon.textContent = getWindIcon(seatWind);
  if (prevailingIcon) prevailingIcon.textContent = getWindIcon(prevailingWind);
}

function lockHandContext() {
  contextLocked = true;
  updateContextControls();
}

function updateContextControls() {
  const locked = contextLocked;
  document.getElementById("rulesButton").disabled = locked;
  document.getElementById("displayButton").disabled = locked;
  document.getElementById("roleSelect").disabled = locked;
  document.getElementById("seatWindSelect").disabled = locked;
  document.getElementById("prevailingWindSelect").disabled = locked;
  document.getElementById("lockedNote").classList.toggle("hidden", !locked);
}

function setSeatWind(newSeatWind) {
  if (contextLocked) return;
  seatWind = newSeatWind;
  updateWindIcons();
  updateDisplay();
}

function setPrevailingWind(newPrevailingWind) {
  if (contextLocked) return;
  prevailingWind = newPrevailingWind;
  updateWindIcons();
  updateDisplay();
}

function setRuleset(newRuleset) {
  if (contextLocked) return;
  ruleset = newRuleset;

  if (screenMode === "revision") {
    revisionTouched = true;
    revisionTarget = getStartingTarget();
  } else {
    revisionTarget = null;
  }

  hideUndo();
  updateDisplay();
}

function setMode(newRole) {
  if (contextLocked) return;
  role = newRole;

  hdMode = "starting";
  revisionReturnHDMode = "starting";

  gameAction = role === "dealer" ? "discard" : "draw";

  if (screenMode === "revision") {
    revisionTouched = true;
    revisionTarget = getStartingTarget();
  } else {
    revisionTarget = null;
  }

  hideUndo();
  updateDisplay();
}

function getWindLabel(value) {
  if (value === "east") return "East";
  if (value === "south") return "South";
  if (value === "west") return "West";
  if (value === "north") return "North";
  return "East";
}

function getRulesetLabel() {
  if (ruleset === "chinese13") return "Chinese 13-Tile";
  if (ruleset === "filipino16") return "Filipino 16-Tile";
  return "Taiwanese 16-Tile";
}

function updateDiscardContext() {
  const discardContext = document.getElementById("discardContext");
  if (!discardContext) return;
  discardContext.textContent = "Seat: " + getWindLabel(seatWind) + " | Round: " + getWindLabel(prevailingWind);
}

function makeSnapshot() {
  return {
    counts: { ...counts },
    ruleset: ruleset,
    role: role,
    seatWind: seatWind,
    prevailingWind: prevailingWind,
    coachingOn: coachingOn,
    phase: phase,
    screenMode: screenMode,
    hdMode: hdMode,
    gameAction: gameAction,
    lastDrawnTileKey: lastDrawnTileKey,
    revisionReturnHDMode: revisionReturnHDMode,
    revisionTarget: revisionTarget,
    revisionTouched: revisionTouched,
    contextLocked: contextLocked,
    displayOrder: { ...displayOrder },
    handCorrectionTarget: handCorrectionTarget,

    stableCompleteBoxState:
      stableCompleteBoxState.map(function(box) {
        return {
          ...box,
          tiles: [...box.tiles]
        };
      }),

    canonicalStructureState: {
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

      reserves: [...canonicalStructureState.reserves],

      ambition: {
        ...canonicalStructureState.ambition
      }
    },

    mmrCommittedBoxes:
      mmrCommittedBoxes.map(function(item) {
        return {
          action: item.action,
          tileKey: item.tileKey,
          candidate: {
            type: item.candidate.type,
            tiles: [...item.candidate.tiles]
          }
        };
      })
  };
}

function restoreSnapshot(snapshot) {
  if (!snapshot) return;
  ruleset = snapshot.ruleset;
  role = snapshot.role;
  seatWind = snapshot.seatWind;
  prevailingWind = snapshot.prevailingWind;
  coachingOn = snapshot.coachingOn;
  phase = snapshot.phase;
  screenMode = snapshot.screenMode;
  hdMode = snapshot.hdMode;
  gameAction = snapshot.gameAction;
  lastDrawnTileKey = snapshot.lastDrawnTileKey;
  revisionReturnHDMode = snapshot.revisionReturnHDMode;
  revisionTarget = snapshot.revisionTarget;
  revisionTouched = snapshot.revisionTouched;
  contextLocked = snapshot.contextLocked;
  displayOrder = { ...snapshot.displayOrder };
  handCorrectionTarget = snapshot.handCorrectionTarget || null;

stableCompleteBoxState =
  (snapshot.stableCompleteBoxState || []).map(function(box) {
    return {
      ...box,
      tiles: [...box.tiles]
    };
  });

canonicalStructureState = {
  completeBoxes:
    (snapshot.canonicalStructureState?.completeBoxes || []).map(function(box) {
      return {
        ...box,
        tiles: [...box.tiles]
      };
    }),

  developingBoxes:
    (snapshot.canonicalStructureState?.developingBoxes || []).map(function(box) {
      return {
        ...box,
        tiles: [...box.tiles]
      };
    }),

  halfEye:
    (snapshot.canonicalStructureState?.halfEye || []).map(function(box) {
      return {
        ...box,
        tiles: [...box.tiles]
      };
    }),

  reserves:
    [...(snapshot.canonicalStructureState?.reserves || [])],

  ambition: {
    ...(snapshot.canonicalStructureState?.ambition || {
      active: false,
      type: null,
      promptResolved: false
    })
  }
};

mmrCommittedBoxes =
  (snapshot.mmrCommittedBoxes || []).map(function(item) {
    return {
      action: item.action,
      tileKey: item.tileKey,
      candidate: {
        type: item.candidate.type,
        tiles: [...item.candidate.tiles]
      }
    };
  });

  for (const key in snapshot.counts) counts[key] = snapshot.counts[key];

  document.getElementById("roleSelect").value = role;
  document.getElementById("seatWindSelect").value = seatWind;
  document.getElementById("prevailingWindSelect").value = prevailingWind;

  updateWindIcons();
  updateDisplay();
}

function applyDisplayOrderToScreens() {
  const suits = [displayOrder.firstSuit, displayOrder.secondSuit, displayOrder.thirdSuit];
  const honors = displayOrder.honorsOrder === "dragonsFirst" ? ["dragons", "winds"] : ["winds", "dragons"];
  const ordered = suits.concat(honors);

  const tdScreen = document.getElementById("tdScreen");
  const tdActions = document.querySelector("#tdScreen > .actions");
  if (tdScreen && tdActions) {
    ordered.forEach(function(group) {
      const section = document.getElementById("section-" + group);
      if (section) tdScreen.insertBefore(section, tdActions);
    });
  }

  const drawScreen = document.getElementById("drawScreen");
  const drawActions = document.querySelector("#drawScreen > .actions");
  if (drawScreen && drawActions) {
    ordered.forEach(function(group) {
      const section = document.getElementById("draw-section-" + group);
      if (section) drawScreen.insertBefore(section, drawActions);
    });
  }
}
