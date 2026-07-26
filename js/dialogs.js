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

function openMMRDialog() {
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

  const title =
      document.getElementById("mmrTitle");

    title.textContent =
  specialMeldType === "kang"
    ? "Kang Available"
    : (
        specialMeldType === "news"
          ? "NEWS Available"
          : "Multiple Melds Detected"
      );


  const optionsContainer =
    document.getElementById("mmrOptions");

  optionsContainer.innerHTML = "";

if (
  !isSingleSpecialMeld &&
  !mmrState.recommendedCandidate
) {
  const tieMessage =
    document.createElement("div");

  tieMessage.textContent =
    "MJC: Either choice is structurally sound.";

  tieMessage.style.marginBottom = "12px";

  optionsContainer.appendChild(
    tieMessage
  );
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
    mmrState.recommendedCandidate &&
    getCompleteBoxSignature(candidate) ===
      getCompleteBoxSignature(
        mmrState.recommendedCandidate
      );

   button.textContent =
    specialMeldType === "kang"
      ? "Declare Kang"
      : (
          specialMeldType === "news"
            ? "Declare NEWS"
            : (
                candidate.type.toUpperCase() +
                ": " +
                candidate.tiles.join(", ") +
                (
                  isRecommended
                    ? " — MJC Recommended"
                    : ""
                )
              )
        );


    button.onclick = function() {
      selectMMRCandidate(index);
    };

    optionsContainer.appendChild(button);
  });

   const ignoreButton =
     document.createElement("button");

   ignoreButton.className =
  "dialog-button secondary";

   ignoreButton.style.display = "block";
   ignoreButton.style.width = "100%";
   ignoreButton.style.marginTop = "6px";

   ignoreButton.textContent =
    specialMeldType === "kang"
      ? "Ignore Kang"
      : (
          specialMeldType === "news"
            ? "Ignore NEWS"
            : "Ignore Melds"
        );

   ignoreButton.onclick =
     ignoreMMRCandidates;

   optionsContainer.appendChild(
     ignoreButton
   );

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

function ignoreMMRCandidates() {
  if (!mmrState) {
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
