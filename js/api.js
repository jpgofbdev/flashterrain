import { CONFIG } from "./config.js";
import { bboxAroundPoint, bboxToWfsBBOXParam_LatLon } from "./utils.js";

export async function queryNaturaHabitats(lat, lon){
  const buffer = turf.buffer(
    turf.point([lon,lat]),
    CONFIG.search.naturaBufferKm,
    {units:"kilometers"}
  );

  const params = new URLSearchParams({
    geom:JSON.stringify(buffer.geometry),
    _limit:"1000"
  });

  const url =
    "https://apicarto.ign.fr/api/nature/natura-habitat?" +
    params.toString();

  const response = await fetch(url);
  const data = await response.json();

  return data.features ? data : {
    type:"FeatureCollection",
    features:[]
  };
}

export async function queryIcpeReelles(lat, lon){
  const url =
    "https://georisques.gouv.fr/api/v1/installations_classees" +
    "?latlon=" +
    encodeURIComponent(lon + "," + lat) +
    "&rayon=" + CONFIG.search.icpeRadiusM +
    "&page=1&page_size=200";

  const response = await fetch(url);
  const data = await response.json();
  const installations = data.data || [];

  const features = installations
    .filter(i =>
      Number.isFinite(Number(i.latitude)) &&
      Number.isFinite(Number(i.longitude))
    )
    .map(i => ({
      type:"Feature",
      geometry:{
        type:"Point",
        coordinates:[
          Number(i.longitude),
          Number(i.latitude)
        ]
      },
      properties:{
        raisonSociale:i.raisonSociale || null,
        adresse1:i.adresse1 || null,
        adresse2:i.adresse2 || null,
        codePostal:i.codePostal || null,
        commune:i.commune || null,
        codeInsee:i.codeInsee || null,
        codeNaf:i.codeNaf || null,
        siret:i.siret || null,
        regime:i.regime || null,
        prioriteNationale:i.prioriteNationale || null,
        serviceAIOT:i.serviceAIOT || null,
        inspections:i.inspections || [],
        date_maj:i.date_maj || null
      }
    }));

  return {
    type:"FeatureCollection",
    features
  };
}

export async function queryCoursEauTopage(lat, lon){
  const b = bboxAroundPoint(lat, lon, CONFIG.search.topageBboxKm);

  const url =
    `https://services.sandre.eaufrance.fr/geo/sandre?language=fre&SERVICE=WFS&REQUEST=GetFeature&VERSION=2.0.0&TYPENAMES=sa:CoursEau_FXX_Topage2024&SRSNAME=urn:ogc:def:crs:EPSG::4326&BBOX=${bboxToWfsBBOXParam_LatLon(b)}`;

  console.log("[TOPAGE CE] URL:", url);

  const response = await fetch(url);
  const gmlData = await response.text();

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gmlData, "text/xml");

  const lineStrings = xmlDoc.getElementsByTagName('gml:LineString');
  const features = [];

  for (let i = 0; i < lineStrings.length; i++) {
    const posListNode = lineStrings[i].getElementsByTagName('gml:posList')[0];
    if(!posListNode) continue;

    const posList = posListNode.textContent.trim().split(/\s+/);
    const coordinates = [];

    for (let j = 0; j < posList.length; j += 2) {
      coordinates.push([
        parseFloat(posList[j + 1]),
        parseFloat(posList[j])
      ]);
    }

    features.push({
      type:"Feature",
      geometry:{
        type:"LineString",
        coordinates:coordinates
      },
      properties:{
        source:"BD Topage",
        layer:"CoursEau_FXX_Topage2024"
      }
    });
  }

  console.log("[TOPAGE CE] Features:", features.length);

  return {
    type:"FeatureCollection",
    features:features
  };
}

function gmlPolygonsToGeoJSON(gmlData){
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gmlData,"text/xml");
  const polygons = xmlDoc.getElementsByTagName('gml:Polygon');
  const features = [];

  for(let i=0;i<polygons.length;i++){
    const posListNode = polygons[i].getElementsByTagName('gml:posList')[0];

    if(!posListNode){
      continue;
    }

    const posList = posListNode.textContent.trim().split(/\s+/);
    const coordinates = [];

    for(let j=0;j<posList.length;j+=2){
      coordinates.push([
        parseFloat(posList[j + 1]),
        parseFloat(posList[j])
      ]);
    }

    features.push({
      type:"Feature",
      geometry:{
        type:"Polygon",
        coordinates:[coordinates]
      },
      properties:{
        source:"BD Topage",
        layer:"BassinVersantTopographique_FXX_Topage2024"
      }
    });
  }

  return {
    type:"FeatureCollection",
    features:features
  };
}

export async function queryBassinTopage(lat, lon){
  const bbox = [
    lon - CONFIG.search.bvLonDelta,
    lat - CONFIG.search.bvLatDelta,
    lon + CONFIG.search.bvLonDelta,
    lat + CONFIG.search.bvLatDelta
  ];

  const url =
    "https://services.sandre.eaufrance.fr/geo/sandre" +
    "?language=fre" +
    "&SERVICE=WFS" +
    "&REQUEST=GetFeature" +
    "&VERSION=2.0.0" +
    "&TYPENAMES=sa:BassinVersantTopographique_FXX_Topage2024" +
    "&SRSNAME=urn:ogc:def:crs:EPSG::4326" +
    `&BBOX=${bbox.join(",")},urn:ogc:def:crs:EPSG:`;

  console.log("[BV TOPAGE] URL:", url);

  const response = await fetch(url);
  const text = await response.text();

  const geojson = gmlPolygonsToGeoJSON(text);
  const point = turf.point([lon,lat]);

  geojson.features.forEach(f => {
    try{
      if(turf.booleanPointInPolygon(point,f)){
        f.properties.selected = true;
      }
    }catch(err){}
  });

  console.log("[BV TOPAGE] Features:", geojson.features.length);

  return geojson;
}
