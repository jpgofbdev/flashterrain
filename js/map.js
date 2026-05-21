import { CONFIG } from "./config.js";

export function initMap(){
  const map = L.map("map",{zoomControl:false})
    .setView(CONFIG.initialView.center, CONFIG.initialView.zoom);

  const planIGN = L.tileLayer(
    CONFIG.basemaps.planIGN.url,
    CONFIG.basemaps.planIGN.options
  );

  planIGN.addTo(map);

  return map;
}
