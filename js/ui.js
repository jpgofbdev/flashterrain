import { state } from "./state.js";
import { escapeHtml, firstValue, renderAttrs } from "./utils.js";

export function isMobile(){
  return window.innerWidth < 850;
}

export function closeMobilePanels(){
  if(!isMobile()) return;

  document.getElementById("livePanel").classList.remove("mobile-visible");
  document.getElementById("capsulePanel").classList.remove("mobile-visible");
}

function openMobilePanel(panelId){
  if(!isMobile()) return;

  closeMobilePanels();
  document.getElementById(panelId).classList.add("mobile-visible");
}

export function setMode(mode){
  state.interactionMode = mode;

  document.getElementById("exploreModeBtn").classList.remove("active");
  document.getElementById("newPointModeBtn").classList.remove("active");

  if(mode === "explore"){
    document.getElementById("exploreModeBtn").classList.add("active");
    document.getElementById("modeInfo").innerHTML =
      "Mode exploration : le clic affiche les objets présents.";
  }else{
    document.getElementById("newPointModeBtn").classList.add("active");
    document.getElementById("modeInfo").innerHTML =
      "Mode nouveau point : le prochain clic déclenchera une nouvelle requête réseau.";
  }
}

export function initUI(){
  document.getElementById("contextFab").addEventListener("click",()=>openMobilePanel("livePanel"));
  document.getElementById("capsuleFab").addEventListener("click",()=>openMobilePanel("capsulePanel"));
  document.getElementById("closeLivePanel").addEventListener("click",closeMobilePanels);
  document.getElementById("closeCapsulePanel").addEventListener("click",closeMobilePanels);

  document.querySelectorAll(".thematic-header").forEach(header => {
    header.addEventListener("click",() => {
      const themeId = header.dataset.theme;
      document.getElementById(themeId).classList.toggle("hidden");
    });
  });

  document.getElementById("exploreModeBtn").addEventListener("click",()=>setMode("explore"));
  document.getElementById("newPointModeBtn").addEventListener("click",()=>setMode("newPoint"));
}

export function setLayerControlsEnabled(enabled){
  ["icpeCheck","naturaCheck","topageCheck","bvCheck"].forEach(id => {
    document.getElementById(id).disabled = !enabled;
  });
}

export function checkAvailableLayers(){
  document.getElementById("icpeCheck").checked =
    Boolean(state.currentData.icpe && state.currentData.icpe.features.length > 0);

  document.getElementById("naturaCheck").checked =
    Boolean(state.currentData.natura && state.currentData.natura.features.length > 0);

  document.getElementById("topageCheck").checked =
    Boolean(state.currentData.topage && state.currentData.topage.features.length > 0);

  document.getElementById("bvCheck").checked =
    Boolean(state.currentData.bv && state.currentData.bv.features.length > 0);
}

export function updateLiveInfo(){
  document.getElementById("liveInfo").innerHTML =
    `<b>Contexte chargé</b><br><br>
    🏭 ICPE : ${state.currentData.icpe.features.length}<br>
    🌿 Natura : ${state.currentData.natura.features.length}<br>
    💧 Cours d’eau : ${state.currentData.topage.features.length}<br>
    🌊 Bassins versants : ${state.currentData.bv.features.length}`;
}

export function updatePreview(){
  const labels = [];
  let objectCount = 0;

  if(document.getElementById("topageCheck").checked && state.currentData.topage){
    labels.push("Cours d’eau");
    objectCount += state.currentData.topage.features.length;
  }

  if(document.getElementById("bvCheck").checked && state.currentData.bv){
    labels.push("Bassin versant");
    objectCount += state.currentData.bv.features.length;
  }

  if(document.getElementById("icpeCheck").checked && state.currentData.icpe){
    labels.push("ICPE");
    objectCount += state.currentData.icpe.features.length;
  }

  if(document.getElementById("naturaCheck").checked && state.currentData.natura){
    labels.push("Natura 2000");
    objectCount += state.currentData.natura.features.length;
  }

  if(labels.length === 0){
    document.getElementById("capsulePreview").innerHTML =
      "Aucune capsule en préparation.";
    return;
  }

  document.getElementById("capsulePreview").innerHTML =
    `<b>Capsule en préparation</b><br><br>
    🧩 Couches : ${labels.join(", ")}<br>
    🗂 Objets : ${objectCount}`;
}

