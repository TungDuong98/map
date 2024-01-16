import Icon from "ol/style/Icon";
import Style from "ol/style/Style";

import castle_lv1 from "./images/castle_lv1.png";
import stone_quarry from "./images/stone_quarry.png";
import { Overlay } from "ol";
import { fromLonLat } from "ol/proj";

export function updateIconSize(zoom, originFeatureRef, randomFeatureRefs) {
  const iconOverLay = document.getElementsByClassName("icon-overlay");

  if (zoom >= 17) {
    for (let i = 0; i < iconOverLay.length; i++) {
      iconOverLay[i].style.marginBottom = "150px";
    }
  } else {
    for (let i = 0; i < iconOverLay.length; i++) {
      iconOverLay[i].style.marginBottom = "100px";
    }
  }

  // origin
  const newIconSizeOrigin =
    zoom >= 17 ? { width: 300, height: 300 } : { width: 200, height: 200 };

  const newStyle = new Style({
    image: new Icon({
      src: castle_lv1,
      ...newIconSizeOrigin,
    }),
  });
  originFeatureRef.current.setStyle(newStyle);

  // random points
  const newIconSizeRandomPoints =
    zoom >= 17 ? { width: 150, height: 150 } : { width: 80, height: 80 };

  const newStyleRandom = new Style({
    image: new Icon({
      src: stone_quarry,
      ...newIconSizeRandomPoints,
    }),
  });
  randomFeatureRefs.current.forEach((feature) =>
    feature.setStyle(newStyleRandom)
  );
}

function createOverlay(lon, lat, imageUrl, map, pointOverlays) {
  const iconElement = document.createElement("div");
  iconElement.classList.add("icon-overlay"); // Add CSS class to the div
  iconElement.innerHTML = `<img src="${imageUrl}" style="width: 40px; height: 40px" />`;

  const iconOverlay = new Overlay({
    element: iconElement,
    position: fromLonLat([lon, lat]),
    positioning: "center-center", // Change this line
  });

  map.current.addOverlay(iconOverlay);

  pointOverlays.current[`${lon}_${lat}`] = iconOverlay;
}

// insert icon
export function addIconToRandomPointHasWork(
  indexRandomPoints,
  imageUrl,
  randomPoints,
  map,
  pointOverlays
) {
  for (let key in pointOverlays.current) {
    const overlay = pointOverlays.current[key];
    map.current.removeOverlay(overlay);
  }
  pointOverlays.current = {};

  for (let index of indexRandomPoints) {
    const coord = randomPoints[index];
    createOverlay(coord[0], coord[1], imageUrl, map, pointOverlays);
  }
}
