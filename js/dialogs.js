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

function searchUserGuide() {
  const input = document.getElementById("userGuideSearchInput");
  const results = document.getElementById("userGuideSearchResults");
  const status = document.getElementById("userGuideSearchStatus");

  if (!input || !results || !status) return;

  results.replaceChildren();

  const query = input.value.trim();
  if (!query) {
    results.hidden = true;
    status.textContent = "Enter a word or phrase to search the User Guide.";
    input.focus();
    return;
  }

  const normalize = function(text) {
    return text.toLowerCase().replace(/\s+/g, " ").trim();
  };

  const words = normalize(query).split(" ");
  const matches = [];

  document.querySelectorAll(
    '[id^="userGuideChapter"][id$="Dialog"]'
  ).forEach(function(chapter) {
    const title = chapter.querySelector("h2");
    const nav = chapter.querySelector("nav");
    if (!title || !nav) return;

    const scroller = nav.parentElement;
    const sections = [];
    let section = {
      name: "Introduction",
      heading: title,
      passages: []
    };
    sections.push(section);

    scroller.querySelectorAll("h3, h4, p, li").forEach(function(node) {
      if (node.closest("nav")) return;

      const text = node.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;

      if (node.matches("h3, h4")) {
        section = {
          name: text,
          heading: node,
          passages: []
        };
        sections.push(section);
        return;
      }

      // Avoid indexing a list item twice when it contains paragraphs.
      if (node.matches("li") && node.querySelector("p, li")) return;

      section.passages.push({ node: node, text: text });
    });

    sections.forEach(function(item) {
      const sectionText = normalize(
        title.textContent + " " + item.name + " " +
        item.passages.map(function(passage) {
          return passage.text;
        }).join(" ")
      );

      if (!words.every(function(word) {
        return sectionText.includes(word);
      })) return;

      const passage = item.passages.find(function(candidate) {
        const text = normalize(candidate.text);
        return words.every(function(word) {
          return text.includes(word);
        });
      }) || item.passages.find(function(candidate) {
        const text = normalize(candidate.text);
        return words.some(function(word) {
          return text.includes(word);
        });
      }) || item.passages[0];

      matches.push({
        chapter: chapter,
        title: title.textContent.trim(),
        section: item.name,
        target: passage ? passage.node : item.heading,
        scroller: scroller,
                excerpt: passage ? passage.text : item.name,
        relevance:
          (normalize(item.name).includes(normalize(query)) ? 100 : 0) +
          (normalize(title.textContent).includes(normalize(query)) ? 50 : 0) +
          (sectionText.includes(normalize(query)) ? 20 : 0)
      });
    });
  });

    matches.sort(function(a, b) {
    return b.relevance - a.relevance;
  });

  results.hidden = false;
  status.textContent = matches.length
    ? matches.length + " matching section" +
      (matches.length === 1 ? "." : "s.")
    : "No matches in the User Guide. Try a different word or phrase.";

  matches.forEach(function(match) {
    const card = document.createElement("div");
    card.style.cssText =
      "border:1px solid #ddd;border-radius:10px;" +
      "padding:12px;margin-bottom:10px;";

    const button = document.createElement("button");
    button.type = "button";
    button.style.cssText =
      "display:block;width:100%;background:none;border:0;" +
      "padding:0;text-align:left;color:#2459b4;" +
      "text-decoration:underline;font-size:16px;cursor:pointer;";
    button.textContent = match.title + " — " + match.section;

    button.onclick = function() {
      closeDialog("userGuideDialog");
      openDialog(match.chapter.id);

      requestAnimationFrame(function() {
        const top = match.scroller.scrollTop +
          match.target.getBoundingClientRect().top -
          match.scroller.getBoundingClientRect().top - 12;

        match.scroller.scrollTo({
          top: Math.max(0, top),
          behavior: "auto"
        });

                match.target.setAttribute("tabindex", "-1");
                match.target.style.outline = "2px solid #2459b4";
        match.target.style.outlineOffset = "2px";

        match.target.addEventListener("blur", function() {
          match.target.style.removeProperty("outline");
          match.target.style.removeProperty("outline-offset");
        }, { once: true });

        match.target.focus({ preventScroll: true });
      });
    };

    const excerpt = document.createElement("p");
    excerpt.style.cssText = "margin:8px 0 0;line-height:1.5;";

    let text = match.excerpt;
    if (text.length > 240) {
      const lower = normalize(text);
      const firstMatch = words.reduce(function(best, word) {
        const position = lower.indexOf(word);
        return position >= 0 ? Math.min(best, position) : best;
      }, text.length);

      const start = Math.max(0, firstMatch - 70);
      text = (start ? "…" : "") +
        text.slice(start, start + 240) +
        (start + 240 < text.length ? "…" : "");
    }

    excerpt.textContent = text;
    card.append(button, excerpt);
    results.appendChild(card);
  });
}

