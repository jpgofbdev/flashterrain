export function estimateSizeKo(obj){
  const bytes = new Blob([JSON.stringify(obj)]).size;
  return Math.round(bytes / 1024 * 10) / 10;
}

export function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

export function firstValue(props, keys){
  if(!props) return null;

  for(const key of keys){
    if(props[key] !== undefined && props[key] !== null && String(props[key]).trim() !== ""){
      return props[key];
    }
  }

  return null;
}

export function renderAttrs(props, rows){
  const parts = [];

  rows.forEach(row => {
    const value = firstValue(props,row.keys);

    if(value !== null){
      parts.push(
        `<div><b>${escapeHtml(row.label)} :</b> ${escapeHtml(value)}</div>`
      );
    }
  });

  if(parts.length === 0){
    return '<div class="context-attrs context-empty">Attributs non disponibles dans la capsule.</div>';
  }

  return '<div class="context-attrs">' + parts.join("") + '</div>';
}

export function bboxAroundPoint(lat, lon, km){
  const dLat = km / 111.32;
  const dLon = km / (111.32 * Math.cos(lat * Math.PI / 180));

  return {
    minLon: lon - dLon,
    minLat: lat - dLat,
    maxLon: lon + dLon,
    maxLat: lat + dLat
  };
}

export function bboxToWfsBBOXParam_LatLon(bbox){
  return [
    bbox.minLat,
    bbox.minLon,
    bbox.maxLat,
    bbox.maxLon
  ].join(",") + ",urn:ogc:def:crs:EPSG::4326";
}
