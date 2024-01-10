/_ eslint-disable react-hooks/exhaustive-deps _/
import _ as turf from "@turf/turf";
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
import OSM from "ol/source/OSM.js";
import _ as Extent from "ol/extent";
// import { isLand, useGeoData } from "./hooks/checkLand";

import lau_dai from "./images/lau_dai.webp";
import quai_vat from "./images/quai_vat.jpg";
import quan_doi from "./images/quan_doi.jpg";

const api_key = "5b3ce3597851110001cf6248f2271b43c5d9489b88ff35df22f86d9f";
const api_google_key = "AIzaSyAkssZqD3mMFIaE8fiYNKHqWH949B9gxlc";
let origin = [105.8389327, 21.0040616];

const degree_distance = 0.2; // so cang to thi zoom cang nhieu
const topLeft = [origin[0] - degree_distance, origin[1] + degree_distance];
const bottomRight = [origin[0] + degree_distance, origin[1] - degree_distance];

const topLeftLonLat = fromLonLat([topLeft[0], topLeft[1]]);
const bottomRightLonLat = fromLonLat([bottomRight[0], bottomRight[1]]);
const extent = Extent.boundingExtent([topLeftLonLat, bottomRightLonLat]);

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
const [showModal, setShowModal] = useState(false);
const [selectedFeature, setSelectedFeature] = useState(null);
const [currentLocation, setCurrentLocation] = useState(origin);
const isMoving = useRef(false);
const map = useRef(null);
const travelerFeature = useRef(null);

// const [geoData, isLoadingGeoData] = useGeoData();

// tao ra 1 tham chieu layer de ve duong di
let currentPathLayer = null;

useEffect(() => {
console.log("currentLocation", currentLocation); // log giá trị hiện tại của currentLocation
}, [currentLocation]);

const mapRef = useRef();

useEffect(() => {
// Tạo ra các điểm ngẫu nhiên
const randomPoints = Array.from({ length: 10 }, () =>
getRandomPoint(origin, 2000)
);

    // Tạo ra các features cho các điểm ngẫu nhiên
    const features = randomPoints.map((coord) => {
      const feature = new Feature(new Point(fromLonLat(coord)));
      feature.setStyle(endPointStyle);
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
          maxZoom: 20,
          extent,
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

    // Kiểm tra nếu chưa có traveler feature thì tạo mới, nếu không thì cập nhật
    if (!travelerFeature.current) {
      travelerFeature.current = new Feature({
        geometry: new Point(fromLonLat(origin)),
      });
      travelerFeature.current.setStyle(travelerStyle);

      // Tạo layer cho traveler
      new VectorLayer({
        map: map.current,
        source: new VectorSource({
          features: [travelerFeature.current],
        }),
      });
    }

    // Thêm hàm xử lý sự kiện click vào Map
    map.current.on("click", (evt) => {
      map.current.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        // Xử lý khi click vào một điểm
        if (feature.get("isClickable") && !isMoving.current) {
          isMoving.current = true;
          const destination = feature.get("coord");
          setSelectedFeature(destination);
          setShowModal(true); // Hiện hộp thoại xác nhận
        }
      });
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

    map.current.on("click", function (evt) {
      var hasFeature = map.current.hasFeatureAtPixel(evt.pixel);

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

}, [isMoving]);
// }, [isMoving, isLoadingGeoData]); // Hàm này sẽ chạy lại mỗi khi giá trị của isMoving isLoadingGeoData thay đổi

const handleClose = () => {
isMoving.current = false;
setShowModal(false);
};

const handleConfirm = () => {
//Move the code from window.confirm's 'Yes' case here.
//Make sure to replace 'destination' variable with 'selectedFeature'

    const startTime = Date.now() / 1000;

    const destination = selectedFeature;

    const newPosition = fromLonLat(destination);
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

    axios
      .get("https://api.openrouteservice.org/v2/directions/driving-car", {
        params: {
          api_key,
          start: origin.join(","),
          end: destination.join(","),
        },
      })
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
        map.current.addLayer(currentPathLayer);

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
          travelerFeature.current.setGeometry(
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
              map.current.removeLayer(currentPathLayer);
              currentPathLayer = null;
            }
          }
        };

        requestAnimationFrame(moveTraveler);
      });

    setShowModal(false);

};

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
        Vị trí hiện tại của traveler: Kinh độ: {currentLocation[0].toFixed(6)},
        Vĩ độ: {currentLocation[1].toFixed(6)}
      </div>

      <Modal centered show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Do you want to move to this point?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            No
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>

);
}

export default MapComponent;
