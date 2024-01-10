import GeoJsonGeometriesLookup from "geojson-geometries-lookup";
import { useEffect, useState } from "react";

import earthSeasJson from "../json/earth-seas-10m.geo.json";
import earthLakesJson from "../json/earth-lakes-10m.geo.json";
import earthRiverJson from "../json/earth-rivers-10m.geo.json";

export function useGeoData() {
  const [geoData, setGeoData] = useState({});
  const [isLoading, setIsLoading] = useState(true); // New state to track loading status

  useEffect(() => {
    setGeoData({
      seas: new GeoJsonGeometriesLookup(earthSeasJson),
      lakes: new GeoJsonGeometriesLookup(earthLakesJson),
      rivers: new GeoJsonGeometriesLookup(earthRiverJson),
    });

    setIsLoading(false); // Set loading status to false after data is loaded
  }, []);

  return [geoData, isLoading]; // Return both geoData and loading status
}

export function isLand(lat, lng, geoData) {
  if (!geoData.seas || !geoData.lakes || !geoData.rivers) {
    throw new Error("GeoData not loaded");
  }

  return (
    !geoData.seas.hasContainers({ type: "Point", coordinates: [lng, lat] }) &&
    !geoData.lakes.hasContainers({ type: "Point", coordinates: [lng, lat] }) &&
    !geoData.rivers.hasContainers({ type: "Point", coordinates: [lng, lat] })
  );
}
