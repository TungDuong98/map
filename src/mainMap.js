/* eslint-disable default-case */
/* eslint-disable react-hooks/exhaustive-deps */

import * as turf from "@turf/turf";
import Feature from "ol/Feature";
import Map from "ol/Map";
import Overlay from "ol/Overlay";
import View from "ol/View";
import Point from "ol/geom/Point";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import Icon from "ol/style/Icon";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import { useEffect, useRef, useState } from "react";
import getRoute from "./route.js";

import arrow_down from "./images/arrow_down.png";
import castle_lv1 from "./images/castle_lv1.png";
import stone_quarry from "./images/stone_quarry.png";
import traveler_gif from "./images/traveler.gif";

import Stroke from "ol/style/Stroke";
import { addIconToRandomPointHasWork, updateIconSize } from "./helper.js";
import useClickMap from "./useClickMap.js";
import useDrawRoute from "./useDrawRoute";

const api_key = "5b3ce3597851110001cf6248f2271b43c5d9489b88ff35df22f86d9f";
const api_google_key = "AIzaSyAkssZqD3mMFIaE8fiYNKHqWH949B9gxlc";
let origin = [105.8389327, 21.0040616];

const mapboxToken =
  "pk.eyJ1IjoiZHVvbmcyMzIxOTk4IiwiYSI6ImNscXowNzVhdDAwODgybnFtYWxhbDJzOHcifQ.HYN07AcSfEZVLeVQc6cz3g";

const mapStyle =
  "https://api.mapbox.com/styles/v1/duong2321998/clqz0c9ey00eo01pz2saa0id6";

let originPointStyle = new Style({
  image: new Icon({
    src: castle_lv1,
    width: 200,
    height: 200,
  }),
});

const randomPoints = [
  [105.85557097876611, 21.010123023018156],
  [105.8307598161608, 21.01949067718937],
  [105.84495192198916, 20.993695564462747],
  [105.8382869213779, 20.991998094765712],
  [105.82524662678202, 20.999492560165645],
  // [105.83717952677631, 21.00601960900288],
  [105.85009415185186, 20.99624421452242],
  [105.8245320385892, 21.01824879561772],
  [105.86524792487954, 21.001461298558112],
];

const travelersMockData = [
  // {
  //   id: 0,
  //   origin: origin,
  //   destination: randomPoints[0],
  //   startTime: 1705049705 * 1000,
  //   endTime: 1705052105 * 1000,
  // },
  // {
  //   id: 1,
  //   origin: origin,
  //   destination: randomPoints[2],
  //   startTime: 1705372055 * 1000,
  //   endTime: 1705372235 * 1000,
  // },
  // {
  //   id: 2,
  //   origin: origin,
  //   destination: randomPoints[3],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 7000,
  // },
  // {
  //   id: 3,
  //   origin: origin,
  //   destination: randomPoints[4],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 8000,
  // },
  // {
  //   id: 4,
  //   origin: origin,
  //   destination: randomPoints[5],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 8000,
  // },
  // {
  //   id: 5,
  //   origin: origin,
  //   destination: randomPoints[6],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 10000,
  // },
];

const pathSource = new VectorSource();

