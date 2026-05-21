import { initMap } from "./map.js";
import { initLayers, clearMapLayers, setMarker, refreshLayers } from "./layers.js";
import { openDatabase } from "./storage.js";
import { state } from "./state.js";
import { initUI, isMobile, closeMobilePanels, setMode, setLayerControlsEnabled, checkAvailableLayers, updateLiveInfo, updatePreview, showContextPopup } from "./ui.js";
import { initCapsules, loadCapsules } from "./capsules.js";
import { queryIcpeReelles, queryNaturaHabitats, queryCoursEauTopage, queryBassinTopage } from "./api.js";

const map = initMap();

initLayers(map);
initUI();
initCapsules(map);

["icpeCheck","naturaCheck","topageCheck","bvCheck"].forEach(id => {
  document.getElementById(id).addEventListener("change",() => {
    refreshLayers(updatePreview);
  });
});

async function loadContext(lat, lon){
  state.currentLat = lat;
  state.currentLon = lon;

  clearMapLayers();

  document.getElementById("liveInfo").innerHTML =
    "Chargement des données...";

  setMarker(lat,lon);

  try{
    state.currentData.icpe = await queryIcpeReelles(lat,lon);
  }catch(err){
    console.error(err);
    state.currentData.icpe = {type:"FeatureCollection",features:[]};
  }

  try{
    state.currentData.natura = await queryNaturaHabitats(lat,lon);
  }catch(err){
    console.error(err);
    state.currentData.natura = {type:"FeatureCollection",features:[]};
  }

  try{
    state.currentData.topage = await queryCoursEauTopage(lat,lon);
  }catch(err){
    console.error(err);
    state.currentData.topage = {type:"FeatureCollection",features:[]};
  }

  try{
    state.currentData.bv = await queryBassinTopage(lat,lon);
  }catch(err){
    console.error(err);
    state.currentData.bv = {type:"FeatureCollection",features:[]};
  }

  setLayerControlsEnabled(true);
  checkAvailableLayers();

  refreshLayers(updatePreview);

  document.getElementById("saveBtn").disabled = false;

  updateLiveInfo();
}

map.on("click", async function(e){
  if(isMobile()){
    closeMobilePanels();
  }

  if(state.interactionMode === "newPoint"){
    await loadContext(e.latlng.lat,e.latlng.lng);
    setMode("explore");
    return;
  }

  showContextPopup(map,e);
});

(async ()=>{
  await openDatabase();
  await loadCapsules();
})();
