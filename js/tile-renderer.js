/*
=====================================================
 Mahjong Coach (MJC)
 Tile Renderer
 Version: 6BT v3.0
=====================================================

Responsibilities
----------------
Render Mahjong tiles for Coaching View.

This module is the only module that knows:
- where tile assets are stored
- how graphical tiles are rendered
- tile image paths
- future tile rendering enhancements

Public Interface
----------------
renderCoachTile(tileKey)

*/

function getTileImagePath(tileKey) {
  if (tileKey.startsWith("dot")) {
    const number = tileKey.replace("dot", "");
    return "assets/tiles-next/dot/" + number + "dot.svg";
  }

  if (tileKey.startsWith("bam")) {
    const number = tileKey.replace("bam", "");
    return "assets/tiles-next/bam/" + number + "bam.svg";
  }

  if (tileKey.startsWith("char")) {
    const number = tileKey.replace("char", "");
    return "assets/tiles-next/char/" + number + "char.svg";
  }

  return "assets/tiles-next/honor/" + tileKey + ".svg";
}

function renderCoachTile(tileKey, options = {}) {
  const extraClass = options.extraClass || "";

  const indexMap = {
    dot1: "1", dot2: "2", dot3: "3", dot4: "4", dot5: "5",
    dot6: "6", dot7: "7", dot8: "8", dot9: "9",

    bam1: "1", bam2: "2", bam3: "3", bam4: "4", bam5: "5",
    bam6: "6", bam7: "7", bam8: "8", bam9: "9",

    char1: "1", char2: "2", char3: "3", char4: "4", char5: "5",
    char6: "6", char7: "7", char8: "8", char9: "9",

    east: "E",
    south: "S",
    west: "W",
    north: "N",
    red: "C",
    green: "F",
    white: "B"
  };

  const tileIndex =
  window.showTileIndices !== false
    ? (indexMap[tileKey] || "")
    : "";

  return (
    '<span class="coach-tile' +
      (extraClass ? " " + extraClass : "") +
    '">' +

      '<img class="coach-tile-image" ' +
        'src="' + getTileImagePath(tileKey) + '" ' +
        'alt="' + (tileLabels[tileKey] || tileKey) + '">' +

      (
        tileIndex
          ? '<span class="coach-tile-index">' + tileIndex + '</span>'
          : ''
      ) +

    '</span>'
  );
}
