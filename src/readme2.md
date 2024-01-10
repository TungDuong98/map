/_ eslint-disable no-undef _/
/_ eslint-disable react-hooks/exhaustive-deps _/
import \* as turf from "@turf/turf";
import axios from "axios";
import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import Icon from "ol/style/Icon";
import Style from "ol/style/Style";
import { useEffect, useRef, useState } from "react";

import lau_dai from "./images/lau_dai.webp";
import quai_vat from "./images/quai_vat.jpg";
import quan_doi from "./images/quan_doi.jpg";

const api_key = "5b3ce3597851110001cf6248f2271b43c5d9489b88ff35df22f86d9f";
let origin = [105.8389327, 21.0040616];

const mapboxToken =
"pk.eyJ1IjoiZHVvbmcyMzIxOTk4IiwiYSI6ImNscXowNzVhdDAwODgybnFtYWxhbDJzOHcifQ.HYN07AcSfEZVLeVQc6cz3g";
const mapStyle =
"https://api.mapbox.com/styles/v1/duong2321998/clqz0c9ey00eo01pz2saa0id6";

const startPointStyle = new Style({
image: new Icon({
src: lau_dai,
width: 46.7,
height: 24.5,
}),
});

const endPointStyle = new Style({
image: new Icon({
src: quai_vat,
width: 46.7,
height: 29.6,
}),
});

const travelerStyle = new Style({
image: new Icon({
src: quan_doi,
width: 46.7,
height: 31,
}),
});

const getRandomPoint = (center, radius) => {
var y0 = center[1];
var x0 = center[0];

var rd = radius / 111300;

var u = Math.random();
var v = Math.random();

var w = rd _ Math.sqrt(u);
var t = 2 _ Math.PI _ v;
var x = w _ Math.cos(t);
var y = w \* Math.sin(t);

var xp = x / Math.cos(y0);

return [xp + x0, y + y0];
};

function MapComponent() {
const [currentLocation, setCurrentLocation] = useState(origin);
const isMoving = useRef(false);

// tao ra 1 tham chieu layer de ve duong di
let currentPathLayer = null;

useEffect(() => {
console.log("currentLocation", currentLocation); // log giá trị hiện tại của currentLocation
}, [currentLocation]);

const mapRef = useRef();

useEffect(() => {
const randomPoints = Array.from({ length: 10 }, () =>
getRandomPoint(origin, 2000)
);

    const features = randomPoints.map((coord) => {
      const feature = new Feature(new Point(fromLonLat(coord)));
      feature.setStyle(endPointStyle);
      feature.setProperties({ isClickable: true, coord });
      return feature;
    });

    const randomPointLayer = new VectorLayer({
      source: new VectorSource({
        features: features,
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: `${mapStyle}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
          }),
        }),
        randomPointLayer,
      ],
      view: new View({
        center: fromLonLat(origin),
        zoom: 14,
        minZoom: 14,
        maxZoom: 14,
      }),
    });

    const originFeature = new Feature({
      geometry: new Point(fromLonLat(origin)),
    });
    originFeature.setStyle(startPointStyle);
    new VectorLayer({
      map,
      source: new VectorSource({
        features: [originFeature],
      }),
    });

    const travelerFeature = new Feature({
      geometry: new Point(fromLonLat(origin)),
    });
    travelerFeature.setStyle(travelerStyle);
    new VectorLayer({
      map,
      source: new VectorSource({
        features: [travelerFeature],
      }),
    });

    map.on("click", ({ pixel }) => {
      map.forEachFeatureAtPixel(pixel, (feature, layer) => {
        if (feature.get("isClickable") && !isMoving.current) {
          isMoving.current = true;

          const destination = feature.get("coord");
          console.log("feature", feature);
          if (window.confirm("Bạn có muốn đi đến điểm này không?")) {
            const startTime = Date.now() / 1000;

            const newPosition = fromLonLat(destination);
            const destinationFeature = new Feature({
              geometry: new Point(newPosition),
            });
            destinationFeature.setStyle(endPointStyle);
            new VectorLayer({
              map,
              source: new VectorSource({
                features: [destinationFeature],
              }),
            });

            axios
              .get(
                "https://api.openrouteservice.org/v2/directions/driving-car",
                {
                  params: {
                    api_key,
                    start: origin.join(","),
                    end: destination.join(","),
                  },
                }
              )
              .then((response) => {
                if (!response.data.features[0]) {
                  console.error("Path is empty, cannot create lineString");
                  return;
                }
                const path = response.data.features[0].geometry.coordinates;

                //Create currentPathLayer here after path is defined
                currentPathLayer = new VectorLayer({
                  source: new VectorSource({
                    features: [
                      new Feature(
                        new LineString(path.map((coord) => fromLonLat(coord)))
                      ),
                    ],
                  }),
                });
                map.addLayer(currentPathLayer);

                const line = turf.lineString(path);
                const travelTime = 0.005 * 60 * 60;

                const moveTraveler = () => {
                  const elapsedTime = Date.now() / 1000 - startTime;
                  const progress = elapsedTime / travelTime;
                  const distance = turf.length(line) * progress;
                  const currentLocation = turf.along(line, distance);

                  // update vị trí hiện tại
                  if (
                    currentLocation &&
                    currentLocation.geometry &&
                    currentLocation.geometry.coordinates
                  ) {
                    const currentCoord = currentLocation.geometry.coordinates;
                    setCurrentLocation(currentCoord);
                  }

                  if (
                    !currentLocation ||
                    !currentLocation.geometry ||
                    !currentLocation.geometry.coordinates
                  ) {
                    console.error("Current location coordinates not available");
                    return;
                  }

                  const currentCoord = currentLocation.geometry.coordinates;
                  travelerFeature.setGeometry(
                    new Point(fromLonLat(currentCoord))
                  );

                  if (progress < 1) {
                    requestAnimationFrame(moveTraveler);
                  } else {
                    console.log("Đã đến đích!");
                    isMoving.current = false;
                    origin = destination;

                    // Xóa đường đi trên bản đồ
                    if (currentPathLayer) {
                      map.removeLayer(currentPathLayer);
                      currentPathLayer = null;
                    }
                  }
                };

                requestAnimationFrame(moveTraveler);
              });
          }
        }
      });
    });

}, [isMoving]);

return (

<div>
<div ref={mapRef} style={{ width: "100%", height: "100vh" }} />
<div>
Vị trí hiện tại của traveler: Kinh độ: {currentLocation[0]}, Vĩ độ:{" "}
{currentLocation[1]}
</div>
</div>
);
}

export default MapComponent;
