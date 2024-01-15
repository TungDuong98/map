import { useEffect } from "react";
import Feature from "ol/Feature";
import LineString from "ol/geom/LineString";
import { fromLonLat } from "ol/proj";

function useDrawRoute(
  currentTime,
  setCurrentTime,
  travelersData,
  routeFeatures,
  pathSource,
  getRoute
) {
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    for (let id in routeFeatures.current) {
      if (!travelersData.find((traveler) => traveler.id.toString() === id)) {
        pathSource.removeFeature(routeFeatures.current[id]);
        routeFeatures.current[id] = null;
      }
    }
  }, [travelersData]);

  useEffect(() => {
    travelersData.forEach((traveler) => {
      if (currentTime > traveler.endTime) {
        if (routeFeatures.current[traveler.id]) {
          pathSource.removeFeature(routeFeatures.current[traveler.id]);
          routeFeatures.current[traveler.id] = null;
        }
      } else {
        const drawRoute = async () => {
          const route = await getRoute(traveler.origin, traveler.destination);
          if (!route) {
            console.error("Could not fetch route");
            return;
          }

          if (!routeFeatures.current[traveler.id]) {
            const routeGeom = new LineString(
              route.map((coord) => fromLonLat(coord))
            );
            const routeFeature = new Feature(routeGeom);
            routeFeatures.current[traveler.id] = routeFeature;
            pathSource.addFeature(routeFeature);
          }
        };

        drawRoute();
      }
    });
  }, [currentTime, getRoute, travelersData]);
}

export default useDrawRoute;
