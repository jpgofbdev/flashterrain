export const CONFIG = {
  dbName: "FlashTerrainDB",
  storeName: "capsules",

  initialView: {
    center: [47.5, 1.7],
    zoom: 7
  },

  basemaps: {
    planIGN: {
      label: "IGN Plan",
      url:
        "https://data.geopf.fr/wmts?" +
        "SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0" +
        "&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2" +
        "&STYLE=normal&TILEMATRIXSET=PM" +
        "&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}" +
        "&FORMAT=image/png",
      options: {
        maxZoom: 18,
        attribution: "IGN"
      }
    }
  },

  search: {
    icpeRadiusM: 10000,
    topageBboxKm: 2,
    naturaBufferKm: 2,
    bvLonDelta: 0.25,
    bvLatDelta: 0.15
  }
};
