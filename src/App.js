/* eslint-disable react-hooks/exhaustive-deps */
import * as turf from "@turf/turf";
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
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
// import OSM from "ol/source/OSM.js";
// import * as Extent from "ol/extent";
import Text from "ol/style/Text";
// import { isLand, useGeoData } from "./hooks/checkLand";
import Overlay from "ol/Overlay";

import lau_dai from "./images/lau_dai.webp";
import quai_vat from "./images/quai_vat.jpg";
import quan_doi from "./images/quan_doi.jpg";
import arrow from "./images/giphy.gif";
import Stroke from "ol/style/Stroke";

const TRAVELER_AMOUNT = 5;

const api_key = "5b3ce3597851110001cf6248f2271b43c5d9489b88ff35df22f86d9f";
const api_google_key = "AIzaSyAkssZqD3mMFIaE8fiYNKHqWH949B9gxlc";
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

const randomPoints = [
  [105.85557097876611, 21.010123023018156],
  [105.8307598161608, 21.01949067718937],
  [105.84495192198916, 20.993695564462747],
  [105.8382869213779, 20.991998094765712],
  [105.82524662678202, 20.999492560165645],
  [105.83717952677631, 21.00601960900288],
  [105.85009415185186, 20.99624421452242],
  [105.8245320385892, 21.01824879561772],
  [105.86524792487954, 21.001461298558112],
  [105.82207528585958, 21.004702319385373],
];

const travelersMockData = [
  {
    id: 0,
    origin: origin,
    destination: randomPoints[0],
    startTime: new Date().getTime(),
    endTime: new Date().getTime() + 20000,
  },
  // {
  //   id: 1,
  //   origin: origin,
  //   destination: randomPoints[2],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 20000,
  // },
  // {
  //   id: 2,
  //   origin: origin,
  //   destination: randomPoints[3],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 30000,
  // },
  // {
  //   id: 3,
  //   origin: origin,
  //   destination: randomPoints[4],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 40000,
  // },
  // {
  //   id: 4,
  //   origin: origin,
  //   destination: randomPoints[5],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 50000,
  // },
  // {
  //   id: 5,
  //   origin: origin,
  //   destination: randomPoints[6],
  //   startTime: new Date().getTime(),
  //   endTime: new Date().getTime() + 60000,
  // },
];

// Tạo ra các điểm ngẫu nhiên

// Tạo ra các features cho các điểm ngẫu nhiên
const features = randomPoints.map((coord, index) => {
  const feature = new Feature(new Point(fromLonLat(coord)));
  feature.setStyle(
    new Style({
      image: new Icon({
        src: quai_vat,
        width: 46.7,
        height: 29.6,
      }),
      text: new Text({
        // Thêm dòng này để thêm số thứ tự vào style của Feature
        text: String(index + 1),
        scale: 1.2,
        offsetY: -25, // Dịch chuyển tọa độ y của số thứ tự so với ảnh, bạn có thể chỉnh đến khi nó phù hợp,
      }),
    })
  );
  feature.setProperties({ isClickable: true, coord });
  return feature;
});

// Tạo layer cho các điểm ngẫu nhiên
const randomPointLayer = new VectorLayer({
  source: new VectorSource({
    features: features,
  }),
});

async function getRoute(origin, destination) {
  let response;
  try {
    response = await axios.get(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        params: {
          api_key: api_key,
          start: origin.join(","),
          end: destination.join(","),
        },
      }
    );
  } catch (error) {
    console.error("Error fetching route:", error);
    return null; // Thêm điều kiện trả về `null` khi gặp lỗi
  }

  return response.data.features[0].geometry.coordinates;
}

const calculateDistance = (origin, destination) => {
  let from = turf.point(origin);
  let to = turf.point(destination);
  let options = { units: "kilometers" };

  return turf.distance(from, to, options);
};

const pathSource = new VectorSource();

