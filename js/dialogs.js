/*
==================================================
MJC v1.22 JAVASCRIPT REFACTOR
Module: dialogs.js
==================================================
Purpose:
- Ruleset dialog behavior
- Display dialog behavior
- Footer and information dialogs

Refactor only:
- No intended UI changes
- No intended workflow changes
==================================================
*/

function openRulesDialog() {
  if (contextLocked) {
    showToast("Hand context is locked for this hand.");
    return;
  }

  document.querySelectorAll('input[name="rulesetRadio"]').forEach(function(radio) {
    radio.checked = radio.value === ruleset;
  });

  openDialog("rulesDialog");
}

function openDisplayDialog() {
  if (contextLocked) {
    showToast("Hand context is locked for this hand.");
    return;
  }

  document.getElementById("firstSuitSelect").value = displayOrder.firstSuit;
  updateDisplaySuitOptions(displayOrder.secondSuit);

  document.querySelectorAll('input[name="honorsOrderRadio"]').forEach(function(radio) {
    radio.checked = radio.value === displayOrder.honorsOrder;
  });

  openDialog("displayDialog");
}

function openAboutDialog() {
  openDialog("aboutDialog");
}

function openDialog(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeDialog(id) {
  document.getElementById(id).classList.add("hidden");
}

const mjcGlossaryEntries = [

  {
    term: "Game State",
    definition:
      "A Six Box Theory™ concept describing approximately how far " +
      "play has progressed through a hand: early, middle, or late. " +
      "Also called Timing. It provides context for evaluating " +
      "opportunities and making decisions. Game State describes " +
      "progress through play; Developing Stage and Completion Stage " +
      "describe structural progress."
  },
  {
    term: "Timing",
    definition:
      "The approximate point reached during play: early, middle, " +
      "or late in the hand. In Six Box Theory™, Timing provides " +
      "context for assessing Finishing Potential and making decisions. " +
      "Also see Game State."
  },
  {
    term: "Developing Stage",
    definition:
      "The stage of a hand focused on forming and improving the " +
      "groupings needed for a complete hand. It describes structural " +
      "progress rather than how early or late it is in the game. " +
      "A hand may still be in the Developing Stage late in play."
  },
  {
    term: "Completion Stage",
    definition:
      "The stage of a hand focused on completing the remaining " +
      "unfinished groupings and securing Mahjong. It describes " +
      "structural progress rather than how early or late it is " +
      "in the game."
  },

  {
    term: "Finishing Potential",
    abbreviation: "FP",
    definition:
      "A Six Box Theory™ concept for assessing a Developing Box’s " +
      "opportunities to become complete, taking into account factors " +
      "such as Effective Acceptance, available Sources, and Timing. " +
      "It helps compare how readily different Candidates may develop " +
      "as the hand progresses. MJC does not display a single " +
      "Finishing Potential score."
  },

  {
    term: "Candidate",
    definition:
      "A tile or grouping with the potential to become a Complete Box. " +
      "As your hand develops, a Candidate may complete, change into " +
      "another grouping, or be replaced. Examples include an Eye " +
      "Candidate, Chow Candidate, and Chow-Pong Candidate."
  },

  {
    term: "Display",
    definition:
      "A setting that lets you choose the order in which the " +
      "suits, Winds, and Dragons appear in MJC."
  },
  {
    term: "Siete Pares",
    definition:
      "Seven Pairs. A special-hand pattern available under rulesets " +
      "that permit it. The complete winning hand must satisfy " +
      "the requirements of the selected ruleset."
  },
  {
    term: "Escalera",
    definition:
      "A straight: tiles numbered 1 through 9 in the same suit. " +
      "Its role in a special winning hand depends on the ruleset."
  },
  {
    term: "Straight",
    definition:
      "Another name for Escalera: tiles numbered 1 through 9 " +
      "in the same suit."
  },
  {
    term: "Pursuing Siete Pares",
    definition:
      "An indicator that MJC is organizing your hand toward " +
      "the Seven Pairs special-hand pattern."
  },
  {
    term: "Pursuing Escalera",
    definition:
      "An indicator that MJC is organizing your hand toward " +
      "the Escalera special-hand pattern."
  },
  {
    term: "Ruleset",
    definition:
      "The Mahjong rules selected for your hand. The ruleset " +
      "determines which declarations and winning patterns " +
      "MJC permits."
  },

  {
    term: "Mahjong Coach",
    abbreviation: "MJC",
        definition:
      "A learning tool that introduces Six Box Theory™ (6BT) " +
      "to beginning and intermediate Mahjong players and helps " +
      "them put it into practice to understand hand structure " +
      "and make better playing decisions."
  },
  {
    term: "Six Box Theory",
    abbreviation: "6BT",
    definition:
      "A method for understanding Mahjong hand structure. " +
      "In a normal winning 16-Tile hand, five melds and an Eye " +
      "form six completed boxes."
  },
  {
    term: "Box",
    definition:
      "A way of identifying a completed or developing structure " +
      "within your hand."
  },
  {
    term: "Hand Structure",
    definition:
      "The relationships among your tiles, including completed " +
      "groups, developing groups, and Reserves. MJC reveals the " +
      "structure hidden within a Mahjong hand."
  },
  {
    term: "Organized",
    definition:
      "Arranged into groups that make your hand's structure easier " +
      "to see. Organized is the act; structure is the thing."
  },
  {
    term: "Release Tile",
    abbreviation: "RT",
    definition:
      "A control for exploring how an eligible tile in a hidden " +
      "Complete Box can be reassigned to another grouping. " +
      "Available choices depend on your hand and the ruleset."
  },
  {
    term: "BOLO for Eyes",
    definition:
      "Be On the Lookout for Eyes. A reminder to watch for " +
      "opportunities to form the pair your hand needs."
  },
  {
    term: "Replacement Draw",
    definition:
      "An additional draw required after certain declarations, " +
      "such as a Kang, according to the ruleset."
  },

  {
    term: "Meld",
    definition:
      "A completed tile group, such as a Chow, Pong, or Kang."
  },
  {
    term: "Chow",
    definition:
      "Three consecutively numbered tiles of the same suit. " +
      "For example, 3, 4, 5 of Characters."
  },
  {
    term: "Pong",
    definition:
      "Three identical tiles."
  },
  {
    term: "Kang",
    definition:
      "Four identical tiles declared as a meld. A Kang requires " +
      "a replacement draw under the applicable rules."
  },
  {
    term: "Eye",
    definition:
      "The pair of identical tiles required alongside the five " +
      "melds in a normal winning 16-Tile hand."
  },
  {
    term: "Half Eye",
    abbreviation: "HE",
    definition:
      "A single tile being held toward forming the Eye. " +
      "It needs another identical tile to become a pair."
  },
  {
    term: "Hidden",
    definition:
      "Describes tiles or a meld kept concealed from the other " +
      "players. Declaration requirements depend on the ruleset."
  },
  {
    term: "Exposed",
    definition:
      "Describes a meld revealed to the other players, usually " +
      "after claiming a discard."
  },
  {
    term: "Terminal",
    definition:
      "A suited tile numbered 1 or 9."
  },
  {
    term: "Ordinal",
    definition:
      "MJC's term for a suited tile numbered 2 through 8."
  },
  {
    term: "Lone Honor",
    definition:
      "An honor tile with no matching companion in your hand. " +
      "Honor tiles are Winds and Dragons; they cannot form Chows."
  },
  {
    term: "Orphaned Tile",
    definition:
      "A suited tile without Connectivity to nearby numbers " +
      "of the same suit in your hand."
  },

  {
    term: "Correct Last Entry",
    abbreviation: "CLE",
    definition:
      "A control for correcting your most recent tile entry. " +
      "Use it when the last draw, discard, or claim was entered " +
      "incorrectly."
  },
  {
    term: "Fix Hand",
    abbreviation: "FH",
    definition:
      "A tool for correcting MJC's recorded hand to match the " +
      "tiles you actually hold. Set your melds, enter your " +
      "remaining tiles, then review and accept the corrected hand."
  },
  {
    term: "Free Tiles",
    definition:
      "Tiles not assigned to melds in Fix Hand. Enter these " +
      "separately from the melds you have already set."
  },
  {
    term: "Save Hand",
    definition:
      "Stores the current hand and its transcript in Hand History " +
      "for later review. You can save an incomplete hand as well " +
      "as a winning hand."
  },
  {
    term: "Hand History",
    definition:
      "The collection of hands saved in this browser on this " +
      "device. MJC keeps the most recent 20 saved hands."
  },
  {
    term: "New Hand",
    definition:
      "Clears the current hand and returns you to starting tile " +
      "entry. Save the current hand first if you want to keep " +
      "its transcript."
  },
  {
    term: "Transcript",
    definition:
      "A record of a hand for later review. It includes the " +
      "starting tiles, recorded actions, discard recommendations, " +
      "and hand summary."
  },
  {
    term: "Discard Recommendation",
    abbreviation: "DR",
    definition:
      "MJC's suggested discard based on its evaluation of your " +
      "current hand. Open Insight to understand the reason. " +
      "The playing decision remains yours."
  },

  {
    term: "Current Hand Display",
    abbreviation: "CHD",
    definition:
      "The main screen used during play. It shows your hand's " +
      "current structure, including Complete Boxes, Developing " +
      "Boxes, and Reserves, along with available actions."
  },
  {
    term: "Starting Hand Display",
    abbreviation: "SHD",
    definition:
      "The first organized view of your starting hand after you " +
      "press Play On!"
  },
  {
    term: "Tile Selection Screen",
    abbreviation: "TSS",
    definition:
      "The screen where you select your settings and enter your " +
      "starting tiles before pressing Play On!"
  },
  {
    term: "Draw Tile Screen",
    definition:
      "The screen where you enter the tile you have drawn."
  },
  {
    term: "Discard Tile Screen",
    definition:
      "The screen where you select the tile you are discarding."
  },
  {
    term: "Standard View",
    abbreviation: "SV",
    definition:
      "A simpler presentation of your hand's structure with fewer " +
      "coaching details."
  },
  {
    term: "Coaching View",
    abbreviation: "CV",
    definition:
      "A more detailed presentation of your hand's structure, " +
      "with coaching information such as Pathways, Acceptance, " +
      "and Sources."
  },
  {
    term: "Indices",
    definition:
      "The identifying numbers or letters shown on tiles to help " +
      "you recognize them."
  },
  {
    term: "Labels",
    definition:
      "The names shown for box types, such as Chow-Pong Candidate " +
      "or Double-Sided Wait."
  },
  {
    term: "Tiles In Hand",
    abbreviation: "TIH",
    definition:
      "The tile count reported for your current hand, including " +
      "tiles assigned to melds."
  },

  {
    term: "Pathways",
    abbreviation: "PW",
    definition:
      "Ways a Developing Box can advance toward completion. " +
      "Green arrows indicate a needed tile of the same suit with " +
      "a different number. Orange arrows indicate a matching tile."
  },

  {
    term: "Tile Opportunities",
    definition:
      "Copies of tiles that could help a Developing Box advance " +
      "toward completion. Count individual copies, rather than " +
      "just tile names. For example, a 3–4 Double-Sided Wait can " +
      "become a Chow with a 2 or a 5 of the same suit. With four " +
      "copies of each, that gives eight potential tile opportunities. " +
      "These are possibilities, not a guarantee that those tiles " +
      "are still available or will reach your hand. " +
      "Also see Acceptance, Effective Acceptance, Sources, and Pathways."
  },

  {
    term: "Acceptance",
    definition:
      "The number of tile copies that can advance a Developing Box " +
      "toward completion, before accounting for known unavailable copies."
  },
  {
    term: "Effective Acceptance",
    abbreviation: "EA",
    definition:
      "The number above each arrow. It represents the remaining " +
      "tile opportunities that can advance the Developing Box " +
      "toward completion through that pathway."
  },
  {
    term: "Sources",
    definition:
      "How a needed tile can enter your hand: through your own " +
      "draw or an opponent's discard that you can legally claim. " +
      "A Chow has two sources: your draw and the player to your " +
      "left. A Pong has four: your draw and any of the other players."
  },
  {
    term: "Connectivity",
    definition:
      "The support a suited tile has from nearby numbers in the " +
      "same suit that may help it form a Chow."
  },
  {
    term: "Centricity",
    definition:
      "How close a tile's number is to the middle of its suit. " +
      "Central numbers can participate in more Chow combinations " +
      "than numbers near the ends."
  },
  {
    term: "Partner",
    definition:
      "A tile that works with another tile to form a developing " +
      "group. For example, a 5 can partner with a 4 of the same " +
      "suit to form a Double-Sided Wait."
  },
  {
    term: "Groupings",
    definition:
      "Ways of arranging tiles into useful structures. The same " +
      "tiles may allow different combinations of Complete Boxes, " +
      "Developing Boxes, and Reserves."
  },

  {
    term: "Chow Candidate",
    definition:
      "Two tiles of the same suit that need one more tile to form " +
      "a Chow. Chow Candidates include Double-Sided Waits, " +
      "Middle Waits, and Edge Waits."
  },
  {
    term: "Chow-Pong Candidate",
    abbreviation: "CPC",
    definition:
      "A developing group with both Chow and Pong possibilities. " +
      "For example, 2, 2, 3 of the same suit can use a 1 or 4 " +
      "to form a Chow, or another 2 to form a Pong."
  },
  {
    term: "Double-Sided Wait",
    abbreviation: "DSW",
    definition:
      "Two consecutive tiles of the same suit that can form a " +
      "Chow at either end. For example, 4 and 5 can use a 3 or 6. " +
      "The possible pairs run from 2, 3 through 7, 8."
  },
  {
    term: "Middle Wait",
    abbreviation: "MW",
    definition:
      "Two tiles of the same suit with one missing number between " +
      "them. For example, 4 and 6 need a 5 to form a Chow."
  },
  {
    term: "Edge Wait",
    abbreviation: "EW",
    definition:
      "A 1, 2 or 8, 9 combination of the same suit. " +
      "The 1, 2 needs a 3; the 8, 9 needs a 7 to form a Chow."
  },
  {
    term: "Eye Candidate",
    abbreviation: "EC",
    definition:
      "A pair being considered for the Eye required in a normal " +
      "winning hand."
  },
  {
    term: "Eye-Pong Candidate",
    abbreviation: "EPC",
    definition:
      "A pair that can serve as the Eye or develop into a Pong " +
      "with another matching tile."
  },

  {
    term: "Complete Box",
    abbreviation: "CB",
    definition:
      "A completed structure, such as a Chow, Pong, or declared Kang. " +
      "The Eye completes the sixth box in a normal winning 16-Tile hand."
  },
  {
    term: "Developing Box",
    abbreviation: "DB",
    definition:
      "A group of tiles that can develop into a completed structure. " +
      "Examples include a Double-Sided Wait, an Eye-Pong Candidate, " +
      "and a Chow-Pong Candidate."
  },
  {
    term: "Reserve",
    abbreviation: "R",
    definition:
      "A tile not currently assigned to a Complete Box, Developing Box, " +
      "or Half Eye. A Reserve may still have Connectivity and may " +
      "become useful after a later draw or claim."
    },
    {
    term: "Insight",
    definition:
      "An explanation of the reasoning behind an MJC recommendation. " +
      "For discards, Insight explains why MJC favors the suggested tiles. " +
      "For multiple meld choices, it compares the structure left behind " +
      "by each grouping and explains the recommendations, including ties. " +
      "Insight helps you understand the choices while leaving " +
      "the playing decision to you."
  }
];

function openGlossaryDialog() {
  closeDialog("about6BTDialog");
  showGlossaryIndex();
  openDialog("glossaryDialog");
}

function showGlossaryIndex() {
  const content = document.getElementById("glossaryContent");
  content.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = "Alphabetical Index";
  content.appendChild(heading);

  const links = [];

    mjcGlossaryEntries.forEach(function(entry, index) {
    links.push({
      label: entry.abbreviation
        ? entry.term + " (" + entry.abbreviation + ")"
        : entry.term,
      index: index
    });

    if (entry.abbreviation) {
      links.push({
        label: entry.abbreviation,
        index: index
      });
    }
  });

  const aliases = {
    "Save Game": "Save Hand",
    "Game History": "Hand History",
    "New Game": "New Hand"
  };

  Object.keys(aliases).forEach(function(label) {
    const index = mjcGlossaryEntries.findIndex(function(entry) {
      return entry.term === aliases[label];
    });

    if (index !== -1) {
      links.push({
        label: label,
        index: index
      });
    }
  });

  links.sort(function(a, b) {
    return a.label.localeCompare(b.label);
  });

  links.forEach(function(item) {
    const row = document.createElement("p");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "six-box-link";
    button.textContent = item.label;
    button.onclick = function() {
      showGlossaryEntry(item.index);
    };
    row.appendChild(button);
    content.appendChild(row);
  });

  content.scrollTop = 0;
}

function showGlossaryEntry(index) {
  const entry = mjcGlossaryEntries[index];
  if (!entry) return;

  const content = document.getElementById("glossaryContent");
  content.replaceChildren();

  const heading = document.createElement("h3");
    heading.textContent = entry.abbreviation
    ? entry.term + " (" + entry.abbreviation + ")"
    : entry.term;
  content.appendChild(heading);

  const definition = document.createElement("p");
  definition.textContent = entry.definition;
  content.appendChild(definition);

  const groupName = Object.keys(mjcGlossaryGroups).find(
    function(name) {
      return mjcGlossaryGroups[name].includes(entry.term);
    }
  );

  if (groupName) {
    const row = document.createElement("p");
    const link = document.createElement("button");
    link.type = "button";
    link.className = "six-box-link";
    link.textContent = "Explore: " + groupName;
    link.onclick = function() {
      showGlossaryGroup(groupName);
    };
    row.appendChild(link);
    content.appendChild(row);
  }

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "dialog-button";
  backButton.textContent = "Back to Index";
  backButton.onclick = showGlossaryIndex;
  content.appendChild(backButton);

  content.scrollTop = 0;
}

const mjcGlossaryGroups = {
  "Candidates and Waits": [
    "Chow Candidate",
    "Chow-Pong Candidate",
    "Double-Sided Wait",
    "Middle Wait",
    "Edge Wait",
    "Eye Candidate",
    "Eye-Pong Candidate",
    "Half Eye"
  ],
  "Understanding Hand Structure": [
    "Mahjong Coach",
    "Six Box Theory",
    "Hand Structure",
    "Organized",
    "Box",
    "Complete Box",
    "Developing Box",
    "Reserve",
    "Groupings"
  ],
  "Understanding Pathways": [
    "Pathways",
    "Acceptance",
    "Effective Acceptance",
    "Sources",
    "Partner"
  ],
  "Coaching and Recommendations": [
    "Discard Recommendation",
    "Insight",
    "Connectivity",
    "Centricity",
    "Orphaned Tile",
    "Lone Honor",
    "Release Tile",
    "BOLO for Eyes"
  ],
  "Screens and Display Controls": [
    "Tile Selection Screen",
    "Display",
    "Starting Hand Display",
    "Current Hand Display",
    "Draw Tile Screen",
    "Discard Tile Screen",
    "Standard View",
    "Coaching View",
    "Indices",
    "Labels",
    "Tiles In Hand"
  ],
  "Corrections and Hand History": [
    "Correct Last Entry",
    "Fix Hand",
    "Free Tiles",
    "Save Hand",
    "Hand History",
    "New Hand",
    "Transcript"
  ],
  "Melds and Tile Terms": [
    "Meld",
    "Chow",
    "Pong",
    "Kang",
    "Eye",
    "Hidden",
    "Exposed",
    "Terminal",
    "Ordinal",
    "Replacement Draw"
  ],
  "Special Hands and Rules": [
    "Ruleset",
    "Siete Pares",
    "Escalera",
    "Straight",
    "Pursuing Siete Pares",
    "Pursuing Escalera"
  ]
};

function showGlossaryGroup(groupName) {
  const terms = mjcGlossaryGroups[groupName];
  if (!terms) return;

  const content = document.getElementById("glossaryContent");
  content.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = groupName;
  content.appendChild(heading);

  terms.forEach(function(term) {
    const entry = mjcGlossaryEntries.find(function(item) {
      return item.term === term;
    });
    if (!entry) return;

    const title = document.createElement("h4");
    title.textContent = entry.abbreviation
      ? entry.term + " (" + entry.abbreviation + ")"
      : entry.term;
    content.appendChild(title);

    const definition = document.createElement("p");
    definition.textContent = entry.definition;
    content.appendChild(definition);
  });

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.className = "dialog-button";
  backButton.textContent = "Back to Index";
  backButton.onclick = showGlossaryIndex;
  content.appendChild(backButton);

  content.scrollTop = 0;
}

function getDeclarationPrimaryLabel(
  meldType,
  actionType
) {

console.log(
    "Ruleset:",
    ruleset,
    "Action:",
    actionType,
    "Meld:",
    meldType
  );

  /*
  ================================================
  Filipino 16-Tile Vocabulary
  ================================================
  */

  if (ruleset === "filipino16") {

  if (actionType === "sagasa-after-draw") {
    return "Declare Sagasa";
  }

    if (
  actionType === "draw" ||
  actionType === "hidden-kang-after-draw" ||
  actionType === "hidden-news-after-draw"
) {
  return "Declare Secret";
}

    if (actionType === "claimed-kang") {
      return "Commit Kang";
    }

    if (actionType === "claimed-news") {
      return "Commit NEWS";
    }

    if (actionType === "claimed-kang") {
      return "Commit Kang";
    }
  }

  /*
  ================================================
  Universal Fallback Vocabulary
  ================================================
  */

  if (meldType === "kang") {
    return "Declare Kang";
  }

  if (meldType === "news") {
    return "Declare NEWS";
  }

  return "Select Meld";
}

function buildMMRAffectedBoxes() {
  const structure =
    lastActionSnapshot?.canonicalStructureState;

  if (!structure || !mmrState) return null;

  // Collect the existing tiles used by the meld choices.
  // Remove one copy of the incoming tile from each choice.
  const involvedTileKeys = new Set();

  mmrState.candidates.forEach(function(candidate) {
    const existingTiles = [...candidate.tiles];
    const incomingIndex =
      existingTiles.indexOf(mmrState.tileKey);

    if (incomingIndex !== -1) {
      existingTiles.splice(incomingIndex, 1);
    }

    existingTiles.forEach(function(tileKey) {
      involvedTileKeys.add(tileKey);
    });
  });

  const affectedBoxes =
    structure.developingBoxes
      .map(function(box, index) {
        return {
          box: box,
          number:
            structure.completeBoxes.length + index + 1
        };
      })
      .filter(function(item) {
        return item.box.tiles.some(function(tileKey) {
          return involvedTileKeys.has(tileKey);
        });
      });

  if (!affectedBoxes.length) return null;

  const area = document.createElement("section");
  area.style.margin = "18px 0";
  area.setAttribute(
    "aria-label",
    "Affected Developing Boxes"
  );

  const heading = document.createElement("div");
  heading.className = "rt-expected-results-title";
  heading.textContent = "Affected Developing Boxes";
  area.appendChild(heading);

  const explanation = document.createElement("p");
  explanation.textContent =
    "These boxes show your tiles before the incoming tile is added.";
  area.appendChild(explanation);

  const incoming = document.createElement("div");
  incoming.style.margin = "12px 0";
  incoming.innerHTML =
    '<div class="hand-section-title">' +
      'Incoming Tile' +
    '</div>' +
    '<span class="mmr-candidate-tile mmr-key-tile">' +
      renderCoachTile(mmrState.tileKey) +
    '</span>';
  area.appendChild(incoming);

  const boxes = document.createElement("div");
  boxes.className = "developing-area";

  affectedBoxes.forEach(function(item) {
    const card = document.createElement("div");

    card.className =
      "hand-section box-card developing-box" +
      (item.box.type === "cpc" ? " wide-box" : "");

    const title = document.createElement("div");
    title.className = "hand-section-title";
    title.textContent =
      "DB" + item.number + " — " +
      getBoxTypeLabel(item.box.type);

    card.appendChild(title);

    const tiles = document.createElement("div");
    tiles.innerHTML =
      item.box.tiles.map(function(tileKey) {
        return renderCoachTile(tileKey);
      }).join("");

    card.appendChild(tiles);
    boxes.appendChild(card);
  });

  area.appendChild(boxes);
  return area;
}

function buildMMRInsight() {
  const evaluated =
    mmrState.candidates.map(function(candidate) {
      return evaluateMMRCandidate(
        MJC_STATE.getEngineInput(),
        mmrState.tileKey,
        candidate
      );
    });

  const ranked =
    [...evaluated].sort(compareMMRResults);

  const best = ranked[0];
  const bestMetrics =
    getMMRStructureMetrics(best);

  const area = document.createElement("div");
  area.style.textAlign = "left";
  area.style.lineHeight = "1.5";

  function addParagraph(text, bold) {
    const paragraph = document.createElement("p");

    if (bold) {
      const strong = document.createElement("strong");
      strong.textContent = text;
      paragraph.appendChild(strong);
    } else {
      paragraph.textContent = text;
    }

    area.appendChild(paragraph);
  }

  function tileName(tileKey) {
    return tileLabels[tileKey] || tileKey;
  }

  function describeBox(box) {
    const names = {
      ec: "Eye Candidate",
      epc: "Eye-Pong Candidate",
      cpc: "Chow-Pong Candidate",
      dsw: "Double-Sided Wait",
      mw: "Middle Wait",
      ew: "Edge Wait",
      he: "Half Eye",
      pc: "Pong Candidate"
    };

    return (
      (names[box.type] || box.type) +
      ": " +
      box.tiles.map(tileName).join(", ")
    );
  }

  addParagraph(
    "MJC compares the structure left behind by each meld choice."
  );

  evaluated.forEach(function(result) {
    const metrics =
      getMMRStructureMetrics(result);

    const recommended =
      compareMMRResults(result, best) === 0;

    addParagraph(
      result.candidate.type.toUpperCase() +
      ": " +
      result.candidate.tiles.map(tileName).join(", ") +
      (recommended ? " — MJC Recommended" : ""),
      true
    );

    addParagraph(
      "Complete Boxes: " +
      metrics.completeBoxCount +
      ". Developing Boxes: " +
      (
        result.developingBoxes.length
          ? result.developingBoxes
              .map(describeBox)
              .join("; ")
          : "None"
      ) +
      ". Reserves: " +
      (
        result.reserves.length
          ? result.reserves.map(tileName).join(", ")
          : "None"
      ) +
      "."
    );

    if (!recommended) {
      const comparisons = [
        [
          "completeBoxCount",
          "The recommended choices leave more Complete Boxes."
        ],
        [
          "developingTileCount",
          "The recommended choices keep more tiles participating in Developing Boxes."
        ],
        [
          "dswCount",
          "The recommended choices preserve more Double-Sided Waits."
        ],
        [
          "mwCount",
          "The recommended choices preserve more Middle Waits."
        ],
        [
          "ewCount",
          "The recommended choices preserve more Edge Waits."
        ],
        [
          "reserveCount",
          "The recommended choices leave fewer Reserves."
        ],
        [
          "reserveCentricity",
          "With the other comparisons tied, MJC favors keeping more central Reserve tiles."
        ]
      ];

      const difference =
        comparisons.find(function(comparison) {
          return (
            metrics[comparison[0]] !==
            bestMetrics[comparison[0]]
          );
        });

      if (difference) {
        addParagraph(difference[1]);
      }
    }
  });

  const tiedBest =
    evaluated.filter(function(result) {
      return compareMMRResults(result, best) === 0;
    }).length;

  if (tiedBest > 1) {
    addParagraph(
      "The marked choices are tied under MJC’s current structural comparisons."
    );
  }

  addParagraph(
    "This comparison uses your recorded hand. Keep watching the table when making your choice."
  );

  return area;
}


function openMMRDialog() {

console.log(
    "Dialog received:",
    mmrState
  );

  if (!mmrState || !mmrState.candidates) {
    return;
  }

  const isSingleSpecialMeld =
  mmrState.candidates.length === 1 &&
  (
    mmrState.candidates[0].type === "kang" ||
    mmrState.candidates[0].type === "news"
  );

const specialMeldType =
  isSingleSpecialMeld
    ? mmrState.candidates[0].type
    : null;

console.log(
  "MMR:",
  mmrState
);

  const title =
      document.getElementById("mmrTitle");

    title.textContent =
    mmrState.action === "sagasa-after-draw"
    ? (
        ruleset === "filipino16"
          ? "Sagasa Available"
          : "Kang Available"
      )
    : (
        specialMeldType === "kang"
          ? "Kang Available"
          : (
              specialMeldType === "news"
                ? "NEWS Available"
                : "Multiple Melds Detected"
            )
      );


  const optionsContainer =
    document.getElementById("mmrOptions");

  optionsContainer.innerHTML = "";


if (
  specialMeldType === "kang" ||
  specialMeldType === "news"
) {
  const detectedTiles =
    mmrState.candidates[0].tiles;

  const detectedMessage =
    document.createElement("div");

  detectedMessage.className =
    "mmr-special-tiles";

  detectedMessage.innerHTML =
    detectedTiles
      .map(function(tileKey, index) {

        const isKeyTile =
          specialMeldType === "kang" &&
          tileKey === mmrState.tileKey &&
          index === detectedTiles.length - 1;

        return (
          '<span class="mmr-candidate-tile' +
          (isKeyTile ? " mmr-key-tile" : "") +
          '">' +
            renderCoachTile(tileKey) +
          '</span>'
        );
      })
      .join("");

  optionsContainer.appendChild(
    detectedMessage
  );
}

const recommendedCandidates =
  isSingleSpecialMeld
    ? []
    : getMMRRecommendedCandidates(
        MJC_STATE.getEngineInput(),
        mmrState.tileKey,
        mmrState.candidates
      );

const recommendedSignatures =
  new Set(
    recommendedCandidates.map(function(candidate) {
      return getCompleteBoxSignature(candidate);
    })
  );

if (recommendedCandidates.length > 1) {
  const tieMessage =
    document.createElement("div");

  const allChoicesTied =
    recommendedCandidates.length ===
    mmrState.candidates.length;

  tieMessage.textContent = allChoicesTied
    ? "MJC: All available choices are structurally tied."
    : "MJC: The marked choices are equally recommended.";

  tieMessage.style.marginBottom = "12px";

  optionsContainer.appendChild(tieMessage);
}

  mmrState.candidates.forEach(function(candidate, index) {
    const button =
      document.createElement("button");

    button.className =
      "dialog-button primary";

    button.style.display = "block";
    button.style.width = "100%";
    button.style.marginBottom = "10px";


       const isRecommended =
      recommendedSignatures.has(
        getCompleteBoxSignature(candidate)
      );



   if (isSingleSpecialMeld) {

  button.textContent =
    getDeclarationPrimaryLabel(
      specialMeldType,
      mmrState.action
    );

} else {

  const candidateTileHtml =
    candidate.tiles
      .map(function(tileKey) {

        const keyTileClass =
          tileKey === mmrState.tileKey
            ? " mmr-key-tile"
            : "";

        return (
          '<span class="mmr-candidate-tile' +
          keyTileClass +
          '">' +
            renderCoachTile(tileKey) +
          '</span>'
        );
      })
      .join("");

  button.innerHTML =
    '<span class="mmr-candidate-label">' +
      candidate.type.toUpperCase() +
      ':' +
    '</span>' +

    '<span class="mmr-candidate-tiles">' +
      candidateTileHtml +
    '</span>' +

    (
      isRecommended
        ? '<span class="mmr-recommended">' +
            'MJC Recommended' +
          '</span>'
        : ""
    );
}


    button.onclick = function() {
      selectMMRCandidate(index);
    };

    optionsContainer.appendChild(button);
  });

if (
  mmrState.action !== "sagasa-after-draw" &&
  (
    specialMeldType === "kang" ||
    specialMeldType === "news"
  )
) {


  const deferButton =
    document.createElement("button");

  deferButton.className =
    "dialog-button secondary";

  deferButton.style.display = "block";
  deferButton.style.width = "100%";
  deferButton.style.marginBottom = "10px";

  deferButton.textContent =
  mmrState.action === "sagasa-after-draw"
    ? "Defer Sagasa"
    : (
        specialMeldType === "kang"
          ? "Defer Kang"
          : "Defer NEWS"
      );

  deferButton.onclick =
    deferKangDeclaration;

  optionsContainer.appendChild(
    deferButton
  );
}

if (
  !isSingleSpecialMeld &&
  mmrState.candidates.length > 1
) {
  const affectedBoxes =
    buildMMRAffectedBoxes();

  if (affectedBoxes) {
    optionsContainer.appendChild(affectedBoxes);
  }

  const insightButton =

    document.createElement("button");

  insightButton.type = "button";
  insightButton.className =
    "dialog-button secondary";
  insightButton.textContent = "Insight";
  insightButton.style.display = "block";
  insightButton.style.width = "100%";
  insightButton.style.marginBottom = "10px";
  insightButton.setAttribute("aria-expanded", "false");
  insightButton.setAttribute("aria-controls", "mmrInsight");

  const insightArea =
    document.createElement("div");

  insightArea.id = "mmrInsight";
  insightArea.hidden = true;
  insightArea.style.padding = "0 12px";

  insightButton.onclick = function() {
    const opening = insightArea.hidden;

    if (opening && !insightArea.firstChild) {
      insightArea.appendChild(buildMMRInsight());
    }

    insightArea.hidden = !opening;
    insightButton.textContent =
      opening ? "Hide Insight" : "Insight";

    insightButton.setAttribute(
      "aria-expanded",
      String(opening)
    );
  };

  optionsContainer.appendChild(insightButton);
  optionsContainer.appendChild(insightArea);
}

  {
  const ignoreButton =
    document.createElement("button");

  ignoreButton.className =
    "dialog-button secondary";

  ignoreButton.style.display = "block";
  ignoreButton.style.width = "100%";
  ignoreButton.style.marginTop = "6px";

  ignoreButton.textContent =
       mmrState.action === "sagasa-after-draw"
      ? (
          ruleset === "filipino16"
            ? "Ignore Sagasa"
            : "Ignore Kang"
        )
      : (
          specialMeldType === "kang"
            ? "Ignore Kang"
            : (
                specialMeldType === "news"
                  ? "Ignore NEWS"
                  : "Ignore Melds"
              )
        );

  ignoreButton.onclick =
    ignoreMMRCandidates;

  optionsContainer.appendChild(
    ignoreButton
  );
}




  document
    .getElementById("mmrDialog")
    .classList.remove("hidden");
}

function selectMMRCandidate(index) {
  if (
    !mmrState ||
    !mmrState.candidates ||
    !mmrState.candidates[index]
  ) {
    return;
  }

  mmrState.selectedCandidate =
    mmrState.candidates[index];

 

  document
    .getElementById("mmrDialog")
    .classList.add("hidden");

  console.log(
    "MMR selected:",
    mmrState.selectedCandidate
  );

  resumeMMRAction();
}

function deferKangDeclaration() {
  if (!mmrState) {
    return;
  }

const deferredTileKey =
  mmrState.tileKey;

if (
  deferredTileKey &&
  !deferredKangTileKeys.includes(deferredTileKey)
) {
  deferredKangTileKeys.push(deferredTileKey);
}

  if (
  mmrState.action !== "hidden-kang-after-draw" &&
  mmrState.action !== "hidden-news-after-draw" &&
  mmrState.action !== "sagasa-after-draw"
) {
  return;
}


  document
    .getElementById("mmrDialog")
    .classList.add("hidden");

  lockHandContext();

  phase = "game";
  hdMode = "current";
  gameAction = "discard";
  kangReplacementDraw = false;
  replacementDrawSource = null;
  claimType = null;

  lastDrawnTileKey =
    selectedDrawTileKey;

  revisionReturnHDMode = "current";
  revisionTarget = null;
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  mmrState = null;

  showHD();
}


function ignoreMMRCandidates() {
  if (!mmrState) {
    return;
  }

if (mmrState.action === "sagasa-after-draw") {

  const ignoredTileKey =
    mmrState.tileKey;

  if (
    ignoredTileKey &&
    !ignoredKangTileKeys.includes(ignoredTileKey)
  ) {
    ignoredKangTileKeys.push(ignoredTileKey);
  }

  document
    .getElementById("mmrDialog")
    .classList.add("hidden");

  lockHandContext();

  phase = "game";
  hdMode = "current";
  gameAction = "discard";
  kangReplacementDraw = false;
  replacementDrawSource = null;
  claimType = null;

  lastDrawnTileKey =
    selectedDrawTileKey;

  revisionReturnHDMode = "current";
  revisionTarget = null;
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  mmrState = null;

  showHD();
  return;
}

if (mmrState.action === "hidden-kang-after-draw") {

 const isNewsPKC =
  mmrState.candidates &&
  mmrState.candidates[0] &&
  mmrState.candidates[0].type === "news";

const ignoredTileKey =
  isNewsPKC
    ? "news"
    : (
        mmrState.candidates &&
        mmrState.candidates[0] &&
        mmrState.candidates[0].tiles
          ? mmrState.candidates[0].tiles[0]
          : mmrState.tileKey
      );

if (mmrState.fromPKC && ignoredTileKey) {
  deferredKangTileKeys =
    deferredKangTileKeys.filter(function(tileKey) {
      return tileKey !== ignoredTileKey;
    });
}

if (isNewsPKC) {
  ignoredNEWS = true;
} else if (
  ignoredTileKey &&
  !ignoredKangTileKeys.includes(ignoredTileKey)
) {
  ignoredKangTileKeys.push(ignoredTileKey);
}


  document
    .getElementById("mmrDialog")
    .classList.add("hidden");

  lockHandContext();

  phase = "game";
  hdMode = "current";
  gameAction = "discard";
  kangReplacementDraw = false;
  replacementDrawSource = null;
  claimType = null;

  lastDrawnTileKey =
    selectedDrawTileKey;

  revisionReturnHDMode = "current";
  revisionTarget = null;
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  mmrState = null;

  showHD();
  return;
}

if (mmrState.action === "hidden-news-after-draw") {
  ignoredNEWS = true;

  document
    .getElementById("mmrDialog")
    .classList.add("hidden");

  lockHandContext();

  phase = "game";
  hdMode = "current";
  gameAction = "discard";
  kangReplacementDraw = false;
  replacementDrawSource = null;
  claimType = null;

  lastDrawnTileKey =
    selectedDrawTileKey;

  revisionReturnHDMode = "current";
  revisionTarget = null;
  correctingLastEntry = false;
  correctionTargetTileKey = null;
  correctionActionType = null;

  mmrState = null;

  showHD();
  return;
}


const isSingleKang =
  mmrState.candidates &&
  mmrState.candidates.length === 1 &&
  mmrState.candidates[0].type === "kang";

const isSingleNEWS =
  mmrState.candidates &&
  mmrState.candidates.length === 1 &&
  mmrState.candidates[0].type === "news";

if (
  isSingleKang &&
  !ignoredKangTileKeys.includes(mmrState.tileKey)
) {
  ignoredKangTileKeys.push(
    mmrState.tileKey
  );
}

if (isSingleNEWS) {
  ignoredNEWS = true;
}

  document
    .getElementById("mmrDialog")
    .classList.add("hidden");

  console.log(
    "MMR ignored:",
    mmrState.tileKey
  );

  resumeMMRAction();
}

function openGettingStartedDialog() {
  openDialog("gettingStartedDialog");
}


function openAbout6BTDialog() {
  openDialog("about6BTDialog");
}


function openUnderstandingBoxesDialog() {
  document
    .getElementById("understandingBoxesDialog")
    .classList.remove("hidden");
}

function openMeetCandidatesDialog() {
  closeDialog("understandingBoxesDialog");
  openDialog("meetCandidatesDialog");
}

function closeMeetCandidatesDialog() {
  closeDialog("meetCandidatesDialog");
  openDialog("understandingBoxesDialog");
}

function openUserGuideDialog() {
  openDialog("userGuideDialog");
}

function openAcknowledgmentsDialog() {
  openDialog("acknowledgmentsDialog");
}

function openFeedbackDialog() {
  openDialog("feedbackDialog");
}


function openSupportDialog() {
  resetSupportDialog();
  openDialog("supportDialog");
}


function featureComingSoon(input) {
  showToast("Feature Coming Soon");

  setTimeout(function() {
    if (input.name === "rulesetRadio") {
      document.querySelector(
        'input[name="rulesetRadio"][value="' + ruleset + '"]'
      ).checked = true;
    }

    if (input.name === "filipinoHonorRadio") {
      input.checked = false;
    }

    if (input.name === "newsAllowedCheck") {
      input.checked = false;
    }
  }, 0);
}

function updateFilipinoOptions() {
  const selectedRuleset =
    document.querySelector(
      'input[name="rulesetRadio"]:checked'
    );

  const isFilipino =
    selectedRuleset &&
    selectedRuleset.value === "filipino16";

  const honorRadios =
    document.querySelectorAll(
      'input[name="filipinoHonorRadio"]'
    );

  const honorsEnabledRadio =
    document.querySelector(
      'input[name="filipinoHonorRadio"][value="enabled"]'
    );

  const newsCheck =
    document.querySelector(
      'input[name="newsAllowedCheck"]'
    );

  if (!newsCheck) return;

  if (!isFilipino) {
    honorRadios.forEach(function(radio) {
      radio.checked = false;
      radio.disabled = true;
    });

    newsCheck.checked = false;
    newsCheck.disabled = true;

    return;
  }

  honorRadios.forEach(function(radio) {
    radio.disabled = false;
  });

  let selectedHonor =
    document.querySelector(
      'input[name="filipinoHonorRadio"]:checked'
    );

  if (!selectedHonor && honorsEnabledRadio) {
    honorsEnabledRadio.checked = true;
    selectedHonor = honorsEnabledRadio;
  }

  const honorsEnabled =
    selectedHonor?.value === "enabled";

  if (honorsEnabled) {
    newsCheck.disabled = false;
    newsCheck.checked = true;
  } else {
    newsCheck.checked = false;
    newsCheck.disabled = true;
  }
}
function saveRulesDialog() {
  const selected = document.querySelector(
    'input[name="rulesetRadio"]:checked'
  );

  const filipinoHonorsDisabled =
    selected &&
    selected.value === "filipino16" &&
    document.querySelector(
      'input[name="filipinoHonorRadio"]:checked'
    )?.value === "disabled";

  const honorTilesEntered =
    (counts.east || 0) +
    (counts.south || 0) +
    (counts.west || 0) +
    (counts.north || 0) +
    (counts.red || 0) +
    (counts.green || 0) +
    (counts.white || 0);

  if (
    filipinoHonorsDisabled &&
    honorTilesEntered > 0
  ) {
    showToast(
      "Remove all Wind and Dragon tiles before disabling Honors."
    );
    return;
  }

  if (selected) {
    setRuleset(selected.value);
  }

  closeDialog("rulesDialog");
  showToast("Rules Saved.");
}

function updateDisplaySuitOptions(preferredSecond) {
  const suits = ["chars", "bams", "dots"];

  const labels = {
    chars: "Chars",
    bams: "Bams",
    dots: "Dots"
  };

  const first = document.getElementById("firstSuitSelect").value;
  const secondSelect = document.getElementById("secondSuitSelect");

  const validSeconds = suits.filter(function(suit) {
    return suit !== first;
  });

  const existingSecond = preferredSecond || secondSelect.value;

  const nextSecond = validSeconds.includes(existingSecond)
    ? existingSecond
    : validSeconds[0];

  secondSelect.innerHTML = "";

  validSeconds.forEach(function(suit) {
    const option = document.createElement("option");
    option.value = suit;
    option.textContent = labels[suit];
    secondSelect.appendChild(option);
  });

  secondSelect.value = nextSecond;
  updateThirdSuitPreview();
}

function updateThirdSuitPreview() {
  const suits = ["chars", "bams", "dots"];

  const labels = {
    chars: "Chars",
    bams: "Bams",
    dots: "Dots"
  };

  const first = document.getElementById("firstSuitSelect").value;
  const second = document.getElementById("secondSuitSelect").value;

  const third = suits.find(function(suit) {
    return suit !== first && suit !== second;
  });

  document.getElementById("thirdSuitPreview").textContent = labels[third];
}

function saveDisplayDialog() {
  const suits = ["chars", "bams", "dots"];

  const first = document.getElementById("firstSuitSelect").value;
  const second = document.getElementById("secondSuitSelect").value;

  const third = suits.find(function(suit) {
    return suit !== first && suit !== second;
  });

  const honors = document.querySelector(
    'input[name="honorsOrderRadio"]:checked'
  ).value;

  displayOrder = {
    firstSuit: first,
    secondSuit: second,
    thirdSuit: third,
    honorsOrder: honors
  };

  closeDialog("displayDialog");
  showToast("Display Saved.");
  applyDisplayOrderToScreens();

  if (!document.getElementById("hdScreen").classList.contains("hidden")) {
    buildHandDisplay();
  }

  if (!document.getElementById("discardScreen").classList.contains("hidden")) {
    buildDiscardDisplay();
  }
}

function showECProtectionDialog() {
  const dialog =
    document.getElementById("ecProtectionDialog");

  if (!dialog) {
    return;
  }

  dialog.classList.remove("hidden");
}

function keepECProtected() {
  document
    .getElementById("ecProtectionDialog")
    .classList.add("hidden");

  if (!mmrState) {
    return;
  }

  const ec =
    canonicalStructureState.developingBoxes.find(
      function(box) {
        return box.type === "ec";
      }
    );

  if (!ec || !ec.tiles || ec.tiles.length === 0) {
    return;
  }

  protectedECTileKey = ec.tiles[0];

  mmrState.skipCommit = true;
  mmrState.ecProtectionOverride = true;

  resumeMMRAction();
}

function continueWithoutEC() {
  document
    .getElementById("ecProtectionDialog")
    .classList.add("hidden");

  if (!mmrState) {
    return;
  }

  // Allow this specific MMR action through
  // the EC protection gate.
  mmrState.ecProtectionOverride = true;

  resumeMMRAction();
}

function showMahjongWatchECDialog() {
  const dialog =
    document.getElementById("mahjongWatchECDialog");

  if (!dialog) {
    return;
  }

  dialog.classList.remove("hidden");
}

function keepMahjongWatchEC() {
  document
    .getElementById("mahjongWatchECDialog")
    .classList.add("hidden");

  mahjongWatchECDiscardOverride = false;
}

function discardMahjongWatchECAnyway() {
  document
    .getElementById("mahjongWatchECDialog")
    .classList.add("hidden");

  mahjongWatchECDiscardOverride = true;

  confirmDiscard();
}

function showBOLOEyesDialog() {
  document
    .getElementById("boloEyesDialog")
    .classList.remove("hidden");
}

function closeBOLOEyesDialog() {
  document
    .getElementById("boloEyesDialog")
    .classList.add("hidden");
}

function showOverPairedDialog(pairCount) {
  const message =
    document.getElementById("overPairedMessage");

  if (message) {
    message.textContent =
      "You now have " +
      pairCount +
      " pairs. Are you pursuing Siete Pares (Seven Pairs)?";
  }

  document
    .getElementById("overPairedDialog")
    .classList.remove("hidden");
}

function confirmSevenPairs() {
  sevenPairsMode = true;
  sevenPairsBoxState.active = true;

  const result =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  const structureState =
    result.structureState || result;

  updateSevenPairsBoxState(
    counts,
    structureState.completeBoxes
  );

  syncSevenPairsCompletionOrder();

  const title =
    document.querySelector(
      "#sevenPairsAcknowledgmentDialog h2"
    );

  const message =
    document.querySelector(
      "#sevenPairsAcknowledgmentDialog p"
    );

  if (ruleset === "filipino16") {
    title.textContent = "Siete Pares Selected";

    message.innerHTML =
  "MJC will continue coaching while you pursue<br>" +
  "Siete Pares (Seven Pairs).";
  } else {
    title.textContent = "Seven Pairs Selected";

    message.innerHTML =
      "MJC will continue coaching while you pursue<br>" +
      "Seven Pairs.";
}

  document
    .getElementById("overPairedDialog") 
    .classList.add("hidden");

  document
    .getElementById("sevenPairsAcknowledgmentDialog")
    .classList.remove("hidden");
}



function confirmEscalera() {
  escaleraMode = true;

  const result =
    evaluate17TE(
      MJC_STATE.getEngineInput()
    );

  const structureState =
    result.structureState || result;

  const candidatesBySuit =
    getEscaleraCandidates(
      counts,
      structureState.completeBoxes
    );

  escaleraBoxState.active = true;

  escaleraBoxState.candidateTileKeys =
    candidatesBySuit[
      escaleraBoxState.suit
    ] || [];

  escaleraBoxState.distinctCount =
    escaleraBoxState.candidateTileKeys.length;

  escaleraBoxState.complete =
    escaleraBoxState.distinctCount === 9;

  escaleraBoxState.completedMeldCount =
    escaleraBoxState.complete ? 3 : 0;

  const escaleraResult =
  evaluate17TE(
    MJC_STATE.getEngineInput()
  );

const escaleraStructureState =
  escaleraResult.structureState ||
  escaleraResult;

updateEscaleraRequirements(
  escaleraStructureState
);

  const isFilipino =
    ruleset === "filipino16";

  const title =
    document.querySelector(
      "#escaleraAcknowledgmentDialog h2"
    );

  const message =
    document.querySelector(
      "#escaleraAcknowledgmentDialog p"
    );

  if (title && message) {
    if (isFilipino) {
      title.textContent =
        "Escalera Mode On";

      message.textContent =
        "MJC will continue coaching while you pursue Escalera (a Straight).";
    } else {
      title.textContent =
        "Straight Mode On";

      message.textContent =
        "MJC will continue coaching while you pursue a Straight.";
    }
  }

  document
    .getElementById("escaleraDialog")
    .classList.add("hidden");

  document
    .getElementById("escaleraAcknowledgmentDialog")
    .classList.remove("hidden");
}


function declineEscalera() {
  escaleraMode = false;

  document
    .getElementById("escaleraDialog")
    .classList.add("hidden");
}

function closeEscaleraAcknowledgmentDialog() {
  document
    .getElementById("escaleraAcknowledgmentDialog")
    .classList.add("hidden");

  buildHandDisplay();

  if (coachingOn) {
    renderCoachView();
  }
}

function continueEscalera() {
  escaleraMode = true;

  document
    .getElementById("escaleraStatusDialog")
    .classList.add("hidden");
}

function endEscalera() {
  escaleraMode = false;

  const isFilipino =
    ruleset === "filipino16";

  const title =
    document.querySelector(
      "#escaleraCoachingResumeDialog h2"
    );

  const message =
    document.querySelector(
      "#escaleraCoachingResumeDialog p"
    );

  if (title && message) {
    if (isFilipino) {
      title.textContent =
        "Escalera Ended";

      message.textContent =
        "Coaching has resumed.";
    } else {
      title.textContent =
        "Straight Ended";

      message.textContent =
        "Coaching has resumed.";
    }
  }

  document
    .getElementById("escaleraStatusDialog")
    .classList.add("hidden");

  document
    .getElementById("escaleraCoachingResumeDialog")
    .classList.remove("hidden");
}

function closeEscaleraCoachingResumeDialog() {
  document
    .getElementById("escaleraCoachingResumeDialog")
    .classList.add("hidden");

  resetEscaleraBoxState();

  buildHandDisplay();

  if (coachingOn) {
    renderCoachView();
  }
}


function closeSevenPairsAcknowledgmentDialog() {
  document
    .getElementById("sevenPairsAcknowledgmentDialog")
    .classList.add("hidden");

  buildHandDisplay();

  if (coachingOn) {
    renderCoachView();
  }
}

function continueSevenPairs() {
  sevenPairsMode = true;

  document
    .getElementById("sevenPairsStatusDialog")
    .classList.add("hidden");
}

function endSevenPairs() {
  sevenPairsMode = false;
  resetSevenPairsBoxState();

  document
    .getElementById("sevenPairsStatusDialog")
    .classList.add("hidden");

  // Set ruleset-aware wording
  const resumeTitle =
    document.querySelector(
      "#sevenPairsCoachingResumeDialog h2"
    );

  const resumeMessage =
    document.querySelector(
      "#sevenPairsCoachingResumeDialog p"
    );

  if (ruleset === "filipino16") {
    resumeTitle.textContent =
      "Siete Pares Ended";

    resumeMessage.textContent =
      "Coaching has resumed.";
  } else {
    resumeTitle.textContent =
      "Seven Pairs Ended";

    resumeMessage.textContent =
      "Coaching has resumed.";
  }

  // Show the dialog
  document
    .getElementById("sevenPairsCoachingResumeDialog")
    .classList.remove("hidden");
} 

function closeSevenPairsCoachingResumeDialog() {
  document
    .getElementById("sevenPairsCoachingResumeDialog")
    .classList.add("hidden");
}

function declineSevenPairs() {
  sevenPairsMode = false;
  overPairedDelayOneEvaluation = true;

  document
    .getElementById("overPairedDialog")
    .classList.add("hidden");
}

function closeOverPairedAdviceDialog() {
  document
    .getElementById("overPairedAdviceDialog")
    .classList.add("hidden");
}

function openGameHistoryDialog() {
  try {
    const games = getSavedGames();
    const content = document.getElementById("gameHistoryContent");
    content.replaceChildren();

    const note = document.createElement("p");
    note.textContent = games.length
                  ? "Saved Hands: " + games.length + " (Keeps your 20 most recent hands.)"
      : "No saved hands.";
    content.appendChild(note);
    if (games.length > 0) {
      const clearButton = document.createElement("button");
      clearButton.className = "dialog-button";
      clearButton.textContent = "Clear All";
      clearButton.onclick = clearSavedGameHistory;
      content.appendChild(clearButton);
    }

    games.forEach(function(game, index) {
      const row = document.createElement("p");
      row.textContent =
        (index + 1) + ". " +
        new Date(game.savedAt).toLocaleString() +
        " — " + game.status +
        " — " + game.ruleset;
      const viewButton = document.createElement("button");
      viewButton.className = "dialog-button";
      viewButton.textContent = "View Transcript";
      viewButton.onclick = function() {
        viewSavedGameTranscript(index);
      };

      row.appendChild(document.createElement("br"));
      row.appendChild(viewButton);

      content.appendChild(row);
    });

    openDialog("gameHistoryDialog");


  } catch (error) {
    console.error("Game history failed:", error);
    showToast("Unable to open game history.");
  }
}

function viewSavedGameTranscript(index) {
  try {
    const game = getSavedGames()[index];
    if (!game) return;

    const content =
      document.getElementById("gameHistoryContent");

    content.replaceChildren();

    const backButton = document.createElement("button");
    backButton.className = "dialog-button";
    backButton.textContent = "Back to History";
    backButton.onclick = openGameHistoryDialog;
    content.appendChild(backButton);
    const deleteButton = document.createElement("button");
    deleteButton.className = "dialog-button";
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function() {
      deleteSavedGameById(game.id);
    };
    content.appendChild(deleteButton);
    const shareButton = document.createElement("button");
    shareButton.className = "dialog-button";
    shareButton.textContent = "Share";
    shareButton.onclick = function() {
      shareSavedGameById(game.id);
    };
    content.appendChild(shareButton);
    const transcriptButtons = document.createElement("div");
    transcriptButtons.style.display = "flex";
    transcriptButtons.style.flexWrap = "wrap";
    transcriptButtons.style.gap = "8px";
    transcriptButtons.append(backButton, deleteButton, shareButton);
    content.appendChild(transcriptButtons);
    const detailsButton = document.createElement("button");
    detailsButton.className = "dialog-button";
    detailsButton.textContent = "Edit Details";
    detailsButton.onclick = function() {
      editSavedHandDetails(game.id);
    };
    transcriptButtons.appendChild(detailsButton);
    const body = document.createElement("div");
    body.style.maxHeight = "50vh";
    body.style.overflowY = "auto";
    content.appendChild(body);

    function addText(text, heading) {
      const element =
        document.createElement(heading ? "h3" : "p");
      element.textContent = text;
      body.appendChild(element);
    }

    function tileList(tiles) {
      return (tiles || []).map(function(key) {
        return tileLabels[key] || key;
      }).join(", ");
    }

    function addState(label, state) {
      addText(label, true);

      if (!state) {
        addText("Not recorded.");
        return;
      }

      addText("Tiles: " + tileList(state.tiles));
      addText("Turn cycle: " + state.turnCycle);

      (state.melds || []).forEach(function(meld) {
        addText(
          meld.type + " — " + meld.visibility +
          ": " + tileList(meld.tiles)
        );
      });
    }

    addText("Hand Summary", true);
    addText(new Date(game.savedAt).toLocaleString());
    if (game.playerName) {
      addText("Player: " + game.playerName);
    }
    if (game.seatWind) {
      addText("Seat Wind: " + getWindLabel(game.seatWind));
    }
    if (game.roundWind) {
      addText("Round Wind: " + getWindLabel(game.roundWind));
    }
    if (game.notes) {
      const notesText = document.createElement("p");
      notesText.style.whiteSpace = "pre-wrap";
      notesText.textContent = "Notes: " + game.notes;
      body.appendChild(notesText);
    }
        addText("Status: " + game.status);
    addText("Ruleset: " + game.ruleset);
    addText(
      "Honors: " +
      (typeof game.honorsEnabled === "boolean"
        ? (game.honorsEnabled ? "Enabled" : "Disabled")
        : "Not recorded")
    );
    addText("Role: " + game.role);
    addText("Version: " + game.version);
    addText("Tiles in Hand: " + game.tilesInHand);
    addText(
      "Boxes Completed: " + game.boxesCompleted +
      " of " + game.boxTarget
    );

    

    addText("Initial Tiles", true);
    addText(tileList(game.initialTiles));

    addText("Recorded Actions", true);

    if (!(game.actions || []).length) {
      addText("No actions recorded.");
    }

        let turnNumber = 1;
    let turnHeadingNeeded = true;
    const actions = game.actions || [];

    actions.forEach(function(action, i) {
      if (turnHeadingNeeded) {
        addText("Turn " + turnNumber, true);
        turnHeadingNeeded = false;
      }

      if (action.type === "FH") {
        addState("Fix Hand — Before", action.before);
        addState("Fix Hand — Accepted", action.accepted);
        return;
      }

      if (action.type === "DR") {
        // Display consecutive recommendations together.
        if (i > 0 && actions[i - 1].type === "DR") {
          return;
        }

        const recommendations = [];

        for (
          let j = i;
          j < actions.length && actions[j].type === "DR";
          j++
        ) {
          recommendations.push(actions[j].tileKey);
        }

        addText("DR = " + tileList(recommendations));
        return;
      }

      addText(
        action.type + " = " +
        (tileLabels[action.tileKey] || action.tileKey || "")
      );

      if (action.type === "Di") {
        turnNumber++;
        turnHeadingNeeded = true;
      }
    });

addText("Final Melds", true);

    if (!(game.melds || []).length) {
      addText("None.");
    }

    (game.melds || []).forEach(function(meld) {
      addText(
        meld.type + " — " + meld.visibility +
        ": " + tileList(meld.tiles)
      );
    });
  } catch (error) {
    console.error("Transcript view failed:", error);
    showToast("Unable to open transcript.");
  }
}

function deleteSavedGameById(id) {
  if (!window.confirm("Delete this saved hand?")) return;

  try {
    const games = getSavedGames();
    const remaining = games.filter(function(game) {
      return game.id !== id;
    });

    localStorage.setItem(
      "mjcSavedGames",
      JSON.stringify(remaining)
    );

    if (gameTranscript.savedGameId === id) {
      gameTranscript.savedGameId = null;
    }

    openGameHistoryDialog();
    showToast("Saved hand deleted.");
  } catch (error) {
    console.error("Hand deletion failed:", error);
    showToast("Unable to delete saved hand.");
  }
}

function clearSavedGameHistory() {
  if (!window.confirm(
    "Delete all saved hands from History? This cannot be undone."
  )) return;

  try {
    localStorage.removeItem("mjcSavedGames");
    gameTranscript.savedGameId = null;

    openGameHistoryDialog();
    showToast("Hand history cleared.");
  } catch (error) {
    console.error("Clear history failed:", error);
    showToast("Unable to clear hand history.");
  }
}

async function shareSavedGameById(id, suppliedName) {
  try {
    const game = getSavedGames().find(function(item) {
      return item.id === id;
    });

    if (!game) {
      showToast("Saved hand not found.");
      return;
    }

        if (typeof suppliedName !== "string") {
      const existing = document.getElementById("handShareForm");
      if (existing) {
        existing.querySelector("input").focus();
        return;
      }

      const form = document.createElement("form");
      form.id = "handShareForm";
      form.style.margin = "12px 0";

      const label = document.createElement("label");
      label.textContent = "Your name or nickname: ";

      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 100;
      input.required = true;
      label.appendChild(input);
      form.appendChild(label);

      const submit = document.createElement("button");
      submit.type = "submit";
      submit.className = "dialog-button";
      submit.textContent = "Share Hand";
      form.appendChild(submit);

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "dialog-button";
      cancel.textContent = "Cancel";
      cancel.onclick = function() {
        form.remove();
      };
      form.appendChild(cancel);

      form.onsubmit = function(event) {
        event.preventDefault();

        const name = input.value.trim();
        if (!name) {
          showToast("Enter a name or nickname before sharing.");
          return;
        }

        form.remove();
        shareSavedGameById(id, name);
      };

      document.getElementById("gameHistoryContent").prepend(form);
      input.focus();
      return;
    }

    const playerName = suppliedName.trim();

    if (!playerName) {
      showToast("Enter a name or nickname before sharing.");
      return;
    }

    const sharedHand = {
      format: "mjc-hand",
      formatVersion: 1,
      sharedAt: new Date().toISOString(),
      hand: {
        ...game,
        playerName: playerName
      }
    };

    const file = new File(
      [JSON.stringify(sharedHand, null, 2)],
      "MJC-Hand.json",
      { type: "application/json" }
    );

    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
            try {
        await navigator.share({
          title: "MJC Hand — " + playerName,
          text: "Played by: " + playerName,
          files: [file]
        });
        return;
      } catch (shareError) {
        if (shareError.name === "AbortError") return;

        if (shareError.name !== "NotAllowedError") {
          throw shareError;
        }

        // Continue to the existing file download below.
      }
    }

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(function() {
      URL.revokeObjectURL(url);
    }, 60000);

    showToast("Hand file downloaded for sharing.");
  } catch (error) {
    if (error.name === "AbortError") return;

    console.error("Hand sharing failed:", error);
    showToast("Unable to share saved hand.");
  }
}

