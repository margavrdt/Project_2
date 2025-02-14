import Map from 'https://cdn.jsdelivr.net/npm/ol/Map.js';
import View from 'https://cdn.jsdelivr.net/npm/ol/View.js';
import TileLayer from 'https://cdn.jsdelivr.net/npm/ol/layer/Tile.js';
import OSM from 'https://cdn.jsdelivr.net/npm/ol/source/OSM.js';
import VectorLayer from 'https://cdn.jsdelivr.net/npm/ol/layer/Vector.js';
import VectorSource from 'https://cdn.jsdelivr.net/npm/ol/source/Vector.js';
import { Draw } from 'https://cdn.jsdelivr.net/npm/ol/interaction.js';
import { Point, LineString, Polygon } from 'https://cdn.jsdelivr.net/npm/ol/geom.js';
import { DragAndDrop } from 'https://cdn.jsdelivr.net/npm/ol/interaction/DragAndDrop.js';
import GeoJSON from 'https://cdn.jsdelivr.net/npm/ol/format/GeoJSON.js';
import Overlay from 'https://cdn.jsdelivr.net/npm/ol/Overlay.js';
const rasterLayer = new TileLayer({
  source: new OSM(),
});


const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({
  source: vectorSource,
});


const map = new Map({
  target: 'map',
  layers: [rasterLayer, vectorLayer],
  view: new View({
    center: [1468638.131296, 7499619.030200],
    zoom: 12,
  }),
});


const typeSelect = document.getElementById('type');
const coordinatesDisplay = document.getElementById('coordinates-display');

let draw; 
function addInteraction() {
  if (draw) {
    map.removeInteraction(draw);
  }

  const value = typeSelect.value;
  if (value !== 'None') {
    draw = new Draw({
      source: vectorSource,
      type: value,
    });

    draw.on('drawend', function (event) {
      const feature = event.feature;
      const geometry = feature.getGeometry();

      let coordinatesText = '';
      if (geometry instanceof Point) {
        const coords = geometry.getCoordinates();
        coordinatesText = `Point: ${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}`;
      } else if (geometry instanceof LineString) {
        const coords = geometry.getCoordinates();
        coordinatesText = 'LineString: ' + coords.map(coord => `${coord[0].toFixed(2)}, ${coord[1].toFixed(2)}`).join(' | ');
      } else if (geometry instanceof Polygon) {
        const coords = geometry.getCoordinates()[0]; 
        coordinatesText = 'Polygon: ' + coords.map(coord => `${coord[0].toFixed(2)}, ${coord[1].toFixed(2)}`).join(' | ');
      }

      coordinatesDisplay.innerHTML = coordinatesText;
    });

    map.addInteraction(draw);
  }
}

typeSelect.onchange = addInteraction;
addInteraction(); 


const dragAndDropInteraction = new DragAndDrop({
  formatConstructors: [GeoJSON],
});

dragAndDropInteraction.on('addfeatures', function (event) {
  const geojsonSource = new VectorSource({
    features: event.features,
  });

  const geojsonLayer = new VectorLayer({
    source: geojsonSource,
  });

  map.addLayer(geojsonLayer);
  map.getView().fit(geojsonSource.getExtent(), { duration: 1000 });

  
  enablePopup();
});

map.addInteraction(dragAndDropInteraction);


const popupContainer = document.createElement('div');
popupContainer.className = 'ol-popup';
popupContainer.style.position = 'absolute';
popupContainer.style.background = 'white';
popupContainer.style.padding = '10px';
popupContainer.style.borderRadius = '5px';
popupContainer.style.boxShadow = '0px 0px 5px rgba(0, 0, 0, 0.3)';
popupContainer.style.display = 'none';
popupContainer.style.fontSize = '14px';

document.body.appendChild(popupContainer);

const popupOverlay = new Overlay({
  element: popupContainer,
  positioning: 'bottom-center',
  stopEvent: false,
});

map.addOverlay(popupOverlay);


function enablePopup() {
  map.on('click', function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feat) {
      return feat;
    });

    if (feature) {
      const properties = feature.getProperties();
      let content = '<b>Element information:</b><br>';
      Object.keys(properties).forEach(key => {
        if (key !== 'geometry') {
          content += `<b>${key}:</b> ${properties[key]}<br>`;
        }
      });

      popupContainer.innerHTML = content;
      popupOverlay.setPosition(evt.coordinate);
      popupContainer.style.display = 'block';
    } else {
      popupContainer.style.display = 'none';
    }
  });
}


enablePopup();