function MapComponent() {
  const [travelersData, setTravelersData] = useState(travelersMockData);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());
  const [showPointModal, setShowPointModal] = useState(false);

  const routeFeatures = useRef([]);
  const originFeatureRef = useRef(null);
  const randomFeatureRefs = useRef([]);
  const travelersMarkers = useRef({});
  const pointOverlays = useRef({}); // manage overlay of all points in map

  const featuresRandomPoints = randomPoints.map((coord, index) => {
    const feature = new Feature(new Point(fromLonLat(coord)));
    feature.setStyle(
      new Style({
        image: new Icon({
          src: stone_quarry,
          width: 80,
          height: 80,
        }),
        text: new Text({
          text: String(index + 1),
          scale: 1.2,
          offsetY: -25,
        }),
      })
    );
    feature.setProperties({ isClickable: true, coord });

    randomFeatureRefs.current.push(feature);

    return feature;
  });

  const randomPointLayer = new VectorLayer({
    source: new VectorSource({
      features: featuresRandomPoints,
    }),
  });

  const travelers = useRef(
    Array.from({ length: travelersMockData.length }, () => ({
      feature: null,
      destination: null,
      atOrigin: true,
      currentLocation: origin,
    }))
  );

  const map = useRef(null);

  const pathLayer = useRef(
    new VectorLayer({
      source: pathSource,
      style: new Style({
        stroke: new Stroke({
          color: "red",
          width: 2,
        }),
      }),
    })
  );

  const mapRef = useRef();

  const travelerSource = new VectorSource();

  useEffect(() => {
    originFeatureRef.current = new Feature({
      geometry: new Point(fromLonLat(origin)),
    });
    originFeatureRef.current.setStyle(originPointStyle);

    const originLayer = new VectorLayer({
      source: new VectorSource({
        features: [originFeatureRef.current],
      }),
    });

    if (!map.current) {
      map.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new XYZ({
              url: `${mapStyle}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
            }),
          }),
          originLayer,
          randomPointLayer,
        ],
        view: new View({
          center: fromLonLat(origin),
          zoom: 16,
          minZoom: 16,
          maxZoom: 18,
          constrainResolution: true,
          constrainRotation: true,
        }),
      });

      map.current.getView().on("propertychange", function (e) {
        switch (e.key) {
          case "resolution":
            let zoom = this.getZoom();

            updateIconSize(zoom, originFeatureRef, randomFeatureRefs);
            break;
        }
      });

      map.current.addLayer(pathLayer.current);
      addIconToRandomPointHasWork(
        [0, 1, 2],
        arrow_down,
        randomPoints,
        map,
        pointOverlays
      );
    }

    new VectorLayer({
      map: map.current,
      source: travelerSource,
    });

    travelersData.forEach((traveler, idx) => {
      if (!travelers.current[idx]) {
        travelers.current[idx] = {};
      }

      const gifElement = document.createElement("div");
      gifElement.innerHTML = `<img id="traveler-overlay" src="${traveler_gif}" alt='traveler_gif' style="width:50px;height:50px;">`;

      const travelerOverlay = new Overlay({
        element: gifElement,
        positioning: "center-center",
        stopEvent: false,
      });

      const travelerFeature = new Feature({
        geometry: new Point(fromLonLat(traveler.origin)),
      });

      travelerSource.addFeature(travelerFeature);

      map.current.addOverlay(travelerOverlay);
      travelerOverlay.setPosition(
        travelerFeature.getGeometry().getCoordinates()
      );

      const dest = fromLonLat([
        traveler.destination[0],
        traveler.destination[1],
      ]);
      const destinationFeature = new Feature({
        geometry: new Point(dest),
      });

      travelerSource.addFeature(destinationFeature);

      travelersMarkers.current["traveler-" + idx] = {
        travelerFeature,
        destinationFeature,
      };

      travelers.current[idx].overlay = travelerOverlay;
    });

    const moveTraveler = async (traveler, idx) => {
      const route = await getRoute(traveler.origin, traveler.destination);
      if (!route) {
        console.error("Could not fetch route");
        return;
      }

      const travelerFeature =
        travelersMarkers.current["traveler-" + idx].travelerFeature;
      const routeLineString = turf.lineString(route);
      const totalLength = turf.length(routeLineString, { units: "kilometers" });

      let currentProgress = 0;

      const animate = () => {
        const currentTime = new Date().getTime();
        if (currentProgress <= totalLength && currentTime <= traveler.endTime) {
          const ratio =
            (currentTime - traveler.startTime) /
            (traveler.endTime - traveler.startTime);
          currentProgress = totalLength * ratio;
          const newCoord = turf.along(routeLineString, currentProgress, {
            units: "kilometers",
          });
          const lngLatNew = newCoord.geometry.coordinates;
          travelerFeature.getGeometry().setCoordinates(fromLonLat(lngLatNew));

          if (travelers.current[idx] && travelers.current[idx].overlay) {
            travelers.current[idx].overlay.setPosition(fromLonLat(lngLatNew));
          }

          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    };

    travelersData.forEach((traveler, idx) => {
      moveTraveler(traveler, idx);
    });

    return () => {
      if (map.current) {
        map.current.setTarget(undefined);

        // Cleanup features when unmounting
        Object.values(travelersMarkers.current).forEach((markerInfo) => {
          travelerSource.removeFeature(markerInfo.travelerFeature);
          travelerSource.removeFeature(markerInfo.destinationFeature);
        });

        // Clean up overlays
        for (let index = 0; index < travelersData.length; index++) {
          map.current.removeOverlay(travelers.current[index].overlay);
        }

        travelers.current = [];
        map.current = null;
      }
    };
  }, [travelersData, travelers]);

  useDrawRoute(
    currentTime,
    setCurrentTime,
    travelersData,
    routeFeatures,
    pathSource,
    getRoute
  );

  useClickMap(map, setShowPointModal);

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />

      {showPointModal && (
        <div
          onClick={() => {
            setShowPointModal(false);
          }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            onClick={(event) => {
              event.stopPropagation();
            }}
            style={{
              backgroundColor: "white",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "1em",
              zIndex: 1000,
            }}
          >
            <div onClick={() => setTravelersData([])}>Remove Data</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapComponent;