export function showContextPopup(map,e){
  if(!state.currentData.icpe && !state.currentData.natura && !state.currentData.topage && !state.currentData.bv){
    return;
  }

  const clickPoint = turf.point([e.latlng.lng,e.latlng.lat]);
  let html = '<div class="context-popup"><b>📍 Contexte sous le clic</b>';
  let found = false;

  const icpeHits = [];

  if(document.getElementById("icpeCheck").checked && state.currentData.icpe){
    state.currentData.icpe.features.forEach(f => {
      try{
        const dist = turf.distance(
          clickPoint,
          turf.point(f.geometry.coordinates),
          {units:"kilometers"}
        );

        if(dist < 0.25){
          icpeHits.push(f);
        }
      }catch(err){}
    });
  }

  if(icpeHits.length > 0){
    found = true;
    html += `<div class="context-section"><div class="context-title">🏭 ICPE (${icpeHits.length})</div>`;

    icpeHits.forEach(f => {
      const p = f.properties || {};
      const title = p.raisonSociale || "ICPE";

      html += `<div class="context-item">• <b>${escapeHtml(title)}</b>`;
      html += renderAttrs(p,[
        {label:"Commune",keys:["commune"]},
        {label:"Régime",keys:["regime"]},
        {label:"SIRET",keys:["siret"]},
        {label:"Adresse",keys:["adresse1"]},
        {label:"Service AIOT",keys:["serviceAIOT"]},
        {label:"Date mise à jour",keys:["date_maj"]}
      ]);
      html += `</div>`;
    });

    html += '</div>';
  }

  const naturaHits = [];

  if(document.getElementById("naturaCheck").checked && state.currentData.natura){
    state.currentData.natura.features.forEach(f => {
      try{
        if(turf.booleanPointInPolygon(clickPoint,f)){
          naturaHits.push(f);
        }
      }catch(err){}
    });
  }

  if(naturaHits.length > 0){
    found = true;
    html += `<div class="context-section"><div class="context-title">🌿 Natura 2000 (${naturaHits.length})</div>`;

    naturaHits.forEach(f => {
      const p = f.properties || {};
      const title =
        firstValue(p,["nom_site","SITENAME","NOM_SITE","nom","name","site_name"]) ||
        "Natura 2000";

      html += `<div class="context-item">• <b>${escapeHtml(title)}</b>`;
      html += renderAttrs(p,[
        {label:"Code site",keys:["sitecode","SITECODE","code_site","CODE_SITE"]},
        {label:"Type",keys:["type","TYPE","sitename_type"]},
        {label:"Source",keys:["source","SOURCE"]}
      ]);
      html += `</div>`;
    });

    html += '</div>';
  }

  const topageHits = [];

  if(document.getElementById("topageCheck").checked && state.currentData.topage){
    state.currentData.topage.features.forEach(f => {
      try{
        const dist = turf.pointToLineDistance(clickPoint,f,{units:"kilometers"});
        if(dist < 0.08){
          topageHits.push(f);
        }
      }catch(err){}
    });
  }

  if(topageHits.length > 0){
    found = true;
    html += `<div class="context-section"><div class="context-title">💧 Cours d’eau BD Topage (${topageHits.length})</div>`;

    topageHits.forEach((f,idx) => {
      const p = f.properties || {};
      html += `<div class="context-item">• <b>Cours d’eau ${idx + 1}</b>`;
      html += renderAttrs(p,[
        {label:"Source",keys:["source"]},
        {label:"Couche",keys:["layer"]},
        {label:"Nom",keys:["nom","NOM","libelle","LIBELLE","toponyme"]}
      ]);
      html += `</div>`;
    });

    html += '</div>';
  }

  const bvHits = [];

  if(document.getElementById("bvCheck").checked && state.currentData.bv){
    state.currentData.bv.features.forEach(f => {
      try{
        if(turf.booleanPointInPolygon(clickPoint,f)){
          bvHits.push(f);
        }
      }catch(err){}
    });
  }

  if(bvHits.length > 0){
    found = true;
    html += `<div class="context-section"><div class="context-title">🌊 Bassin versant Topage (${bvHits.length})</div>`;

    bvHits.forEach((f,idx) => {
      const p = f.properties || {};
      const title = p.selected ? "Bassin versant sélectionné" : `Bassin versant ${idx + 1}`;

      html += `<div class="context-item">• <b>${escapeHtml(title)}</b>`;
      html += renderAttrs(p,[
        {label:"Source",keys:["source"]},
        {label:"Couche",keys:["layer"]},
        {label:"Code",keys:["code","CODE","CdBv","cdbv","id"]},
        {label:"Nom",keys:["nom","NOM","libelle","LIBELLE"]}
      ]);
      html += `</div>`;
    });

    html += '</div>';
  }

  if(found){
    html += '</div>';

    L.popup({maxWidth:340})
      .setLatLng(e.latlng)
      .setContent(html)
      .openOn(map);
  }
}
