# FlashTerrain — version modulaire

Cette version reprend la **version validée** du prototype FlashTerrain, sans ajout fonctionnel volontaire.

## Structure

- `index.html` : structure HTML principale.
- `css/style.css` : styles desktop/mobile.
- `js/config.js` : paramètres centralisés.
- `js/state.js` : état courant de l’application.
- `js/map.js` : initialisation Leaflet et fond IGN.
- `js/layers.js` : couches Leaflet et rafraîchissement.
- `js/api.js` : appels aux flux externes.
- `js/storage.js` : IndexedDB.
- `js/ui.js` : interface, modes, panneaux mobiles, popup attributaire.
- `js/capsules.js` : création, affichage, import/export et suppression des capsules.
- `js/main.js` : orchestration générale.

## Règle de maintenance

Toute évolution doit partir de cette version modulaire comme base validée.

## Points conservés

- Mode Explorer / Nouveau point.
- Fonds IGN.
- Interface desktop et mobile.
- Capsules IndexedDB.
- Import / export JSON.
- Popup attributaire sous clic.
- ICPE, Natura 2000, BD Topage cours d’eau et bassin versant.
