import { state } from "./state.js";
import { estimateSizeKo, escapeHtml } from "./utils.js";
import { saveCapsuleToDB, getAllCapsules, deleteCapsuleFromDB } from "./storage.js";
import { refreshLayers, clearMapLayers, setMarker } from "./layers.js";
import { updatePreview, closeMobilePanels, isMobile } from "./ui.js";

let mapRef;

export function initCapsules(map){
  mapRef = map;

  document.getElementById("saveBtn").addEventListener("click",saveCapsule);

  document.getElementById("openFileBtn").addEventListener("click",()=>{
    document.getElementById("importFileInput").click();
  });

  document.getElementById("importFileInput").addEventListener("change",async function(e){
    if(e.target.files.length > 0){
      await importCapsules(e.target.files[0]);
    }
  });

  document.getElementById("exportAllBtn").addEventListener("click",async ()=>{
    await exportAllCapsules();
  });

  document.getElementById("capsuleList").addEventListener("click", async event => {
    const button = event.target.closest("button");
    if(!button) return;

    const id = Number(button.dataset.id);

    if(button.dataset.action === "open"){
      await openCapsule(id);
    }

    if(button.dataset.action === "export"){
      await exportCapsuleById(id);
    }

    if(button.dataset.action === "delete"){
      await deleteCapsule(id);
    }
  });
}

async function saveCapsule(){
  const layers = {};
  const labels = [];

  if(document.getElementById("topageCheck").checked && state.currentData.topage){
    layers.topage = state.currentData.topage;
    labels.push("Cours d’eau");
  }

  if(document.getElementById("bvCheck").checked && state.currentData.bv){
    layers.bv = state.currentData.bv;
    labels.push("Bassin versant");
  }

  if(document.getElementById("icpeCheck").checked && state.currentData.icpe){
    layers.icpe = state.currentData.icpe;
    labels.push("ICPE");
  }

  if(document.getElementById("naturaCheck").checked && state.currentData.natura){
    layers.natura = state.currentData.natura;
    labels.push("Natura 2000");
  }

  if(labels.length === 0){
    alert("Aucune couche cochée.");
    return;
  }

  const capsule = {
    id:Date.now(),
    name:"Capsule " + labels.join(" + ") + " - " + new Date().toLocaleString("fr-FR"),
    date:new Date().toISOString(),
    lat:state.currentLat,
    lon:state.currentLon,
    layers,
    layerLabels:labels,
    sizeKo:null
  };

  capsule.sizeKo = estimateSizeKo(capsule);

  await saveCapsuleToDB(capsule);
  await loadCapsules();

  if(isMobile()){
    closeMobilePanels();
  }

  alert("Capsule créée.");
}

function exportCapsule(capsule){
  const blob = new Blob(
    [JSON.stringify(capsule,null,2)],
    {type:"application/json"}
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = (capsule.name || "capsule").replace(/[^a-z0-9]/gi,"_") + ".json";
  a.click();

  URL.revokeObjectURL(url);
}

async function exportAllCapsules(){
  const capsules = await getAllCapsules();

  const blob = new Blob(
    [JSON.stringify(capsules,null,2)],
    {type:"application/json"}
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "flashterrain_capsules.json";
  a.click();

  URL.revokeObjectURL(url);
}

async function exportCapsuleById(id){
  const capsules = await getAllCapsules();
  const capsule = capsules.find(c => c.id === id);

  if(capsule){
    exportCapsule(capsule);
  }
}

async function importCapsules(file){
  const text = await file.text();

  let imported = JSON.parse(text);

  if(!Array.isArray(imported)){
    imported = [imported];
  }

  for(const capsule of imported){
    if(capsule && capsule.id && capsule.layers){
      await saveCapsuleToDB(capsule);
    }
  }

  await loadCapsules();

  alert(imported.length + " capsule(s) importée(s).");
}

export async function loadCapsules(){
  const container = document.getElementById("capsuleList");
  const capsules = await getAllCapsules();

  if(capsules.length === 0){
    container.innerHTML = '<div class="small">Aucune capsule disponible.</div>';
    return;
  }

  container.innerHTML = "";

  capsules.slice().reverse().forEach(function(capsule){
    const div = document.createElement("div");
    div.className = "capsule";

    let objectCount = 0;

    Object.values(capsule.layers).forEach(function(layer){
      if(layer && layer.features){
        objectCount += layer.features.length;
      }
    });

    div.innerHTML =
      '<div class="capsule-title">' + escapeHtml(capsule.name) + '</div>' +
      '<div class="capsule-meta">' + new Date(capsule.date).toLocaleString("fr-FR") + '</div>' +
      '<div class="capsule-content">' +
      '📍 ' + Number(capsule.lat).toFixed(5) + ', ' + Number(capsule.lon).toFixed(5) + '<br>' +
      '🧩 ' + escapeHtml(capsule.layerLabels.join(", ")) + '<br>' +
      '🗂 ' + objectCount + ' objets<br>' +
      '📦 ' + capsule.sizeKo + ' Ko' +
      '</div>' +
      '<div class="actions">' +
      '<button class="secondary" data-action="open" data-id="' + capsule.id + '">👁 Afficher</button>' +
      '<button data-action="export" data-id="' + capsule.id + '">⬇ Sauvegarder</button>' +
      '<button class="danger" data-action="delete" data-id="' + capsule.id + '">🗑 Supprimer</button>' +
      '</div>';

    container.appendChild(div);
  });
}

async function openCapsule(id){
  const capsules = await getAllCapsules();
  const capsule = capsules.find(c => c.id === id);

  if(!capsule){
    return;
  }

  state.currentLat = capsule.lat;
  state.currentLon = capsule.lon;

  state.currentData = {
    icpe:capsule.layers.icpe || null,
    natura:capsule.layers.natura || null,
    topage:capsule.layers.topage || null,
    bv:capsule.layers.bv || null
  };

  clearMapLayers();
  setMarker(state.currentLat,state.currentLon);

  document.getElementById("icpeCheck").disabled = false;
  document.getElementById("naturaCheck").disabled = false;
  document.getElementById("topageCheck").disabled = false;
  document.getElementById("bvCheck").disabled = false;

  document.getElementById("icpeCheck").checked = !!state.currentData.icpe;
  document.getElementById("naturaCheck").checked = !!state.currentData.natura;
  document.getElementById("topageCheck").checked = !!state.currentData.topage;
  document.getElementById("bvCheck").checked = !!state.currentData.bv;

  refreshLayers(updatePreview);

  document.getElementById("saveBtn").disabled = false;

  document.getElementById("liveInfo").innerHTML =
    `<b>Capsule affichée</b><br><br>
    📍 ${Number(state.currentLat).toFixed(5)}, ${Number(state.currentLon).toFixed(5)}<br>
    🧩 ${escapeHtml(capsule.layerLabels.join(", "))}`;

  mapRef.setView([state.currentLat,state.currentLon],11);

  if(isMobile()){
    closeMobilePanels();
  }
}

async function deleteCapsule(id){
  if(!confirm("Supprimer cette capsule ?")){
    return;
  }

  await deleteCapsuleFromDB(id);
  await loadCapsules();
}