function openAboutDialog() {
  openDialog("aboutDialog");
}

function openDialog(id) {
  const dialog = document.getElementById(id);

  if (/^userGuideChapter\d+Dialog$/.test(id)) {
    const results =
      document.getElementById("userGuideSearchResults");

    const hasResults =
      results &&
      !results.hidden &&
      results.childElementCount > 0;

    dialog.querySelectorAll(".dialog-actions button")
      .forEach(function(button) {
        const label = button.textContent.trim();

        if (
          label === "Back to Contents" ||
          label === "Back to Results"
        ) {
          button.textContent = hasResults
            ? "Back to Results"
            : "Back to Contents";
        }
      });
  }

  dialog.classList.remove("hidden");
}

function closeDialog(id) {
  document.getElementById(id).classList.add("hidden");
}

const mjcGlossaryEntries = [

  {
    term: "Principle of Contribution",
    definition:
      "A tile’s value is shaped by what it contributes " +
      "to the hand as a whole. That contribution is " +
      "dynamic: a tile’s role can change as the hand develops."
  },
  {
    term: "Deferred",
    definition:
      "A declaration you have postponed. " +
      "MJC tracks the deferred grouping while you continue playing. " +
      "It has not been declared, so no replacement draw " +
      "is recorded for it yet."
  },
  {
    term: "Ignored",
    definition:
      "An offer you have declined, such as a Kang, NEWS, or Sagasa. " +
      "Ignoring the offer does not remove the incoming tile " +
      "or undo the action you recorded. " +
      "Follow MJC’s next instruction."
  },
  {
    term: "Over-paired / Over-pairing",
    definition:
      "Having more pairs than a regular hand can keep as pairs. " +
      "A regular winning hand needs one Eye; additional pairs " +
      "must develop into melds or be broken apart as the hand " +
      "progresses. A Seven Pairs pursuit uses a different structure."
  },
  {
    term: "Discard Pile",
    definition:
      "The area in the middle of the table where discarded tiles " +
      "remain face up unless claimed. These visible tiles help " +
      "players assess which copies remain available."
  },
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
    term: "Sagasa",
    definition:
      "A Mahjong move in which a player adds a fourth matching " +
      "tile to an existing exposed Pong, converting it into a Kang."
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
    term: "Target Tiles",
    abbreviation: "TT",
    definition:
      "Tiles that can help your current Developing Boxes " +
      "advance or become complete. For example, 7 and 8 Bam " +
      "in a Double-Sided Wait have two Target Tiles: " +
      "6 Bam and 9 Bam. Your targets can change as your " +
      "hand develops. A Target Tile is useful to your hand, " +
      "but this does not guarantee that a copy is still available."
  },
  {
    term: "Target Tiles Panel",
    abbreviation: "TTP",
    definition:
      "The panel that displays the Target Tiles for your " +
      "current hand. Tap the Target Tiles tab to open or " +
      "close it. Recheck your targets as your groupings " +
      "change, and watch the discards and exposed melds " +
      "to help judge availability."
  },
  {
    term: "Terminal",
    definition:
      "A suited tile numbered 1 or 9."
  },
  {
    term: "Terminality",
    definition:
      "A Six Box Theory™ principle that favors completed Chows " +
      "closer to the terminal tiles (1 and 9) when evaluating " +
      "otherwise comparable meld choices. Terminality helps " +
      "preserve the flexibility of more central tiles, which " +
      "generally offer greater opportunities for forming " +
      "additional combinations. For example, when choosing " +
      "between completing a 2–3–4 Chow or a 3–4–5 Chow, MJC " +
      "may favor 2–3–4 because it is closer to the terminal " +
      "edge, preserving more central tiles for further " +
      "development. Terminality complements Centricity, which " +
      "recognizes the greater combination potential of tiles " +
      "nearer the center of a suit. Terminality is a preference, " +
      "not an absolute rule."
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
    term: "Recording",
    definition:
      "Entering your starting tiles, draws, discards, " +
      "and claims into MJC as you play. Recording allows " +
      "MJC to follow your hand, organize your tiles using " +
      "Six Box Theory™, and keep its display current."
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
      "device. MJC keeps your 80 most recent hands. You can " +
      "review a hand's Transcript and, when Replay data is " +
      "available, use Replay Hand Viewer to examine how its " +
      "structure changed throughout play."
  },

  {
    term: "Replay",
    definition:
      "The process of reviewing a previously saved Mahjong hand, " +
      "one recorded step at a time, to observe how the hand " +
      "developed throughout play."
  },
  {
    term: "Replay Hand Viewer",
    definition:
      "An MJC feature that lets you revisit a saved hand and " +
      "observe its structure at each recorded step. Use Previous " +
      "and Next to examine changes to Complete Boxes, Developing " +
      "Boxes, and Reserves. Available for hands saved with Replay data."
  },


  {
    term: "New Hand",
    definition:
      "Clears the current hand and returns you to starting tile " +
      "entry. Save the current hand first if you want to keep " +
      "its transcript."
  },  
  {
    term: "NEWS",
    definition:
      "North, East, West, and South. A special four-tile " +
      "combination containing one of each Wind tile. In " +
      "JEZEMS-style Filipino Mahjong, NEWS is recognized " +
      "as a special meld that may be Hidden or Exposed. " +
      "NEWS is not recognized in Taiwanese or Chinese " +
      "Mahjong rulesets."
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
      "A Chow normally has two sources: your draw and the player " +
      "to your left. A Pong has four: your draw and any of the " +
      "other players. If the tile completes your winning hand, " +
      "a Chow may also have four sources, where your rules allow " +
      "a winning claim from any opponent."
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
  },
  {
    term: "Rack",
    definition:
      "A holder placed on the table in front of a player to keep " +
      "their tiles upright, organized, and concealed from other players."
  },
  {
    term: "Chars",
    definition:
      "Short for Characters. One of the three numbered Mahjong suits. " +
      "Character tiles are numbered 1 through 9."
  },
  {
    term: "Bams",
    definition:
      "Short for Bamboo. One of the three numbered Mahjong suits. " +
      "Bamboo tiles are numbered 1 through 9."
  },
  {
    term: "Dots",
    definition:
      "Also called Circles. One of the three numbered Mahjong suits. " +
      "Dot tiles are numbered 1 through 9."
  },
  {
    term: "Honors",
    definition:
      "The Mahjong tiles consisting of Winds and Dragons. " +
      "Unlike numbered suit tiles, Honor tiles cannot form Chows."
  },
  {
    term: "Dragons",
    definition:
      "A group of Honor tiles consisting of Red Dragon, " +
      "Green Dragon, and White Dragon."
  },
  {
    term: "Winds",
    definition:
      "A group of Honor tiles consisting of East, South, West, and North."
  }



];

