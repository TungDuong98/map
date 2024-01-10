import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import React, { useEffect, useRef, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { toLonLat } from "ol/proj";

const OpenLayerMap = () => {
const mapRef = useRef();
const map = useRef();
const isZoomed = useRef(false);
const [showBackButton, setShowBackButton] = useState(false); // New state for controlling button 'Back' visibility
const [showModal, setShowModal] = useState(false);
const [clickedCoordinate, setClickedCoordinate] = useState([0, 0]);

const backToInitialView = () => {
if (map.current) {
map.current.getView().setCenter([0, 0]);
map.current.getView().setZoom(2);
isZoomed.current = false;
setShowBackButton(false); // Hide back button
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
zoom: 2,
}),
});

    map.current.on("click", function (evt) {
      const clickedPoint = evt.coordinate;
      if (!isZoomed.current) {
        map.current.getView().animate({
          center: clickedPoint,
          zoom: 12,
          duration: 1000,
        });
        isZoomed.current = true;
        setShowBackButton(true); // Show back button
      } else {
        setClickedCoordinate(toLonLat(clickedPoint));
        setShowModal(true);
        isZoomed.current = false;
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
onClick={backToInitialView} >
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
        </Modal.Body>
      </Modal>
    </div>

);
};

export default OpenLayerMap;
