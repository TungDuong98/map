import \* as turf from "@turf/turf";
import axios from "axios";
import Feature from "ol/Feature";
import Map from "ol/Map";
import View from "ol/View";
import LineString from "ol/geom/LineString";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat, transform } from "ol/proj";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import OSM from "ol/source/OSM";
import React, { useEffect, useRef } from "react";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";

import lau_dai from "./images/lau_dai.webp";
import quai_vat from "./images/quai_vat.jpg";
import quan_doi from "./images/quan_doi.jpg";

const api_key = "5b3ce3597851110001cf6248f2271b43c5d9489b88ff35df22f86d9f";
const startTime = Date.now() / 1000; // Gán startTime là thời điểm hiện tại
const origin = [105.8389327, 21.0040616];
const destination = [105.8022025, 21.0026629];

// map box setup
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

function MapComponent() {
const mapRef = useRef();

useEffect(() => {
const map = new Map({
target: mapRef.current,
layers: [
new TileLayer({
source: new XYZ({
url: `${mapStyle}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
}),
// source: new OSM(),
}),
],
view: new View({
center: fromLonLat(origin),
zoom: 14,
minZoom: 14,
maxZoom: 14,
}),
});

    // map.on("click", (event) => {
    //   // Mọi event đều được truyền vào tọa độ của bản đồ,
    //   const clickedCoord = event.coordinate;

    //   // Chúng ta có thể chuyển đổi tọa độ này từ Mercator sang Kinh Độ Vĩ Độ
    //   const lonLat = transform(clickedCoord, "EPSG:3857", "EPSG:4326");

    //   // Và sau đó, log ra console
    //   console.log(`Clicked at position: Lon: ${lonLat[0]}, Lat: ${lonLat[1]}`);
    // });

    map.on("click", (event) => {
      map.forEachFeatureAtPixel(event.pixel, (feature) => {
        console.log(feature.get("data")); // hoặc thông tin khác bạn đã đặt cho feature
      });
    });

    const originFeature = new Feature({
      geometry: new Point(fromLonLat(origin)),
    });
    originFeature.setStyle(startPointStyle);

    const destinationFeature = new Feature({
      geometry: new Point(fromLonLat(destination)),
    });
    destinationFeature.setStyle(endPointStyle);

    originFeature.set("name", "Origin Point");
    originFeature.set("data", { name: "Origin Point", test: "test" });
    destinationFeature.set("name", "Destination Point");
    destinationFeature.set("data", { name: "Destination Point", test: "test" });

    const originLayer = new VectorLayer({
      source: new VectorSource({
        features: [originFeature],
      }),
    });

    const destinationLayer = new VectorLayer({
      source: new VectorSource({
        features: [destinationFeature],
      }),
    });

    map.addLayer(originLayer);
    map.addLayer(destinationLayer);

    axios
      .get("https://api.openrouteservice.org/v2/directions/driving-car", {
        params: {
          api_key,
          start: origin.join(","),
          end: destination.join(","),
        },
      })
      .then((response) => {
        let path = [];
        if (response.data.features[0]) {
          path = response.data.features[0].geometry.coordinates;
        }

        if (path.length === 0) {
          console.error("Path is empty, cannot create lineString");
          return;
        }

        new VectorLayer({
          source: new VectorSource({
            features: [
              new Feature(
                new LineString(path.map((coord) => fromLonLat(coord)))
              ),
            ],
          }),
          map: map,
        });

        const line = turf.lineString(path); // Sử dụng path nguyên bản

        const travelerFeature = new Feature({
          geometry: new Point(fromLonLat(origin)),
        });
        travelerFeature.setStyle(travelerStyle);

        const travelerLayer = new VectorLayer({
          map,
          source: new VectorSource({
            features: [travelerFeature],
          }),
        });

        const travelTime = 0.01 * 60 * 60;

        const moveTraveler = () => {
          const currentTime = Date.now() / 1000;
          const elapsedTime = currentTime - startTime;
          const progress = Math.min(elapsedTime / travelTime, 1);

          const distance = turf.length(line) * progress;
          const currentLocation = turf.along(line, distance);

          if (
            !currentLocation ||
            !currentLocation.geometry ||
            !currentLocation.geometry.coordinates
          ) {
            console.error("Current location coordinates not available");
            return;
          }

          const currentCoord = currentLocation.geometry.coordinates;
          travelerFeature.setGeometry(new Point(fromLonLat(currentCoord)));

          if (progress < 1) {
            requestAnimationFrame(moveTraveler);
          } else {
            console.log("Đã đến đích!"); // Ghi nhận sự kiện đạt đến điểm đích
          }
        };

        requestAnimationFrame(moveTraveler);
      });

}, []);

return <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />;
}

export default MapComponent;
