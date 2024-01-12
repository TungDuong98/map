import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import React, { useEffect, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { toLonLat } from "ol/proj";
import { getDistance } from "ol/sphere";

const OpenLayerMap = () => {
  const mapRef = useRef();
  const map = useRef();
  const isZoomed = useRef(false);
  const [showBackButton, setShowBackButton] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clickedCoordinate, setClickedCoordinate] = useState([0, 0]);
  const [currentZoom, setCurrentZoom] = useState(2);
  const [center, setCenter] = useState([0, 0]); // state to track the center
  const [edgeDistances, setEdgeDistances] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }); // state to track the distances

  const backToInitialView = () => {
    if (map.current) {
      map.current.getView().setCenter([0, 0]);
      map.current.getView().setZoom(2);
      isZoomed.current = false;
      setShowBackButton(false);
    }
  };

  useEffect(() => {
    map.current = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: currentZoom,
      }),
    });

    map.current.on("click", function (evt) {
      const clickedPoint = evt.coordinate;
      if (!isZoomed.current) {
        map.current.getView().animate({
          center: clickedPoint,
          zoom: 12,
          minZoom: 12,
          maxZoom: 12,
          duration: 1000,
        });
        isZoomed.current = true;
        setShowBackButton(true);
      } else {
        setClickedCoordinate(toLonLat(clickedPoint));
        setShowModal(true);
        isZoomed.current = false;
      }
    });

    map.current.getView().on("change:resolution", function (evt) {
      setCurrentZoom(map.current.getView().getZoom());
    });

    // Listen to changes in the center by responding to 'change:center' event
    map.current.getView().on("change:center", () => {
      const center = map.current.getView().getCenter();
      const centerLonLat = toLonLat(center);
      setCenter(centerLonLat);

      const extent = map.current
        .getView()
        .calculateExtent(map.current.getSize());

      const top =
        getDistance(centerLonLat, toLonLat([center[0], extent[3]])) / 1000;
      const bottom =
        getDistance(centerLonLat, toLonLat([center[0], extent[1]])) / 1000;
      const left =
        getDistance(centerLonLat, toLonLat([extent[0], center[1]])) / 1000;
      const right =
        getDistance(centerLonLat, toLonLat([extent[2], center[1]])) / 1000;

      setEdgeDistances({ top, right, bottom, left });

      if (map.current.getView().getZoom() >= 12) {
        console.log("toa do giua ban do: ", centerLonLat);
        console.log("khoang cach: ", { top, right, bottom, left });
      }
    });

    return () => {
      if (map.current) map.current.setTarget(undefined);
    };
  }, []);

  return (
    <div>
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }}></div>
      {showBackButton && (
        <button
          style={{ position: "absolute", top: "10px", left: "10px" }}
          onClick={backToInitialView}
        >
          Back
        </button>
      )}

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          isZoomed.current = false;
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Coordinate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Longitude: {clickedCoordinate[0]}
          <br />
          Latitude: {clickedCoordinate[1]}
          <br />
          Current Zoom: {currentZoom}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default OpenLayerMap;
