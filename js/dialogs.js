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
    ? "Sagasa Available"
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

if ( specialMeldType === "kang" ||
  specialMeldType === "news") {
  const detectedTile =
    mmrState.candidates[0].tiles[0];

  const detectedMessage =
    document.createElement("div");

  detectedMessage.textContent =
  specialMeldType === "kang"
    ? (
        tileLabels[detectedTile] ||
        detectedTile
      )
    : mmrState.candidates[0].tiles
        .map(function(tileKey) {
          return (
            tileLabels[tileKey] ||
            tileKey
          );
        })
        .join(" · ");

  detectedMessage.style.fontWeight = "bold";
  detectedMessage.style.fontSize = "18px";
  detectedMessage.style.textAlign = "center";
  detectedMessage.style.marginBottom = "14px";

  optionsContainer.appendChild(
    detectedMessage
  );
}

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
  isSingleSpecialMeld
    ? getDeclarationPrimaryLabel(
        specialMeldType,
        mmrState.action
      )
    : (
        candidate.type.toUpperCase() +
        ": " +
        candidate.tiles.join(", ") +
        (
          isRecommended
            ? " — MJC Recommended"
            : ""
        )
      );


    button.onclick = function() {
      selectMMRCandidate(index);
    };

    optionsContainer.appendChild(button);
  });

if (
  specialMeldType === "kang" ||
  specialMeldType === "news"
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


   if (specialMeldType !== "news") {
  const ignoreButton =
    document.createElement("button");

  ignoreButton.className =
    "dialog-button secondary";

  ignoreButton.style.display = "block";
  ignoreButton.style.width = "100%";
  ignoreButton.style.marginTop = "6px";

  ignoreButton.textContent =
  mmrState.action === "sagasa-after-draw"
    ? "Ignore Sagasa"
    : (
        specialMeldType === "kang"
          ? "Ignore Kang"
          : "Ignore Melds"
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

  if (
  mmrState.action !== "hidden-kang-after-draw" &&
  mmrState.action !== "hidden-news-after-draw"
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

if (mmrState.action === "hidden-kang-after-draw") {

 const ignoredTileKey =
    mmrState.candidates &&
    mmrState.candidates[0] &&
    mmrState.candidates[0].tiles
      ? mmrState.candidates[0].tiles[0]
      : mmrState.tileKey;

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
      "Coaching has been suspended while you pursue<br>" +
      "Siete Pares (Seven Pairs).";
  } else {
    title.textContent = "Seven Pairs Selected";

    message.innerHTML =
      "Coaching has been suspended while you pursue<br>" +
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
}

function continueSevenPairs() {
  sevenPairsMode = true;

  document
    .getElementById("sevenPairsStatusDialog")
    .classList.add("hidden");
}

function endSevenPairs() {
  sevenPairsMode = false;

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

  document
    .getElementById("overPairedDialog")
    .classList.add("hidden");

  document
    .getElementById("overPairedAdviceDialog")
    .classList.remove("hidden");
}

function closeOverPairedAdviceDialog() {
  document
    .getElementById("overPairedAdviceDialog")
    .classList.add("hidden");
}
