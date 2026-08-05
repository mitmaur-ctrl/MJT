/*
=====================================================
 Mahjong Coach (MJC)
 Tile Renderer
 Version: 6BT v2.0
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
  if (tileKey.startsWith("char")) {
    return "assets/tiles/char/" + tileKey + ".PNG";
  }

  if (tileKey.startsWith("bam")) {
    return "assets/tiles/bam/" + tileKey + ".PNG";
  }

  if (tileKey.startsWith("dot")) {
    return "assets/tiles/dot/" + tileKey + ".PNG";
  }

  return "assets/tiles/honor/" + tileKey + ".PNG";
}

function renderCoachTile(tileKey, options = {}) {
  const extraClass = options.extraClass || "";

  return (
    '<span class="coach-tile' +
      (extraClass ? " " + extraClass : "") +
    '">' +
      '<img class="coach-tile-image" ' +
      'src="' + getTileImagePath(tileKey) + '" ' +
      'alt="' + (tileLabels[tileKey] || tileKey) + '">' +
    '</span>'
  );
}
