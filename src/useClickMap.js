/* eslint-disable default-case */
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect } from "react";

function useClickMap(map, setShowPointModal) {
  useEffect(() => {
    map.current.on("singleclick", function (event) {
      map.current.forEachFeatureAtPixel(event.pixel, function (feature) {
        if (feature.getProperties().isClickable) {
          setShowPointModal(true);
        }
      });
    });
  }, []);
}
export default useClickMap;
