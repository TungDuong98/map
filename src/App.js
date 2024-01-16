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
          zoom: 16,
          minZoom: 16,
          maxZoom: 18,
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
      if (map.current.getView().getZoom() >= 16) {
        const extent = map.current
          .getView()
          .calculateExtent(map.current.getSize());

        const topRightCoordinate = toLonLat([extent[2], extent[3]]);
        const bottomLeftCoordinate = toLonLat([extent[0], extent[1]]);

        console.log("Top right coordinate: ", topRightCoordinate);
        console.log("Bottom left coordinate: ", bottomLeftCoordinate);
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
