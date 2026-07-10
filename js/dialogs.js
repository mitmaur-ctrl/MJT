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

function saveRulesDialog() {
  const selected = document.querySelector(
    'input[name="rulesetRadio"]:checked'
  );

  if (selected && selected.value === "taiwan16") {
    setRuleset("taiwan16");
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