function editSavedHandDetails(id) {
  try {
    const game = getSavedGames().find(function(item) {
      return item.id === id;
    });
    if (!game) {
      showToast("Saved hand not found.");
      return;
    }

    const content = document.getElementById("gameHistoryContent");
    const body = content.lastElementChild;
    body.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Edit Hand Details";
    body.appendChild(heading);

    const note = document.createElement("p");
    note.textContent = "All fields are optional.";
    body.appendChild(note);

    const form = document.createElement("form");
    body.appendChild(form);

    function addField(labelText, control) {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.marginBottom = "12px";
      label.textContent = labelText;

      control.style.display = "block";
      control.style.width = "100%";
      control.style.boxSizing = "border-box";
      label.appendChild(control);
      form.appendChild(label);
      return control;
    }

    const name = document.createElement("input");
    name.type = "text";
    name.maxLength = 100;
    name.value = game.playerName || "";
    addField("Name or Nickname", name);

    function addWind(label, value) {
      const select = document.createElement("select");

      ["", "east", "south", "west", "north"].forEach(function(wind) {
        const option = document.createElement("option");
        option.value = wind;
        option.textContent = wind
          ? wind.charAt(0).toUpperCase() + wind.slice(1)
          : "Not specified";
        select.appendChild(option);
      });

      select.value = value || "";
      return addField(label, select);
    }

    const seat = addWind("Seat Wind", game.seatWind);
    const round = addWind("Round Wind", game.roundWind);

    const notes = document.createElement("textarea");
    notes.rows = 4;
    notes.maxLength = 2000;
    notes.value = game.notes || "";
    addField("Notes", notes);

    function returnToTranscript() {
      const index = getSavedGames().findIndex(function(item) {
        return item.id === id;
      });
      if (index >= 0) {
        viewSavedGameTranscript(index);
      } else {
        openGameHistoryDialog();
      }
    }

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.gap = "8px";
    form.appendChild(buttons);

    const save = document.createElement("button");
    save.type = "submit";
    save.className = "dialog-button";
    save.textContent = "Save Details";
    buttons.appendChild(save);

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "dialog-button";
    cancel.textContent = "Cancel";
    cancel.onclick = returnToTranscript;
    buttons.appendChild(cancel);

    form.onsubmit = function(event) {
      event.preventDefault();

      try {
        const games = getSavedGames();
        const saved = games.find(function(item) {
          return item.id === id;
        });

        if (!saved) {
          showToast("Saved hand not found.");
          return;
        }

        saved.playerName = name.value.trim();
        saved.seatWind = seat.value;
        saved.roundWind = round.value;
        saved.notes = notes.value.trim();

        localStorage.setItem("mjcSavedGames", JSON.stringify(games));
        returnToTranscript();
        showToast("Hand details saved.");
      } catch (error) {
        console.error("Hand details save failed:", error);
        showToast("Unable to save hand details.");
      }
    };

    body.scrollTop = 0;
    name.focus();
  } catch (error) {
    console.error("Hand details editor failed:", error);
    showToast("Unable to open hand details.");
  }
}