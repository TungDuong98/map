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

import lau_dai from "./images/lau_dai.webp";
import quai_vat from "./images/quai_vat.jpg";
import quan_doi from "./images/quan_doi.jpg";
import gif from "./images/giphy.gif";

const TRAVELER_AMOUNT = 5;

const api_key = "5b3ce3597851110001cf6248f2271b43c5d9489b88ff35df22f86d9f";
const api_google_key = "AIzaSyAkssZqD3mMFIaE8fiYNKHqWH949B9gxlc";
let origin = [105.8389327, 21.0040616];

// const degree_distance = 0.2; // so cang to thi zoom cang nhieu
// const topLeft = [origin[0] - degree_distance, origin[1] + degree_distance];
// const bottomRight = [origin[0] + degree_distance, origin[1] - degree_distance];

// const topLeftLonLat = fromLonLat([topLeft[0], topLeft[1]]);
// const bottomRightLonLat = fromLonLat([bottomRight[0], bottomRight[1]]);
// const extent = Extent.boundingExtent([topLeftLonLat, bottomRightLonLat]);

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

const arrowIcon = new Icon({
  src: gif,
  width: 30,
  height: 30,
});

const getRandomPoint = (center, radius) => {
  var y0 = center[1];
  var x0 = center[0];

  var rd = radius / 111300;

  var u = Math.random();
  var v = Math.random();

  var w = rd * Math.sqrt(u);
  var t = 2 * Math.PI * v;
  var x = w * Math.cos(t);
  var y = w * Math.sin(t);

  var xp = x / Math.cos(y0);

  return [xp + x0, y + y0];
};

