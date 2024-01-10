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
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import Icon from "ol/style/Icon";
import Style from "ol/style/Style";
import { useEffect, useRef, useState } from "react";

import lau_dai from "./images/lau_dai.webp";
import quai_vat from "./images/quai_vat.jpg";
import quan_doi from "./images/quan_doi.jpg";

const api_key = "5b3ce3597851110001cf6248f2271b43c5d9489b88ff35df22f86d9f";
const ORIGIN_LOCATION = [105.8389327, 21.0040616];

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
const [origin, setOrigin] = useState(ORIGIN_LOCATION);
const [currentPathLayer, setCurrentPathLayer] = useState(null);
const [currentLocation, setCurrentLocation] = useState(origin);

const isMoving = useRef(false);
const mapDivRef = useRef(); // Sử dụng để tham chiếu đến phần tử DOM
const olMapRef = useRef(); // Sử dụng để tham chiếu đến đối tượng Map
const randomPointLayerRef = useRef(); // Sử dụng để tham chiếu đến randomPointLayer

useEffect(() => {
console.log("currentLocation", currentLocation); // log giá trị hiện tại của currentLocation
}, [currentLocation]);

// Khởi tạo travelerFeature trước useEffect hooks.
const travelerFeature = useRef(
new Feature({
geometry: new Point(fromLonLat(origin)),
})
);
travelerFeature.current.setStyle(travelerStyle);

// Hook để cập nhật vị trí của travelerFeature.
useEffect(() => {
travelerFeature.current.setGeometry(new Point(fromLonLat(currentLocation)));
}, [currentLocation]);

useEffect(() => {
if (randomPointLayerRef.current) {
olMapRef.current.removeLayer(randomPointLayerRef.current);
}

    const randomPoints = Array.from({ length: 10 }, () =>
      getRandomPoint(currentLocation, 2000)
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

    olMapRef.current = new Map({
      target: mapDivRef.current,
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

    randomPointLayerRef.current = randomPointLayer; // Lưu randomPointLayer

    const originFeature = new Feature({
      geometry: new Point(fromLonLat(origin)),
    });

    originFeature.setStyle(startPointStyle);

    const originLayer = new VectorLayer({
      source: new VectorSource({
        features: [originFeature],
      }),
    });

    // Add originLayer to the map
    olMapRef.current.addLayer(originLayer);

    const travelerLayer = new VectorLayer({
      source: new VectorSource({
        features: [travelerFeature.current],
      }),
    });
    travelerFeature.current.setStyle(travelerStyle);

    // Add travelerLayer to the map
    olMapRef.current.addLayer(travelerLayer);

    olMapRef.current.on("click", ({ pixel }) => {
      olMapRef.current.forEachFeatureAtPixel(pixel, (feature, layer) => {
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
            olMapRef.current.addView(
              new VectorLayer({
                source: new VectorSource({
                  features: [destinationFeature],
                }),
              })
            );

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

                if (currentPathLayer) {
                  // Kiểm tra xem currentPathLayer có tồn tại trước khi gọi removeLayer
                  olMapRef.current.removeLayer(currentPathLayer);
                  setCurrentPathLayer(null);
                }

                const path = response.data.features[0].geometry.coordinates;

                //Create currentPathLayer here after path is defined
                const newCurrentPathLayer = new VectorLayer({
                  source: new VectorSource({
                    features: [
                      new Feature(
                        new LineString(path.map((coord) => fromLonLat(coord)))
                      ),
                    ],
                  }),
                });

                setCurrentPathLayer(newCurrentPathLayer);
                olMapRef.current.addLayer(newCurrentPathLayer);

                const line = turf.lineString(path);
                const travelTime = 0.0025 * 60 * 60;

                const moveTraveler = () => {
                  const elapsedTime = Date.now() / 1000 - startTime;
                  const progress = elapsedTime / travelTime;
                  const distance = turf.length(line) * progress;
                  const newLocation = turf.along(line, distance);

                  // Update location
                  if (
                    newLocation &&
                    newLocation.geometry &&
                    newLocation.geometry.coordinates
                  ) {
                    const coord = newLocation.geometry.coordinates;
                    setCurrentLocation(coord);
                  }

                  if (progress < 1) {
                    requestAnimationFrame(moveTraveler);
                  } else {
                    console.log("Đã đến đích!");
                    isMoving.current = false;

                    // Xóa đường đi trên bản đồ
                    if (currentPathLayer) {
                      olMapRef.current.removeLayer(currentPathLayer);
                      setCurrentPathLayer(null);
                    }

                    // Cập nhật vị trí sau khi đã đi đến một điểm
                    setOrigin(destination);
                  }
                };

                requestAnimationFrame(moveTraveler);
              });
          }
        }
      });
    });

}, [isMoving, currentLocation]);

return (
<div>
<div ref={mapDivRef} style={{ width: "100%", height: "100vh" }} />
<div>
Vị trí hiện tại của traveler: Kinh độ: {currentLocation[0]}, Vĩ độ:{" "}
{currentLocation[1]}
</div>
</div>
);
}

export default MapComponent;
