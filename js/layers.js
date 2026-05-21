import { state } from "./state.js";

export const layers = {
  marker: null,
  bv: null,
  natura: null,
  topage: null,
  icpe: null
};

export function initLayers(map){
  layers.marker = L.layerGroup().addTo(map);

  layers.bv = L.geoJSON(null,{
    style:function(feature){
      if(feature.properties && feature.properties.selected){
        return {
          color:"#00d4ff",
          weight:4,
          fillColor:"#00d4ff",
          fillOpacity:0.15
        };
      }

      return {
        color:"#4fa3c8",
        weight:2,
        fillColor:"#4fa3c8",
        fillOpacity:0.08
      };
    }
  }).addTo(map);

  layers.natura = L.geoJSON(null,{
    style:function(){
      return {
        color:"#2ca25f",
        weight:2,
        fillColor:"#2ca25f",
        fillOpacity:.18
      };
    }
  }).addTo(map);

  layers.topage = L.geoJSON(null,{
    style:function(){
      return {
        color:"#0077cc",
        weight:3,
        opacity:.9
      };
    }
  }).addTo(map);

  layers.icpe = L.geoJSON(null,{
    pointToLayer:function(feature,latlng){
      return L.circleMarker(latlng,{
        radius:7,
        color:"#8e44ad",
        fillColor:"#8e44ad",
        fillOpacity:.85,
        weight:2
      });
    }
  }).addTo(map);
}

export function clearMapLayers(){
  layers.marker.clearLayers();
  layers.bv.clearLayers();
  layers.topage.clearLayers();
  layers.natura.clearLayers();
  layers.icpe.clearLayers();
}

export function setMarker(lat, lon){
  layers.marker.clearLayers();
  L.marker([lat,lon]).addTo(layers.marker);
}

export function refreshLayers(updatePreviewCallback){
  layers.bv.clearLayers();
  layers.topage.clearLayers();
  layers.natura.clearLayers();
  layers.icpe.clearLayers();

  if(document.getElementById("bvCheck").checked && state.currentData.bv){
    layers.bv.addData(state.currentData.bv);
  }

  if(document.getElementById("naturaCheck").checked && state.currentData.natura){
    layers.natura.addData(state.currentData.natura);
  }

  if(document.getElementById("topageCheck").checked && state.currentData.topage){
    layers.topage.addData(state.currentData.topage);
  }

  if(document.getElementById("icpeCheck").checked && state.currentData.icpe){
    layers.icpe.addData(state.currentData.icpe);
  }

  if(updatePreviewCallback){
    updatePreviewCallback();
  }
}