function MapComponent() {
  const [showModal, setShowModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showTravelerModal, setShowTravelerModal] = useState(false);
  const [currentTraveler, setCurrentTraveler] = useState(null);

  const destinationsInMovement = useRef([]);
  const destinationsReached = useRef([]);
  const [showPointModal, setShowPointModal] = useState(false);
  const [currentMovingTravelers, setCurrentMovingTravelers] = useState([]);

  // Thay vì khởi tạo một mảng rỗng, hãy khởi tạo nó với số lượng bạn muốn.
  const isMoving = useRef(Array.from({ length: TRAVELER_AMOUNT }, () => false)); // track if each traveler is moving
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
  // Khởi tạo currentPathLayer
  let currentPathLayer = {
    value: null,
  };

  const mapRef = useRef();

  useEffect(() => {
    // Tạo ra các điểm ngẫu nhiên
    const randomPoints = Array.from({ length: 10 }, () =>
      getRandomPoint(origin, 2000)
    );

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

    // Nếu Map chưa được khởi tạo, thì ta sẽ tạo mới.
    if (!map.current) {
      map.current = new Map({
        target: mapRef.current, // đổ map vào HTML element
        layers: [
          // thiết lập các layer cho Map
          new TileLayer({
            source: new XYZ({
              url: `${mapStyle}/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
            }),
          }),
          // new TileLayer({
          //   source: new OSM(),
          // }),
          randomPointLayer,
        ],
        view: new View({
          center: fromLonLat(origin),
          zoom: 14,
          minZoom: 14,
          maxZoom: 16,
          // extent,
          constrainResolution: true,
          constrainRotation: true,
        }),
      });
    }

    // Tạo feature cho điểm xuất phát
    const originFeature = new Feature({
      geometry: new Point(fromLonLat(origin)),
    });
    originFeature.setStyle(startPointStyle);

    // Tạo layer cho điểm xuất phát
    new VectorLayer({
      map: map.current,
      source: new VectorSource({
        features: [originFeature],
      }),
    });

    // Initialize the travelers
    travelers.current.forEach((traveler, idx) => {
      if (!traveler.feature) {
        traveler.feature = new Feature({
          geometry: new Point(fromLonLat(origin)),
        });

        // Create a new style for each traveler with a number
        const numberStyle = new Style({
          text: new Text({
            text: String(idx + 1),
            scale: 1.2, // adjust scale as needed
            offsetY: -25, // adjust offset as needed to position the number correctly
          }),
          image: new Icon({
            src: quan_doi,
            width: 46.7,
            height: 31,
          }),
        });

        traveler.feature.setStyle(numberStyle);
        // Inside the travelers.current.forEach loop
        traveler.feature.setProperties({
          id: idx,
          isTraveler: true,
          moving: isMoving.current[idx],
        });

        // Create layer for each traveler
        new VectorLayer({
          map: map.current,
          source: new VectorSource({
            features: [traveler.feature],
          }),
        });
      }
    });

    // map.current.on("click", function (evt) {
    //   var hasFeature = map.current.hasFeatureAtPixel(evt.pixel);

    //   if (!hasFeature && !isLoadingGeoData) {
    //     var lonLat = toLonLat(evt.coordinate);

    //     console.log("Object.keys(geoData).length", Object.keys(geoData).length);

    //     if (Object.keys(geoData).length > 0) {
    //       const result = isLand(lonLat[1], lonLat[0], geoData);
    //       console.log("Is it land? :", result);
    //     }
    //   }
    // });

    map.current.on("click", (evt) => {
      let hasFeature = false;
      map.current.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (feature.get("isClickable")) {
          const destination = feature.get("coord");
          const destinationInMovement = destinationsInMovement.current.some(
            (item) => item.coordinate === destination
          );
          const destinationReached = destinationsReached.current.some(
            (item) => item.coordinate === destination
          );

          if (destinationInMovement || destinationReached) {
            const movingTravelers = destinationsInMovement.current.filter(
              (item) => item.coordinate === destination
            );
            const reachedTravelers = destinationsReached.current.filter(
              (item) => item.coordinate === destination
            );
            setCurrentMovingTravelers([
              ...movingTravelers,
              ...reachedTravelers,
            ]);
            setShowPointModal(true);
          } else if (!isMoving.current.every(Boolean)) {
            setSelectedFeature(destination);
            setShowModal(true);
          }
          hasFeature = true;
        } else if (feature.get("isTraveler")) {
          setCurrentTraveler(feature.get("id") + 1); // + 1 if your traveler ids start from 0

          if (isMoving.current[feature.get("id")]) {
            setShowTravelerModal(true);
          }
          hasFeature = true;
        }
      });

      if (!hasFeature) {
        var lonLat = toLonLat(evt.coordinate);
        axios
          .get(
            "https://overpass-api.de/api/interpreter?data=[out:json];is_in(" +
              lonLat[1] +
              "," +
              lonLat[0] +
              ")->.a;way(pivot.a);out;"
          )
          .then(function (response) {
            if (response.data.elements.length > 0) {
              var element = response.data.elements[0];
              if (
                element?.tags?.natural === "water" ||
                element?.tags?.waterway ||
                [
                  "river",
                  "riverbank",
                  "canal",
                  "stream",
                  "pond",
                  "reservoir",
                  "lake",
                  "sea",
                ].includes(element?.tags?.waterway)
              ) {
                console.log("Điểm này là mặt nước.");
              } else {
                console.log("Điểm này không phải mặt nước.");
              }
            } else {
              console.log("Không tìm thấy thông tin địa điểm tại điểm này.");
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    });
  }, [isMoving, travelers]);
  // }, [isMoving, isLoadingGeoData]); // Hàm này sẽ chạy lại mỗi khi giá trị của isMoving isLoadingGeoData thay đổi

  const handleClose = () => {
    if (selectedTraveler !== null) {
      isMoving.current[selectedTraveler] = false;
    }
    setShowModal(false);
  };

  const handleConfirm = (selectedTraveler) => {
    if (selectedTraveler === null) {
      console.error("No traveler selected");
      return;
    }

    if (isMoving.current[selectedTraveler]) {
      console.log("This traveler is still moving!");
      return;
    }

    const startTime = Date.now() / 1000;

    // Đặt điểm đến cho traveler được chọn
    travelers.current[selectedTraveler].destination = selectedFeature;

    const newPosition = fromLonLat(selectedFeature);
    const destinationFeature = new Feature({
      geometry: new Point(newPosition),
    });

    destinationFeature.setStyle(endPointStyle);
    new VectorLayer({
      map: map.current,
      source: new VectorSource({
        features: [destinationFeature],
      }),
    });

    // Mark the traveler as moving
    isMoving.current[selectedTraveler] = true;

    // Trong hàm handleConfirm, bạn cần set thuộc tính moving của feature tương ứng thành true với travel đang di chuyển.
    // Điều này giúp trạng thái moving được cập nhật đúng trên traveler mỗi khi họ di chuyển đến một điểm mới.
    // Set the 'moving' property of the feature to true
    travelers.current[selectedTraveler].feature.set("moving", true);

    axios
      .get("https://api.openrouteservice.org/v2/directions/driving-car", {
        params: {
          api_key,
          start: origin.join(","),
          end: selectedFeature.join(","),
        },
      })
      .then((response) => {
        if (!response.data.features[0]) {
          console.error("Path is empty, cannot create lineString");
          return;
        }

        travelers.current[selectedTraveler].atOrigin = false;

        const path = response.data.features[0].geometry.coordinates;

        //Create currentPathLayer.value here after path is defined
        currentPathLayer.value = new VectorLayer({
          source: new VectorSource({
            features: [
              new Feature(
                new LineString(path.map((coord) => fromLonLat(coord)))
              ),
            ],
          }),
        });
        map.current.addLayer(currentPathLayer.value);

        const line = turf.lineString(path);
        const travelTime = 0.002 * 60 * 60;

        const moveTraveler = () => {
          const elapsedTime = Date.now() / 1000 - startTime;
          const progress = elapsedTime / travelTime;
          const distance = turf.length(line) * progress;
          const currentLocation = turf.along(line, distance);

          // update vị trí hiện tại của traveler đang di chuyển
          if (
            currentLocation &&
            currentLocation.geometry &&
            currentLocation.geometry.coordinates
          ) {
            const currentCoord = currentLocation.geometry.coordinates;
            travelers.current[selectedTraveler].currentLocation = currentCoord; // cập nhật vị trí hiện tại
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
          travelers.current[selectedTraveler].feature.setGeometry(
            new Point(fromLonLat(currentCoord))
          );

          if (progress < 1) {
            requestAnimationFrame(moveTraveler);
          } else {
            console.log("Đã đến đích!");
            const destinationIndex = destinationsInMovement.current.findIndex(
              (item) => item.id === selectedTraveler
            );

            if (destinationIndex > -1) {
              destinationsReached.current.push(
                destinationsInMovement.current[destinationIndex]
              );

              destinationsInMovement.current.splice(destinationIndex, 1);

              // Update the moving property of the feature when the traveler has reached the destination:
              travelers.current[selectedTraveler].feature.set("moving", false);
            }

            isMoving.current[selectedTraveler] = false;

            // Xóa đường đi trên bản đồ
            if (currentPathLayer.value) {
              map.current.removeLayer(currentPathLayer.value);
              currentPathLayer.value = null;
            }

            // sau 5s ve vi tri ban dau

            setTimeout(function () {
              if (!travelers.current[selectedTraveler]) {
                console.error(
                  "Traveler with id " + selectedTraveler + " does not exist"
                );
                return;
              }

              // immediately set traveler's location back to origin without visual transition;
              travelers.current[selectedTraveler].currentLocation = origin; // Set current location to origin
              travelers.current[selectedTraveler].feature.setGeometry(
                new Point(fromLonLat(origin))
              ); // Update feature's geometry to origin
              travelers.current[selectedTraveler].atOrigin = true; // traveler is at origin again

              // remove the reached point from destinationsReached array
              destinationsReached.current = destinationsReached.current.filter(
                (reachedDestination) =>
                  reachedDestination.id !== selectedTraveler ||
                  !arePointsEqual(
                    reachedDestination.coordinate,
                    selectedFeature
                  )
              );
              // where arePointsEqual is a helper function that checks if two points are equal
              function arePointsEqual(point1, point2) {
                return point1[0] === point2[0] && point1[1] === point2[1];
              }
            }, selectedTraveler * 2000); // delay based on the destination point index, multiplied by 1000 to convert to milliseconds
          }
        };

        requestAnimationFrame(moveTraveler);
      });

    destinationsInMovement.current.push({
      coordinate: selectedFeature,
      id: selectedTraveler,
    });

    setShowModal(false);
    setSelectedTraveler(null);
  };

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

      {/* modal confirm di den diem */}
      <Modal centered show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Select a traveler to go to this point</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          {travelers.current.map((traveler, i) => (
            <Button
              key={`traveler-${i}`}
              variant="primary"
              disabled={isMoving.current[i] || !travelers.current[i].atOrigin} // disable if the traveler is moving or not at origin
              onClick={() => {
                setSelectedTraveler(i);
                handleConfirm(i);
              }}
            >
              Traveler {i + 1}
            </Button>
          ))}
        </Modal.Footer>
      </Modal>

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