function openGlossaryDialog() {
  closeDialog("about6BTDialog");
  showGlossaryIndex();
  openDialog("glossaryDialog");
}


function showGlossaryIndex() {
  const content = document.getElementById("glossaryContent");
  document.getElementById("glossaryAlphabet").style.display = "grid";
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
    "New Game": "New Hand",
    "Contribution": "Principle of Contribution"
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

function jumpGlossaryToLetter(letter) {
  const content = document.getElementById("glossaryContent");

  const hasMatch = mjcGlossaryEntries.some(function(entry) {
    return entry.term.toUpperCase().startsWith(letter) ||
      (entry.abbreviation || "").toUpperCase().startsWith(letter);
  });

  if (!hasMatch) return;

  showGlossaryIndex();

  const links = Array.from(
    content.querySelectorAll("button.six-box-link")
  );

  const target = links.find(function(button) {
    return button.textContent.trim()
      .toUpperCase().startsWith(letter);
  });

  if (!target) return;

  content.scrollTop +=
    target.getBoundingClientRect().top -
    content.getBoundingClientRect().top;
}


function showGlossaryEntry(index) {
  const entry = mjcGlossaryEntries[index];
  if (!entry) return;

  const content = document.getElementById("glossaryContent");
  document.getElementById("glossaryAlphabet").style.display = "none";
  content.replaceChildren();


  const heading = document.createElement("h3");
    heading.textContent = entry.abbreviation
    ? entry.term + " (" + entry.abbreviation + ")"
    : entry.term;
  content.appendChild(heading);

  const definition = document.createElement("p");
  definition.textContent = entry.definition;
  content.appendChild(definition);
  appendGlossaryChiclets(content, entry.term);

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
    "Principle of Contribution",
    "Organized",
    "Box",
    "Complete Box",
    "Developing Box",
    "Reserve",
    "Groupings"
  ],
    "Understanding Pathways": [
    "Pathways",
    "Target Tiles",
    "Target Tiles Panel",
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
    "Terminality",
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
    "Transcript",
    "Replay",
    "Replay Hand Viewer"
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
  document.getElementById("glossaryAlphabet").style.display = "none";
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
    appendGlossaryChiclets(content, entry.term);
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
        "The boxes shown below are what you have before the incoming tile is added.";
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
        ],
        [
          "meldTerminality",
          "With all earlier comparisons tied, MJC uses Terminality: it favors completing the meld closer to the terminals, 1 or 9."
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

      const isWinning = isMMRWinningResult(
        evaluateMMRCandidate(
          MJC_STATE.getEngineInput(),
          mmrState.tileKey,
          candidate
        )
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
            isWinning
        ? '<span class="mmr-recommended">' +
            'MJC: Recommended — For the win!' +
          '</span>'
        : isRecommended
          ? '<span class="mmr-recommended">' +
              'MJC: Recommended' +
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
                                    ? "Saved Hands: " + games.length + ". MJC keeps your 80 most recent hands."
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
            const moveCount = (game.actions || []).filter(
        action =>
          ["D", "Di", "C", "P", "K"].includes(action.type)
      ).length;

      const row = document.createElement("p");
      row.textContent =
        (index + 1) + ". " +
        new Date(game.savedAt).toLocaleString() +
        " — " + game.status +
        " — " + moveCount +
                (moveCount === 1 ? "\u00A0move" : "\u00A0moves");
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
    shareButton.id = "handTranscriptShareButton";
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
    const replayButton = document.createElement("button");
    replayButton.className = "dialog-button";
    replayButton.textContent = "Replay Hand";

    const hasReplay =
      Array.isArray(game.replaySteps) &&
      game.replaySteps.length > 0;

    replayButton.disabled = !hasReplay;

    replayButton.onclick = function() {
      if (!hasReplay) return;

      content.replaceChildren();

      const replayHeader = document.createElement("div");
      replayHeader.id = "replayStickyHeader";
      replayHeader.style.position = "sticky";
      replayHeader.style.top = "0";
      replayHeader.style.zIndex = "10";
      replayHeader.style.background = "#ffffff";
      replayHeader.style.padding = "8px 0 10px";
      replayHeader.style.borderBottom = "1px solid #dddddd";

                  const dialogTitle = document.querySelector(
        "#gameHistoryDialog h2"
      );
      dialogTitle.textContent = "Replay Hand";
      const handDetails = document.createElement("p");
      handDetails.style.margin = "0 0 6px";
      handDetails.style.fontSize = "0.85em";
      handDetails.style.color = "#555";
      handDetails.textContent =
        "Hand " + (index + 1) + " — " +
        new Date(game.savedAt).toLocaleString();
      replayHeader.appendChild(handDetails);


      let replayIndex = 0;

      const stepCounter = document.createElement("p");
      stepCounter.style.margin = "4px 0";
      replayHeader.appendChild(stepCounter);

      const actionLabel = document.createElement("h4");
      actionLabel.style.margin = "8px 0 0";
            const actionRow = document.createElement("div");
 
      actionRow.style.display = "flex";
      actionRow.style.flexDirection = "column";
      actionRow.style.alignItems = "flex-start";
      actionRow.style.gap = "4px";
      actionRow.style.marginTop = "8px";

      actionLabel.style.margin = "0";
      actionRow.appendChild(actionLabel);
      replayHeader.appendChild(actionRow);
      const resultLabel = document.createElement("p");
      resultLabel.style.margin = "0";
      resultLabel.style.fontWeight = "bold";
      resultLabel.hidden = true;
      actionRow.appendChild(resultLabel);

      content.appendChild(replayHeader);

      const viewer = document.createElement("div");
      viewer.id = "replayHandViewer";

      const navigation = document.createElement("div");
      navigation.style.display = "flex";
      navigation.style.justifyContent = "center";
      navigation.style.gap = "12px";
      navigation.style.margin = "16px 0";

      const previousButton = document.createElement("button");
      previousButton.className = "dialog-button";
      previousButton.textContent = "Previous";

      const nextButton = document.createElement("button");
      nextButton.className = "dialog-button";
      nextButton.textContent = "Next";

            navigation.append(previousButton, nextButton);

      const dialogFooter = document.querySelector(
        "#gameHistoryDialog .dialog-actions"
      );

      dialogFooter.insertBefore(
        navigation,
        dialogFooter.firstChild
      );

      content.appendChild(viewer);

      function showReplayStep() {
        const step = game.replaySteps[replayIndex];

        stepCounter.textContent =
          "Step " + (replayIndex + 1) +
          " of " + game.replaySteps.length;

        if (step.type === "starting") {
          actionLabel.textContent = "Starting Hand";
        } else {
          const actionName =
            step.type.charAt(0).toUpperCase() +
            step.type.slice(1);

          const tileName = step.tileKey
            ? (tileLabels[step.tileKey] || step.tileKey)
            : "";

          actionLabel.textContent =
            actionName +
            (tileName ? " — " + tileName : "");
        }

               const highlightState = {
          tileKey: step.tileKey,
          destination: getReplayDrawDestination(
            step,
            game.replaySteps[replayIndex - 1]
          ),
          used: false
        };

        const destination = highlightState.destination;
        resultLabel.textContent = "";
        resultLabel.hidden = !destination;

        if (destination) {
          if (destination.section === "reserves") {
            resultLabel.textContent = "Result: Reserves";
          } else {
            const box = destination.box;
            const structure = step.structure;
            let boxNumber;
            let typeLabel;
            let prefix;

            if (destination.section === "complete") {
              const boxes = structure.completeBoxes || [];
              boxNumber =
                box.boxId || (boxes.indexOf(box) + 1);
              prefix = "CB";
              typeLabel =
                box.type.charAt(0).toUpperCase() +
                box.type.slice(1);
            } else {
              const boxes =
                (structure.developingBoxes || [])
                  .concat(structure.halfEye || []);

              boxNumber =
                (structure.completeBoxes || []).length +
                boxes.indexOf(box) + 1;
              prefix = "DB";
              typeLabel = box.type === "he"
                ? "HE"
                : getBoxTypeLabel(box.type);
            }

            resultLabel.textContent =
              "Result: " + typeLabel +
              " — " + prefix + boxNumber;
          }
        }

        viewer.innerHTML =
          renderReplayReserves(
            step.structure, highlightState
          ) +
          renderReplayDevelopingBoxes(
            step.structure, highlightState
          ) +
          renderReplayCompleteBoxes(
            step.structure, highlightState
          );

                previousButton.disabled = replayIndex === 0;

        nextButton.disabled =
          replayIndex === game.replaySteps.length - 1;

        previousButton.style.opacity =
          previousButton.disabled ? "0.35" : "1";

        nextButton.style.opacity =
          nextButton.disabled ? "0.35" : "1";

        previousButton.style.cursor =
          previousButton.disabled ? "not-allowed" : "pointer";

        nextButton.style.cursor =
          nextButton.disabled ? "not-allowed" : "pointer";

      }

      previousButton.onclick = function() {
        if (replayIndex === 0) return;
        replayIndex--;
        showReplayStep();
      };

      nextButton.onclick = function() {
        if (replayIndex >= game.replaySteps.length - 1) {
          return;
        }

        replayIndex++;
        showReplayStep();
      };

      showReplayStep();

      const closeButton = document.createElement("button");
      closeButton.className = "dialog-button";
      closeButton.textContent = "Back to Transcript";

      const dialogCloseButton =
        dialogFooter.querySelector(".dialog-button.primary");

      const originalFooterStyle =
        dialogFooter.getAttribute("style");

      dialogFooter.style.display = "flex";
      dialogFooter.style.flexDirection = "column";
      dialogFooter.style.alignItems = "center";
      dialogFooter.style.gap = "12px";

      navigation.style.margin = "0";
      dialogFooter.insertBefore(
        closeButton,
        dialogCloseButton
      );

            function cleanupReplayFooter() {
        dialogTitle.textContent = "Hand History";
        navigation.remove();
        closeButton.remove();

        if (originalFooterStyle === null) {
          dialogFooter.removeAttribute("style");
        } else {
          dialogFooter.setAttribute(
            "style",
            originalFooterStyle
          );
        }

        dialogCloseButton.removeEventListener(
          "click",
          cleanupReplayFooter
        );
      }

      closeButton.onclick = function() {
        cleanupReplayFooter();
        viewSavedGameTranscript(index);
      };

      dialogCloseButton.addEventListener(
        "click",
        cleanupReplayFooter
      );

    };

    transcriptButtons.appendChild(replayButton);

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
      const shareButton = document.getElementById(
        "handTranscriptShareButton"
      );

      if (shareButton) {
        shareButton.hidden = true;
      }

      function closeShareForm() {
        form.remove();

        if (shareButton) {
          shareButton.hidden = false;
        }
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
        closeShareForm();
      };
      form.appendChild(cancel);

      form.onsubmit = function(event) {
        event.preventDefault();

        const name = input.value.trim();
        if (!name) {
          showToast("Enter a name or nickname before sharing.");
          return;
        }

                closeShareForm();
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

function appendGlossaryChiclets(content, term) {
  const examples = {
    "Chow": [
      ["Example Chow", "char1 char2 char3"]
    ],
    "Pong": [
      ["Example Pong", "red red red"]
    ],
    "Kang": [
      ["Example Kang", "dot7 dot7 dot7 dot7"]
    ],
    "Eye": [
      ["Example Eye", "red red"]
    ],
    "Eye Candidate": [
      ["Example pair considered for the Eye", "red red"]
    ],
    "Eye-Pong Candidate": [
      ["A pair with Eye and Pong possibilities", "red red"]
    ],
    "Chow Candidate": [
      ["Example: needs 3 or 6 Bam", "bam4 bam5"]
    ],
    "Chow-Pong Candidate": [
      ["Example: Chow and Pong possibilities", "char2 char2 char3"]
    ],
    "Double-Sided Wait": [
      ["Example: needs 3 or 6 Bam", "bam4 bam5"]
    ],
    "Middle Wait": [
      ["Example: needs 5 Dot", "dot4 dot6"]
    ],
    "Edge Wait": [
      ["Needs 3 Char", "char1 char2"],
      ["Needs 7 Char", "char8 char9"]
    ]
  };

  const rows = examples[term];
  if (!rows) return;

  const illustration = document.createElement("div");
  illustration.style.cssText =
    "background:#f0f4f8; border-radius:10px;" +
    "padding:12px; margin:12px 0 20px;";

  rows.forEach(function(row, index) {
    const label = document.createElement("p");
    label.textContent = row[0];
    label.style.margin = index === 0 ? "0 0 8px" : "16px 0 8px";
    illustration.appendChild(label);

    const tiles = document.createElement("div");
    tiles.className = "chiclet-tiles";
    tiles.dataset.chiclets = row[1];
    illustration.appendChild(tiles);
  });

  content.appendChild(illustration);
  renderChiclets(illustration);
}