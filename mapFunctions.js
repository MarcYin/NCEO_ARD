/**
 * Creates a custom Leaflet marker.
 */
var MyCustomMarker = L.Icon.extend({
    options: {
      shadowUrl: null,
      iconAnchor: new L.Point(12, 12),
      iconSize: new L.Point(24, 24),
    }
  });

  let featureGroup = null;
  let drawControl;
  let clickEvent;

  
  export function getDrawControl() {
    return drawControl;
  }
  
  export function getClickEvent() {
    return clickEvent;
  }
  
  
/**
 * This function enables drawing on the map.
 * 
 * @param {L.Map} map - The map to enable drawing on
 */
export function enableDrawing(map) {
    // Initialize the feature group for storing the polygons
    if (!featureGroup) {
        featureGroup = new L.FeatureGroup();
        featureGroup.addTo(map);
      }
    if (!map.hasLayer(featureGroup)) {
      featureGroup.addTo(map);
    }
  
    const drawOptions = {
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: true,
          shapeOptions: {
            color: '#007bff',
            weight: 2
          }
        },
        circle: true,
        rectangle: true,
        marker: false,
        circlemarker: {
          radius: 5,
          fillOpacity: 0.3,
          weight:1,
        },
        polyline: false,
      },
      edit: {
        featureGroup: featureGroup,
        remove: true
      }
    };
  
    if (!drawControl) {
      drawControl = new L.Control.Draw(drawOptions);
      map.addControl(drawControl);
    } else {
      drawControl.options.edit.featureGroup = featureGroup;
    }
  }

  export function getFeatureGroup() {
    return featureGroup;
  }
  /**
   * This function disables drawing on the map.
   * 
   * @param {L.Map} map - The map to disable drawing on
   */
  export  function disableDrawing(map, drawControl) {
    if (drawControl) {
      map.removeControl(drawControl);
      drawControl = null;
    }
  }
  
  /**
   * This function enables click on the map.
   * 
   * @param {L.Map} map - The map to enable click on
   */
export   function enableClick(map, clickEvent) {
    clickEvent = map.on('click', e => {
      // showTimeSeriesData(e.latlng);
    });
  }
  
  /**
   * This function disables click on the map.
   * 
   * @param {L.Map} map - The map to disable click on
   */
export  function disableClick(map, clickEvent) {
    if (clickEvent) {
      map.off('click', clickEvent);
    }
  }