function MapComponent() {
  const routeFeatures = useRef([]); // Chứa tất cả các routeFeatures của cả ứng dụng

  const travelersMarkers = useRef({});
  const isTraveling = useRef(
    Array.from({ length: TRAVELER_AMOUNT }, () => true)
  );
  const [travelersData, setTravelersData] = useState(travelersMockData);
  const [showTravelerModal, setShowTravelerModal] = useState(false);
  const [currentTraveler, setCurrentTraveler] = useState(null);

  const destinationsInMovement = useRef([]);
  const destinationsReached = useRef([]);
  const [showPointModal, setShowPointModal] = useState(false);
  const [currentMovingTravelers, setCurrentMovingTravelers] = useState([]);

  // Thay vì khởi tạo một mảng rỗng, hãy khởi tạo nó với số lượng bạn muốn.
  const isMoving = useRef(Array.from({ length: TRAVELER_AMOUNT }, () => true)); // cho tất cả traveler di chuyển ngay từ đầu
  const travelers = useRef(
    Array.from({ length: TRAVELER_AMOUNT }, () => ({
      feature: null,
      destination: null,
      atOrigin: true, // thêm trạng thái mới vào đây
      currentLocation: origin, // khởi tạo vị trí hiện tại tại điểm origin
    }))
  );
  const [selectedTraveler, setSelectedTraveler] = useState(null); // track which traveler is manually selected
  const map = useRef(null);

  // tao ra 1 tham chieu layer de ve duong di
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

  // test chuc nang quay lai

  // useEffect(() => {
  //   const timeoutId = setTimeout(() => {
  //     const newTravelersData = travelersData.map((travelerData, idx) => {
  //       const currentLocation = toLonLat(
  //         travelers.current[idx].feature.getGeometry().getCoordinates()
  //       );
  //       return {
  //         ...travelerData,
  //         origin: currentLocation, // update origin to be the current location of the traveler
  //         destination: origin,
  //         startTime: new Date().getTime(),
  //         endTime: new Date().getTime() + 10000,
  //       };
  //     });
  //     setTravelersData(newTravelersData);
  //   }, 10000);

  //   return () => clearTimeout(timeoutId);
  // }, [travelersData]); // adding travelersData as a dependency, so every 10 seconds, the positions will be updated and re-render the useEffect

  useEffect(() => {
    // Tạo feature cho điểm xuất phát

    const originFeature = new Feature({
      geometry: new Point(fromLonLat(origin)),
    });
    originFeature.setStyle(startPointStyle);

    const originLayer = new VectorLayer({
      source: new VectorSource({
        features: [originFeature],
      }),
    });

    // Nếu Map chưa được khởi tạo, thì ta sẽ tạo mới.

    // Tạo ra mọt VectorLayer để vẽ các đường dẫn

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
          // pathLayer.current, // Loại bỏ từ đây
        ],
        view: new View({
          center: fromLonLat(origin),
          zoom: 14,
          minZoom: 14,
          maxZoom: 16,
          constrainResolution: true,
          constrainRotation: true,
        }),
      });

      // Thêm vào sau khi Map được khởi tạo
      map.current.addLayer(pathLayer.current);
    }

    // Tạo layer cho điểm xuất phát
    new VectorLayer({
      map: map.current,
      source: travelerSource, // sử dụng source vừa tạo
    });

    travelersData.forEach((traveler, idx) => {
      // Tạo marker
      let origin = fromLonLat([traveler.origin[0], traveler.origin[1]]);
      let travelerFeature = new Feature({
        geometry: new Point(origin),
      });

      // Thiết lập style cho traveler
      travelerFeature.setStyle(
        new Style({
          image: new Icon({
            src: quan_doi, // ảnh cho traveler
            width: 46.7,
            height: 29.6,
          }),
        })
      );

      let dest = fromLonLat([traveler.destination[0], traveler.destination[1]]);
      let destinationFeature = new Feature({
        geometry: new Point(dest),
      });

      // Thêm features vào source
      travelerSource.addFeature(travelerFeature);
      travelerSource.addFeature(destinationFeature);

      travelersMarkers.current["traveler-" + idx] = {
        travelerFeature,
        destinationFeature,
      };

      // Di chuyển traveler.

      const moveTraveler = async () => {
        const route = await getRoute(traveler.origin, traveler.destination);
        if (!route) {
          console.error("Could not fetch route");
          return;
        }

        const totalTimeInSeconds =
          (traveler.endTime - traveler.startTime) / 1000;

        const routeLineString = turf.lineString(route);
        const totalLength = turf.length(routeLineString, {
          units: "kilometers",
        });

        // Tạo ra một LineString từ route
        const routeGeom = new LineString(
          route.map((coord) => fromLonLat(coord))
        );

        // Tạo ra một Feature từ LineString
        const routeFeature = new Feature(routeGeom);

        // Lưu trữ routeFeature để có thể xóa nó sau này
        routeFeatures.current[traveler.id] = routeFeature;

        // Thêm Feature vào pathSource
        pathSource.addFeature(routeFeature);

        let timerInterval = 16.7; // ~60 frames per second
        let totalTime = totalTimeInSeconds * 1000; // convert totalTime from seconds to milliseconds
        let totalFrame = totalTime / timerInterval;
        let travelDistanceEachFrame = totalLength / totalFrame;
        let currentProgress = 0;

        console.log("After adding:", pathSource.getFeatures().length);

        // Bắt đầu hàm animate
        const animate = () => {
          if (currentProgress <= totalLength) {
            let newCoord = turf.along(routeLineString, currentProgress, {
              units: "kilometers",
            });
            let lngLatNew = newCoord.geometry.coordinates;
            travelerFeature.getGeometry().setCoordinates(fromLonLat(lngLatNew));
            currentProgress += travelDistanceEachFrame;

            requestAnimationFrame(animate);
          } else if (isTraveling.current[traveler.id]) {
            // Removing the feature
            console.log(
              "Removing feature: ",
              routeFeatures.current[traveler.id]
            );
            pathSource.removeFeature(routeFeatures.current[traveler.id]);
            // Update the pathLayer
            pathLayer.current.changed();

            // Set isTraveling to false when removing the path
            isTraveling.current[traveler.id] = false;
          }
        };

        requestAnimationFrame(animate);
      };

      moveTraveler();
    });

    return () => {
      if (map.current) {
        // Cleanup features khi unmount
        Object.values(travelersMarkers.current).forEach((markerInfo) => {
          travelerSource.removeFeature(markerInfo.travelerFeature);
          travelerSource.removeFeature(markerInfo.destinationFeature);
        });
        map.current = null;
      }
    };
  }, [isMoving, travelersData, travelers]);

  function TravelerStatus({ travelerId, status, currentLocation }) {
    return (
      <tr>
        <td>{travelerId}</td>
        <td>
          {status.atOrigin
            ? "At origin"
            : status.movingTo
            ? `Moving to point ${status.movingTo}`
            : `Reached points: ${status.reached.join(", ")}`}
        </td>
        <td>{`Kinh độ: ${currentLocation[0].toFixed(
          6
        )}, Vĩ độ: ${currentLocation[1].toFixed(6)}`}</td>
      </tr>
    );
  }

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />

      <div
        style={{
          zIndex: 999,
          position: "absolute",
          top: 0,
          right: 0,
          background: "#FFF",
          padding: "10px",
        }}
      >
        <table>
          <thead>
            <tr>
              <th>Traveler</th>
              <th>Status</th>
              <th>Current Position</th>
            </tr>
          </thead>
          <tbody>
            {travelers.current.map((traveler, index) => (
              <TravelerStatus
                travelerId={index + 1}
                status={{
                  atOrigin: traveler.atOrigin,
                  movingTo: traveler.destination ? index : null,
                  reached: destinationsReached.current
                    .filter((item) => item.id === index)
                    .map((item) => item.coordinate.join(", ")), // cần cải tiến phần này để hiển thị tên của điểm thay vì tọa độ
                }}
                currentLocation={traveler.currentLocation} // sử dụng vị trí hiện tại cho từng traveler
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* modal show thong tin traveler*/}
      {currentTraveler !== null && isMoving.current[currentTraveler - 1] && (
        <Modal
          centered
          show={showTravelerModal}
          onHide={() => setShowTravelerModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Traveler Information</Modal.Title>
          </Modal.Header>
          <Modal.Body>This is Traveler {currentTraveler}</Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              onClick={() => setShowTravelerModal(false)}
            >
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {showPointModal && (
        <Modal
          centered
          show={showPointModal}
          onHide={() => setShowPointModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Notification</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            This point is already a destination for the following travellers:
            {currentMovingTravelers.map((traveler, index) => (
              <p key={index}>
                Traveler {traveler.id + 1} is{" "}
                {traveler.moving ? "moving to" : "at"} this point
              </p>
            ))}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => setShowPointModal(false)}>
              OK
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}

export default MapComponent;
