const { fromUrl, fromUrls, fromArrayBuffer, fromBlob } = GeoTIFF;
import geotiffGeokeysToProj4 from 'https://cdn.skypack.dev/geotiff-geokeys-to-proj4';


document.addEventListener("DOMContentLoaded", async () => { 
  // "query": {
  //   "eo:cloud_cover": {
  //     "lt": 25
  //   }
  const fieldAnalysisButton = document.getElementById('field-analysis-button');
  const analysisMessage = document.getElementById('analysis-message');
  const analysisPanel = document.getElementById('analysis-panel');
  let previewBoxWidth;
  let previewBoxHeight;

  fieldAnalysisButton.addEventListener('click', () => {
    if (fieldAnalysisButton.disabled) {
      analysisMessage.style.display = 'inline';
    } else {
      analysisMessage.style.display = 'none';
      analysisPanel.classList.remove('hidden');
      const currentCenter = map.getCenter();
      map.setZoom(fieldAnalysisZoom);
      map.panTo(currentCenter);
      const previewBoxRect = analysisPanel.getBoundingClientRect();
      previewBoxWidth = previewBoxRect.width;
      previewBoxHeight = previewBoxRect.height;
    
      // console.log(previewBoxWidth, previewBoxHeight);
    
    }
  });

  let addedGeoTiffLayers = [];
  function updateFieldAnalysisButtonVisibility(geoTiffLayer) {
    const fieldAnalysisButton = document.getElementById('field-analysis-button');
    if (geoTiffLayer) {
      fieldAnalysisButton.style.opacity = '1';
      fieldAnalysisButton.disabled = false;
    } else {
      fieldAnalysisButton.style.opacity = '0.5';
      fieldAnalysisButton.disabled = true;
      analysisPanel.classList.add('hidden');
    }
  }
  
  // Initially hide the Field Analysis button
  updateFieldAnalysisButtonVisibility(null);

  const dateRangeInput = document.getElementById("date-range");
  const cloudCoverInput = document.getElementById('cloud-cover-slider')

  const defaultDateStart = "2018-02-01";
  const defaultDateEnd = "2018-09-30";
  let selectedDateRange = defaultDateStart + "T00:00:00Z/" + defaultDateEnd + "T23:59:59Z";

  const fieldAnalysisZoom = 13
  
  function createTick(label, container, percentage) {
    const tick = document.createElement('div');
    tick.className = 'tick';
  
    const tickLabel = document.createElement('div');
    tickLabel.className = 'tick-label';
    tickLabel.innerText = label;
  
    tick.appendChild(tickLabel);
    tick.style.left = `${percentage}%`;
    container.appendChild(tick);
  }
  
  const ticksContainer = document.getElementById('ticksContainer');
  ticksContainer.innerHTML = '';
  // // Set the defaultDateStart and defaultDateEnd for the time bar
  // const defaultDateStart = new Date(defaultDateStart); // Replace with your desired start date
  // const defaultDateEnd = new Date(defaultDateEnd); // Replace with your desired end date
  const selectedStartDate = new Date(defaultDateStart);
  const selectedEndDate = new Date(defaultDateEnd);

  
  const startDate = new Date(`${selectedStartDate.getFullYear()}-01-01`);
  const endDate = new Date(`${selectedEndDate.getFullYear()}-12-31`);
  
  let currentDate = new Date(startDate);
  const totalDuration = endDate.getTime() - startDate.getTime();

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const label = `${month}/${year}`;
  
    const tickProgress = (currentDate.getTime() - startDate.getTime()) / totalDuration;
    const percentage = tickProgress * 100;
  
    createTick(label, ticksContainer, percentage);
  
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Initialize Flatpickr with the range calendar plugin
  var dateSelection = flatpickr(dateRangeInput, {
    mode: "range",
    dateFormat: "Y-m-d",
    defaultDate: [defaultDateStart, defaultDateEnd],
    enable: [
      {
        from: "2017-01-01",
        to: "2019-12-31"
      }
    ],

    onClose: function (selectedDates, dateStr, instance) {
      if (dateStr.includes("to")) {
        selectedDateRange = dateStr.replace(" to ", "T00:00:00Z/") + "T23:59:59Z";
      } else {
        selectedDateRange = dateStr + "T00:00:00Z/" + dateStr + "T23:59:59Z";
      }

      // console.log(selectedDateRange);
      searchBodyProxy.datetime = selectedDateRange;

      // Function to create a tick and its label


      const ticksContainer = document.getElementById('ticksContainer');
      ticksContainer.innerHTML = '';
      // // Set the defaultDateStart and defaultDateEnd for the time bar
      // const defaultDateStart = new Date(defaultDateStart); // Replace with your desired start date
      // const defaultDateEnd = new Date(defaultDateEnd); // Replace with your desired end date
      const selectedStartDate = new Date(selectedDates[0]);
      const selectedEndDate = new Date(selectedDates[1]);

      
      const startDate = new Date(`${selectedStartDate.getFullYear()}-01-01`);
      const endDate = new Date(`${selectedEndDate.getFullYear()}-12-31`);
      
      let currentDate = new Date(startDate);
      
      const totalDuration = endDate.getTime() - startDate.getTime();

      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const label = `${month}/${year}`;
      
        const tickProgress = (currentDate.getTime() - startDate.getTime()) / totalDuration;
        const percentage = tickProgress * 100;
      
        createTick(label, ticksContainer, percentage);
      
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

    }
  });


  // basic OSM Leaflet map
  let map = L.map('map', {zoomSnap: 0}).setView([52.2, 0], 7);
  var basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 15,
      minZoom: 5,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.control.scale({position: 'bottomright', maxWidth: 200}).addTo(map);
  var layerControl = L.control.layers(null, [], {position: 'topleft'}).addTo(map);

  const search = new GeoSearch.GeoSearchControl({
    provider: new GeoSearch.OpenStreetMapProvider({params: {email: 'john@example.com',}}),
    style: 'bar',
    showMarker: false,
    autoComplete: true,         // optional: true|false  - default true
    autoCompleteDelay: 250,     // optional: number      - default 250
    //--------
    showMarker: false,          // optional: true|false  - default true
    showPopup: false,           // optional: true|false  - default false
    // marker: {                // optional: L.Marker    - default L.Icon.Default
    //     icon: new L.Icon.Default(),
    //     draggable: false,
    // },
    // popupFormat: ({ query, result }) => result.label,   // optional: function    - default returns result label
    // maxMarkers: 1,              // optional: number      - default 1
    retainZoomLevel: true,      // optional: true|false  - default false
    animateZoom: true,          // optional: true|false  - default true
    autoClose: true,           // optional: true|false  - default false
    searchLabel: 'Search for',  // optional: string      - default 'Enter address'
    keepResult: false           // optional: true|false  - default false
    
    });

  map.addControl(search);

  let drawControl;
  let clickEvent;
  
  function handleZoomChange(map) {
    const zoomLevel = map.getZoom();
    // console.log(zoomLevel);
    if (zoomLevel >= fieldAnalysisZoom) {
      enableDrawing(map);
      enableClick(map);
      analysisPanel.classList.remove('hidden');
    } else {
      disableDrawing(map);
      disableClick(map);
      analysisPanel.classList.add('hidden');
    }
  }

  function highlightLayer(layer) {
    // Save the original options for resetting later
    if (!layer.originalOptions) {
      layer.originalOptions = Object.assign({}, layer.options);
    }
    // Set the highlight options
    const highlightOptions = {
      color: '#ff9800', // Change the border color
      fillColor: '#ffff00', // Change the fill color
      weight: 2, // Increase the border width
    };
    layer.setStyle(highlightOptions);
  }
  
  function resetLayerStyle(layer) {
    if (layer.originalOptions) {
      layer.setStyle(layer.originalOptions);
    }
  }
  
  async function fetchDataOverFeature(layer, dropDownContainer) {
    const stacApiSearchUrl = 'https://192.171.169.103/search';
  
    let bounds;

    if (layer instanceof L.Polygon || layer instanceof L.Rectangle || layer instanceof L.Circle ) {
      // const latLngs = layer.getLatLngs();
      bounds =layer.getBounds();
    }  else {
      // console.warn('Unsupported layer type for fetchData');
      return;
    }
    function getLayerGeometry(layer) {
      if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        // Get the coordinates of the polygon or rectangle
        const latlngs = layer.getLatLngs()[0];
        return latlngs.map(latlng => [latlng.lng, latlng.lat]);
      } else if (layer instanceof L.Circle) {
        const circleCoords = layer.toPolygon().map(latlng => [latlng.lng, latlng.lat]);
        return circleCoords;
      }
    
      return null;
    }
    const layerGeometry = getLayerGeometry(layer);

    const projectedSW = map.project(bounds.getSouthWest());
    const projectedNE = map.project(bounds.getNorthEast());
    // console.log(projectedSW, projectedNE);
    // console.log(layer.getBounds());
    let xy_ratio = 1;
    if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
      xy_ratio = (projectedNE.x - projectedSW.x) / (projectedSW.y - projectedNE.y);
    // console.log(xy_ratio);
    } else {
      xy_ratio = 1;
      // console.log(xy_ratio);
    }

    const bbox = [
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat,
    ];
    

    async function createImagePreviewBox(feature) {


      const previewBox = document.createElement('div');
      previewBox.classList.add('preview-box');
    
      // Create title
      const title = document.createElement('div');
      title.classList.add('preview-box-title');
      title.textContent = feature.id;
      title.style.fontSize = '10px';
      title.style.textAlign = 'center';
      title.style.marginBottom = '5px';
    
      previewBox.appendChild(title);
    

      // Create image
      const tiffUrl = feature.assets.B02.href;
      const tiff = await fromUrl(tiffUrl);
      const image = await tiff.getImage();
      const width = image.getWidth();
      const height = image.getHeight();
      const tileWidth = image.getTileWidth();
      const tileHeight = image.getTileHeight();
      const samplesPerPixel = image.getSamplesPerPixel();
      
      const [ originX, originY ] = image.getOrigin();
      const [ xSize, ySize ] = image.getResolution();
      const uWidth = xSize * width;
      const uHeight = ySize * height;

      const geoKeys = image.getGeoKeys(); // Get geokeys
      
      const projObj = geotiffGeokeysToProj4.toProj4( geoKeys ); // Convert geokeys to proj4 string

      const sourceProjection = "WGS84"
      const destinationProjection = projObj.proj4;

      // Convert the bounding box coordinates to the TIFF image projection system
      const topLeft = proj4(sourceProjection, destinationProjection, [bbox[0], bbox[3]]);
      const bottomRight = proj4(sourceProjection, destinationProjection, [bbox[2], bbox[1]]);

      const projectedLayerGeometry = layerGeometry.map(coord => proj4(sourceProjection, destinationProjection, coord));

      
      // const projected_bbox = [topLeft[0], topLeft[1], bottomRight[0], bottomRight[1]];
      

      // console.log(xSize, ySize, originX, originY, topLeft, bottomRight)
      
      // // Define a function to convert projected coordinates to pixel coordinates
      function coordToPixel( coord) {
        const x = (coord[0] - originX) / xSize;
        const y = (coord[1] - originY) / ySize;
        return [Math.round(x), Math.round(y)];
      }

      // Convert the projected bounding box coordinates to pixel coordinates
      
      const topLeftPixel = coordToPixel(topLeft);
      const bottomRightPixel = coordToPixel(bottomRight);

      // const projectedLayerGeometryPixel = projectedLayerGeometry.map(coord => coordToPixel(coord));
      // console.log(projectedLayerGeometryPixel)

      // Define a function to convert window pixel coordinates back to projected coordinates
      function windowPixelToCoord(pixel, topLeft) {
        const x = (pixel[0] + topLeft[0]) * xSize + originX;
        const y = (pixel[1] + topLeft[1]) * ySize + originY;
        return [x, y];
      }


      // Create the window for the TIFF image
      const left = topLeftPixel[0];
      const top = topLeftPixel[1];
      const right = bottomRightPixel[0];
      const bottom = bottomRightPixel[1];
      // const data = await image.readRasters({window: [pixelX, pixelY, pixelX + 300, pixelY + 300]});


      // Check if a point is inside a polygon using the ray-casting algorithm
      function isPointInPolygon(point, polygon) {
        let isInside = false;
        const x = point[0], y = point[1];
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const xi = polygon[i][0], yi = polygon[i][1];
          const xj = polygon[j][0], yj = polygon[j][1];
          const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
          if (intersect) isInside = !isInside;
        }
        return isInside;
      }


      // Create the mask
      const maskHeight = bottom - top;
      const maskWidth = right - left;
      const mask = new Array(maskHeight);
      for (let y = 0; y < maskHeight; y++) {
        mask[y] = new Array(maskWidth);
        for (let x = 0; x < maskWidth; x++) {
          const coord = windowPixelToCoord([x, y], topLeftPixel);
          mask[y][x] = isPointInPolygon(coord, projectedLayerGeometry);
        }
      }
      

      const B04data = await image.readRasters({window: [left, top, right, bottom]});

      const B08Url = feature.assets.B08.href;
      const B08tiff = await fromUrl(B08Url);
      const B08image = await B08tiff.getImage();
      const B08data = await B08image.readRasters({ window: [left, top, right, bottom] });

      const B04 = B04data[0];
      const B08 = B08data[0];

      // access cloud and shadow mask
      const SCLUrl = feature.assets.cloud.href;
      const SCLtiff = await fromUrl(SCLUrl);
      const SCLimage = await SCLtiff.getImage();
      // since the cloud mask is 60m resolution, we need to recalculate the window
      const [ CoriginX, CoriginY ] = SCLimage.getOrigin();
      const [ CxSize, CySize ] = SCLimage.getResolution();

      function CcoordToPixel( coord) {
        const x = (coord[0] - CoriginX) / CxSize;
        const y = (coord[1] - CoriginY) / CySize;
        return [Math.round(x), Math.round(y)];
      }


      const CtopLeftPixel = CcoordToPixel(topLeft);
      const CbottomRightPixel = CcoordToPixel(bottomRight);
      const cloudLetf = CtopLeftPixel[0];
      const cloudTop = CtopLeftPixel[1];
      const cloudRight = CbottomRightPixel[0];
      const cloudBottom = CbottomRightPixel[1];


      const SCLdata = await SCLimage.readRasters({ window: [ cloudLetf, cloudTop, cloudRight, cloudBottom], width: maskWidth, height: maskHeight, resampleMethod: 'bilinear' });

      // const SCLdata = await SCLimage.readRasters({ window: [ left, top, right, bottom], resX: 10, resY: 10, resampleMethod: 'bilinear' });
      
      // const SCLdata = await SCLimage.readRasters({ window: [ pixelX/6, pixelY/6, pixelX/6 + 1, pixelY/6 + 1] });
      // const SCLdata = await SCLimage.readRasters({ window: [ pixelX, pixelY, pixelX + 1, pixelY + 1] });
      // console.log(SCLdata[0][0]);
      
      // calculate NDVI
      const ndvi = new Array(B04.length);
      for (let i = 0; i < B04.length; i++) {
        if (SCLdata[0][i] < 40) {
            ndvi[i] = (B08[i] - B04[i]) / (B08[i] + B04[i]);
        } else {
            ndvi[i] = null;

        }
      }

      // function convertTo2DArray(data, rows, cols) {
      //   const result = [];
      //   for (let i = 0; i < rows; i++) {
      //     const row = [];
      //     for (let j = 0; j < cols; j++) {
      //       row.push(data[i * cols + j]);
      //     }
      //     result.push(row);
      //   }
      //   return result;
      // }

      const numRows = bottom - top;
      const numCols = right - left;
      // const numRows = 300;
      // const numCols = 300;

      // Convert data[0] to a 2D array
      // const data2D = convertTo2DArray(data[0], numRows, numCols);

      function convertTo2DArrayWithMask(data, rows, cols, mask) {
        const result = [];
        for (let i = 0; i < rows; i++) {
          const row = [];
          for (let j = 0; j < cols; j++) {
            row.push(mask[i][j] ? data[i * cols + j] : null);
          }
          result.push(row);
        }
        return result;
      }
      
      
      // Convert data[0] to a 2D array and apply the mask
      const data2D = convertTo2DArrayWithMask(ndvi, numRows, numCols, mask);

      const colorPalette = ['a50026', 'd73027', 'f46d43', 'fdae61', 'fee08b', 'ffffbf', 'd9ef8b', 'a6d96a', '66bd63', '1a9850', '006837']
      function hexToRgb(hex, index) {
          var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          var color_float = (index / colorPalette.length)
          return [color_float.toLocaleString(), 'rgb' + '(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ')']
          // return [ ,'rgb' + '(' + parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16) + ')']
          }
      var rgbColorPalette = colorPalette.map((value, index) => hexToRgb(value, index))
      rgbColorPalette.push(['1.0', rgbColorPalette[rgbColorPalette.length - 1][1]]) 
      
      // Create plot
      const plotData = [{
        z: data2D.reverse().map(row => row.map(value => value === null ? null : value)),
        type: 'heatmap',
        colorscale: rgbColorPalette,
        zmin: 0, // Set the minimum value of the plot data range
        zmax: 1, // Set the maximum value of the plot data range
        showscale: false, // Show the colorbar scale on the plot
        connectgaps: false 
      }];
      
      
      const imgWidth = previewBoxWidth / 2 - 10;
      const imgHeight = imgWidth / xy_ratio;
      previewBox.style.height = `${imgHeight}px`;

      // console.log(feature);
      // console.log(numRows, numCols);
      // console.log(imgWidth, imgHeight);

      const plotLayout = {
        width: imgWidth,
        height: imgHeight,
        margin: {
          t: 0,
          l: 0,
          r: 0,
          b: 0
        },
        xaxis: {
          visible: false
        },
        yaxis: {
          visible: false
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)'
      };
      
      const config = {
        displayModeBar: false, // this is the line that hides the bar.
      };
            
      const plotDiv = document.createElement('div');
      // const plot = await Plotly.newPlot(plotDiv, plotData, plotLayout, config);
      // const imageData = await Plotly.toImage(plotDiv, { format: 'png', height: 150, width: 150 });

      // // Create image element and set its source to the image data
      // const img = document.createElement('img');
      // img.src = imageData;
      // img.style.width = '100%';
      // img.style.height = 'calc(100% - 20px)'; // Subtract the height of the title from the image height
      // img.style.objectFit = 'cover';
      
      // const imageData = await Plotly.toImage(plotDiv, { format: 'png', height: 150, width: 150 });

      // Create image element and set its source to the plot as a data URL
      const img = new Image();
      const plot = await Plotly.newPlot(plotDiv, plotData, plotLayout, config);
      img.src = await Plotly.toImage(plotDiv, { format: 'png'});
      img.style.width = '100%';
      img.style.height = 'calc(100% - 20px)'; // Subtract the height of the title from the image height
      img.style.objectFit = 'cover';
    
      previewBox.appendChild(img);
      
      

      return previewBox;
    }
    // const selectedDateRange = "2023-04-01T00:00:00Z/2023-04-30T23:59:59Z"; // Replace this with the actual date range
    // const cloudCoverInput = { value: 10 }; // Replace this with the actual cloud cover input value
  
    // Initialize searchBody
    let searchBody = {
      "collections": ["UK-sentinel-2"],
      "bbox": bbox,
      "limit": 100,
      "datetime": selectedDateRange,
      "intersects": null,
      "query": {
        "eo:cloud_cover": {
          "lt": cloudCoverInput.value
        }
      },
      "sort": [
        {
          "field": "datetime",
          "direction": "desc"
        }
      ]
    };
    // const imagePreviews = document.getElementById('plots');
    // Fetch data from the STAC API
    
    // display: grid;
    // grid-template-columns: repeat(2, 1fr);
    // grid-gap: 5px;
    // max-height: 600px;
    // overflow-y: auto;



    try {
      const response = await fetch(stacApiSearchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody),
      });
      if (response.ok) {
        const data = await response.json();
      
        const features = data.features;
        const previewBoxPromises = features.map(async feature => {
          const title = feature.id;
          const date = new Date(feature.properties.datetime).toDateString();
          const cloudCover = feature.properties['eo:cloud_cover'];
          const selfURL = feature.links[3].href;
          const httpsURL = selfURL.replace('http://', 'https://').replace(':8080', '');
          console.log(httpsURL);
          try {
            const featureData = await fetch(httpsURL);
            if (featureData.ok) {
              const jsonFeatureData = await featureData.json();
              const imagePreviewBox = await createImagePreviewBox(jsonFeatureData);
              return imagePreviewBox;
            } else {
              throw new Error('Error fetching data:', featureData.statusText);
            }
          } catch (error) {
            console.error('Error fetching data:', error);
            return null;
          }
        });
      
        const previewBoxes = await Promise.all(previewBoxPromises);
        previewBoxes.forEach(previewBox => {
          if (previewBox) {
            dropDownContainer.appendChild(previewBox);
          }
        });
      } else {
        console.error(`Error fetching data: ${response.status} ${response.statusText}`);
      }      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    dropDownContainer.querySelector('.loading-spinner').remove();
  }

  
  async function fetchDataTS(layer, dropDownContainer) {
    const stacApiSearchUrl = 'https://192.171.169.103/search';
  
    const latLng = layer.getLatLng();
    const buffer = 0.0001; // You can adjust this value according to your needs
    const bounds = L.latLngBounds(
      L.latLng(latLng.lat - buffer, latLng.lng - buffer),
      L.latLng(latLng.lat + buffer, latLng.lng + buffer)
    );

    const bbox = [
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat,
    ];
    
    const center = bounds.getCenter();
    // console.log(center);
    
    // console.log(defaultDateStart)
    // console.log(defaultDateEnd)

    // parse the year from defaultDateStart and defaultDateEnd string
    const defaultDateStartYear = defaultDateStart.slice(0,4)
    const defaultDateEndYear = defaultDateEnd.slice(0,4)
    
    
    let TSsearchBody = {
      "collections": ["UK-sentinel-2"],
      "bbox": bbox,
      "limit": 500,
      "datetime": `${defaultDateStartYear}-01-01T00:00:00Z/${defaultDateEndYear}-12-31T23:59:59Z`, 
      // "2017-01-01T00:00:00Z/" + "2019-12-31T23:59:59Z",
      "intersects": null,
      "query": {
        "eo:cloud_cover": {
          "lt": 50
        }
      },
      "sort": [
        {
          "field": "datetime",
          "direction": "desc"
        }
      ]
    };
      
    // Initialize empty arrays to store the datetime and pixel values
    const datetimeList = [];
    const pixelValueList = [];
    const featureList = [];
    try {
      const response = await fetch(stacApiSearchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(TSsearchBody)
      });
    
      if (response.ok) {
        const data = await response.json();
    
        const features = data.features;


        const startDate = new Date(`${selectedStartDate.getFullYear()}-01-01`);
        const endDate = new Date(`${selectedEndDate.getFullYear()}-12-31`);

        const ticksContainer = document.getElementById('ticksContainer');
        // get feature datetime from features
        const totalDuration = endDate.getTime() - startDate.getTime();
        
        
        
        features.map(feature => {
          const datetime = feature.properties.datetime;
          const currentDate = new Date(datetime);
          // only add dots if cloud cover is less than the cloud bar value
          if (feature.properties['eo:cloud_cover'] < cloudCoverInput.value) {


            // const position = ((new Date(datetime) - startDate) / timeSpan) * 100;
            const dotProgress = (currentDate.getTime() - startDate.getTime()) / totalDuration;
            const position = dotProgress * 100;
            
            const timeDot = document.createElement('div');
            timeDot.className = 'time-dot';
            timeDot.style.left = `${position}%`;

            const url_to_geotiff_file = feature.assets.boa_overview.href;
            const titiler_endpoint = "https://titiler.xyz";
            var titilerURL = `${titiler_endpoint}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${url_to_geotiff_file}`;
            
            timeDot.onmouseenter = () => {
              const dateString = datetime;
              const dateLabel = document.createElement('div');
              dateLabel.className = 'date-label';
              dateLabel.style.left = `${position}%`; // Keep this line to set the left position dynamically
              dateLabel.innerText = dateString;
              dateLabel.id = `dateLabel-${datetime}`;
            
              ticksContainer.appendChild(dateLabel);
            };
            
            timeDot.onmouseleave = () => {
              const dateLabel = document.getElementById(`dateLabel-${datetime}`);
              if (dateLabel) {
                ticksContainer.removeChild(dateLabel);
              }
            };

            timeDot.onclick = () => {


              // Add code to handle onclick event for time dots here
              // console.log(`Clicked on: ${datetime}`);
              

              
              var currentColor = timeDot.style.backgroundColor;
              if (currentColor === 'rgba(243, 255, 10, 0.4)') {
                timeDot.style.backgroundColor = 'rgba(6, 133, 244, 0.4)';
                timeDot.style.borderColor =  'rgba(6, 133, 244, 0.8)';
                // console.log(addedGeoTiffLayers);
                addedGeoTiffLayers.forEach(layer => {
                  // console.log(layer._url === titilerURL, layer._url);
                  if (layer._url === titilerURL) {
                    layerControl.removeLayer(layer);
                    map.removeLayer(layer);
                    const layerIndex = addedGeoTiffLayers.indexOf(layer);
                    if (layerIndex !== -1) {
                      addedGeoTiffLayers.splice(layerIndex, 1);
                    }
                  }
                });

              } else {

                timeDot.style.backgroundColor = 'rgba(243, 255, 10, 0.4)';
                timeDot.style.borderColor =  'rgba(243, 255, 10, 0.8)';

                const geoTiffLayer = L.tileLayer(titilerURL, {
                  maxZoom: 15,
                  minZoom: 5,
                  attribution: 'NCEO ARD'
                }).addTo(map);
                layerControl.addOverlay(geoTiffLayer, feature.id);
                addedGeoTiffLayers.push(geoTiffLayer);
              }

            };
            ticksContainer.appendChild(timeDot);
        }

        });

        // const featureDatetimeList = features.map(feature => feature.properties.datetime);
        
        //
        
        // featureDatetimeList.forEach((datetime) => {
        //   const date = new Date(datetime);
        //   const position = ((date - startDate) / timeSpan) * 100;
        //   createTimeDot(datetime, position, timeBarContainer);



        // });

        // Create a GeoTIFF object from the tiffUrl
        await Promise.all(features.map(async (feature) => {
          const tiffUrl = feature.assets.B04.href;
          const tiff = await fromUrl(tiffUrl);
          const image = await tiff.getImage();
          const width = image.getWidth();
          const height = image.getHeight();
          const tileWidth = image.getTileWidth();
          const tileHeight = image.getTileHeight();
          const samplesPerPixel = image.getSamplesPerPixel();

          const [ originX, originY ] = image.getOrigin();
          const [ xSize, ySize ] = image.getResolution();
          const uWidth = xSize * width;
          const uHeight = ySize * height;

          const geoKeys = image.getGeoKeys(); // Get geokeys

          const projObj = geotiffGeokeysToProj4.toProj4( geoKeys ); // Convert geokeys to proj4 string

          const sourceProjection = "WGS84"
          const destinationProjection = projObj.proj4;

          // Convert the bounding box coordinates to the TIFF image projection system
          const projCenter = proj4(sourceProjection, destinationProjection, [center.lng, center.lat]);

          const percentX = ( projCenter[0] - originX ) / uWidth;
          const percentY = ( projCenter[1] - originY ) / uHeight;

          const pixelX = Math.floor( width * percentX );
          const pixelY = Math.floor( height * percentY );

          const B04data = await image.readRasters({ window: [ pixelX, pixelY, pixelX + 1, pixelY + 1] });
          // const [B04] = data;
          
          const B08Url = feature.assets.B08.href;
          const B08tiff = await fromUrl(B08Url);
          const B08image = await B08tiff.getImage();
          const B08data = await B08image.readRasters({ window: [ pixelX, pixelY, pixelX + 1, pixelY + 1] });
          // const [B08] = data;

          // access cloud and shadow mask
          const SCLUrl = feature.assets.cloud.href;
          const SCLtiff = await fromUrl(SCLUrl);
          const SCLimage = await SCLtiff.getImage();
      
          // since the cloud mask is 60m resolution, we need to recalculate the window
          const [ CoriginX, CoriginY ] = SCLimage.getOrigin();
          const [ CxSize, CySize ] = SCLimage.getResolution();
          const Cwidth = SCLimage.getWidth();
          const Cheight = SCLimage.getHeight();

          const CuWidth = CxSize * Cwidth;
          const CuHeight = CySize * Cheight;

          const CpercentX = ( projCenter[0] - CoriginX ) / CuWidth;
          const CpercentY = ( projCenter[1] - CoriginY ) / CuHeight;

          const CpixelX = Math.floor( Cwidth * CpercentX );
          const CpixelY = Math.floor( Cheight * CpercentY );
    
          const SCLdata = await SCLimage.readRasters({ window: [ CpixelX, CpixelY, CpixelX + 1, CpixelY + 1]});

          
          // const SCLdata = await SCLimage.readRasters({ window: [ pixelX/6, pixelY/6, pixelX/6 + 1, pixelY/6 + 1] });
          // const SCLdata = await SCLimage.readRasters({ window: [ pixelX, pixelY, pixelX + 1, pixelY + 1] });

          // console.log(feature.assets.cloud.href);
          let NDVI;
          if (SCLdata[0][0] < 40 && B04data[0][0] > 0 && B08data[0][0] > 0) {
            const B04 = B04data[0][0] * 0.0001;
            const B08 = B08data[0][0] * 0.0001;
            NDVI = (B08 - B04) / (B08 + B04);
          } else {
            NDVI = null;
          }

          // console.log(NDVI);
          // Append the datetime and pixel value to the arrays
          const datetime = feature.properties.datetime;
          datetimeList.push(datetime);
          pixelValueList.push(NDVI);
          featureList.push(feature);
        }));

      } else {
        throw new Error('Error fetching data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }

    const combinedList = datetimeList.map((datetime, index) => {
      return { datetime: datetime, pixelValue: pixelValueList[index], feature: featureList[index]};
    });

    
    const sortedCombinedList = combinedList.slice().sort((a, b) => {
      if (a.datetime < b.datetime) {
        return -1;
      } else if (a.datetime > b.datetime) {
        return 1;
      } else {
        return 0;
      }
    });

    // const sortedPixelValues = sortedCombinedList.map((item) => item.pixelValue);
    // const sortedDatetimeList = sortedCombinedList.map((item) => item.datetime);
    
    const filteredPixelValues = [];
    const filteredDatetimeList = [];
    const filteredFeatures = [];
    
    sortedCombinedList.forEach((item) => {
      if (item.pixelValue !== null) {
        filteredPixelValues.push(item.pixelValue);
        filteredDatetimeList.push(item.datetime);
        filteredFeatures.push(item.feature);
      }
    });
    // create colors list by repeat 'rgba(255,127,80, 0.9)' for the length of the filteredPixelValues
    let originalMarkerColor = 'rgba(6, 133, 244, 0.8)';
    const colors = Array(filteredPixelValues.length).fill(originalMarkerColor);
    const sizes = Array(filteredPixelValues.length).fill(5);

    const trace = {
      x: filteredDatetimeList,
      y: filteredPixelValues,
      type: 'scatter',
      mode: 'lines+markers',

      connectgaps: false, // Add this line
      marker: {
        size: sizes,
        color: colors // Change color here
      },
      line: {
        color: originalMarkerColor,
        width: 2
      },
      customdata: filteredFeatures
    };
    
    const layout = {
      width: previewBoxWidth - 40,
      height: previewBoxWidth*0.5,
      margin: { t: 50, b: 50, autoexpand: true },
      xaxis: {
        title: 'Date',
        // tickfont: {
        //   color: '#ffffff'
        // },
        showgrid: false
      },
      yaxis: {
        title: 'Pixel Value',
        range: [0, 1],
        // tickfont: {
        //   color: '#ffffff'
        // },
        showgrid: true
      },
      plot_bgcolor: 'rgba(0,0,0,0.1)',
      paper_bgcolor: 'rgba(0,0,0,0)'
    };
    
    const config = {
      displayModeBar: false // this is the line that hides the bar.
    };
    
    // const timeSeries = document.getElementById('timeSeries');
    const timeSeriesPlot = await Plotly.newPlot(dropDownContainer, [trace], layout, config);// Add click event handler to the plot
  //   timeSeriesPlot.on('plotly_click', (eventData) => {
      
  //     // const pointIndex = eventData.points[0].pointIndex;
  //     const feature = eventData.points[0].customdata;
  //     console.log(feature); // Replace with code to display feature information
  //     const url_to_geotiff_file = feature.assets.boa_overview.href;
  //     const titiler_endpoint = "https://titiler.xyz";
  //     var titilerURL = `${titiler_endpoint}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${url_to_geotiff_file}`;
  //     const geoTiffLayer = L.tileLayer(titilerURL, {
  //       maxZoom: 15,
  //       minZoom: 5,
  //       attribution: 'NCEO ARD'
  //     }).addTo(map);
  //     layerControl.addOverlay(geoTiffLayer, feature.id);
  //     addedGeoTiffLayers.push(geoTiffLayer);
  //     // map.fitBounds(layer.getBounds(), {padding: [0, 0]});
  //     // updateFieldAnalysisButtonVisibility(geoTiffLayer);

  //   });


  let changedColor = 'rgba(243, 255, 10, 0.8)';
  

  timeSeriesPlot.on('plotly_click', (eventData) => {
    const clickedMarker = eventData.points[0];
    const clickedFeature = clickedMarker.customdata;
    
    const url_to_geotiff_file = clickedFeature.assets.boa_overview.href;
    const titiler_endpoint = "https://titiler.xyz";
    const titilerURL = `${titiler_endpoint}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${url_to_geotiff_file}`;

    
    const pn = eventData.points[0].pointNumber;
    const tn = eventData.points[0].curveNumber;

    if (colors[pn] === changedColor) {
      colors[pn] = originalMarkerColor;
      sizes[pn] = 5;
      addedGeoTiffLayers.forEach(layer => {
        // console.log(layer._url === titilerURL, layer._url);
        if (layer._url === titilerURL) {
          layerControl.removeLayer(layer);
          map.removeLayer(layer);
          const layerIndex = addedGeoTiffLayers.indexOf(layer);
          if (layerIndex !== -1) {
            addedGeoTiffLayers.splice(layerIndex, 1);
          }
        }
      });
      var update = {'marker':{color: colors, size: sizes}};
      Plotly.restyle(dropDownContainer, update, [tn]);
    }else{
      colors[pn] = changedColor;
      sizes[pn] = 10;
      const geoTiffLayer = L.tileLayer(titilerURL, {
        maxZoom: 15,
        minZoom: 5,
        attribution: 'NCEO ARD'
      }).addTo(map);
      layerControl.addOverlay(geoTiffLayer, clickedFeature.id);
      addedGeoTiffLayers.push(geoTiffLayer);
      var update = {'marker':{color: colors, size: sizes}};
      Plotly.restyle(dropDownContainer, update, [tn]);
    }
  });

    dropDownContainer.querySelector('.loading-spinner').remove();
  }
  

  
  

  // timeDot.onclick = () => {


  //   // Add code to handle onclick event for time dots here
  //   console.log(`Clicked on: ${datetime}`);
    

    
  //   var currentColor = timeDot.style.backgroundColor;
  //   if (currentColor === 'rgba(243, 255, 10, 0.4)') {
  //     timeDot.style.backgroundColor = 'rgba(6, 133, 244, 0.4)';
  //     timeDot.style.borderColor =  'rgba(6, 133, 244, 0.8)';
  //     console.log(addedGeoTiffLayers);
  //     addedGeoTiffLayers.forEach(layer => {
  //       console.log(layer._url === titilerURL, layer._url);
  //       if (layer._url === titilerURL) {
  //         layerControl.removeLayer(layer);
  //         map.removeLayer(layer);
  //         const layerIndex = addedGeoTiffLayers.indexOf(layer);
  //         if (layerIndex !== -1) {
  //           addedGeoTiffLayers.splice(layerIndex, 1);
  //         }
  //       }
  //     });

  //   } else {

  //     timeDot.style.backgroundColor = 'rgba(243, 255, 10, 0.4)';
  //     timeDot.style.borderColor =  'rgba(243, 255, 10, 0.8)';

  //     const geoTiffLayer = L.tileLayer(titilerURL, {
  //       maxZoom: 15,
  //       minZoom: 5,
  //       attribution: 'NCEO ARD'
  //     }).addTo(map);
  //     layerControl.addOverlay(geoTiffLayer, feature.id);
  //     addedGeoTiffLayers.push(geoTiffLayer);
  //   }

  // };



  function createFeaturePreview(layer) {

    // Create cell div
    const cell = document.createElement('div');
    cell.style.width = '100%';
    cell.style.height = 'auto'; // Set the height to auto
    cell.style.display = 'flex';
    cell.style.flexDirection = 'column'; // Set the flex direction to column
    cell.style.justifyContent = 'center';
    cell.style.alignItems = 'center';

    
    const previewContainer = document.createElement('div');
    previewContainer.style.border = '1px solid #ccc';
    previewContainer.style.borderRadius = '5px';
    previewContainer.style.marginBottom = '5px';
    previewContainer.style.overflow = 'hidden';
    previewContainer.style.transition = 'transform 0.2s, box-shadow 0.2s'; // Add smooth transition effect
  
    previewContainer.style.position = 'static'; // Set the previewContainer's position property to relative
    previewContainer.style.zIndex = '10'; // Set the previewContainer's z-index property to be above other elements
    previewContainer.classList.add('preview-container');
    
    previewContainer.style.width = '98%';
    previewContainer.style.height = '98px';

    // Add hover effect
    previewContainer.onmouseover = function () {
      this.style.position = 'relative'; // Change the position property to relative when hovered
      this.style.zIndex = '1000'; // Set the z-index property to be above other elements when hovered
      this.style.transform = 'scale(1.05)'; // Scale up the container slightly
      this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // Add a subtle box shadow
      this.style.borderColor = '#ffff00'; // Change the border color to yellow
      highlightLayer(layer); // Highlight the layer on the map
    };
  
    // Remove hover effect
    previewContainer.onmouseout = function () {
      this.style.position = 'static'; // Change the position property back to static when the mouse leaves
      this.style.zIndex = '10'; // Set the z-index property back to the default when the mouse leaves
      this.style.transform = 'scale(1)'; // Reset the container scale
      this.style.boxShadow = 'none'; // Remove the box shadow
      this.style.borderColor = '#ccc'; // Change the border color back to the default
      resetLayerStyle(layer); // Reset the layer's appearance on the map
    };

    const mapAspectRatio = map.getSize().x / map.getSize().y;
    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.setAttribute('width', '100%');
    svgContainer.setAttribute('height', '100px');
    // svgContainer.setAttribute('viewBox', '0 0 100 100');
    svgContainer.setAttribute('viewBox', `0 0 ${100 * mapAspectRatio} 100`);
    // svgContainer.setAttribute('viewBox', `0 0 100 ${map.getSize().x / map.getSize().y * 100}`);
    svgContainer.style.backgroundColor = 'rgba(44, 62, 80, 0.8)'; // Darker background with transparency
    previewContainer.appendChild(svgContainer);


    const svgColor = '#3388ff';

    const mapBounds = map.getBounds();
    const viewBoxSize = 100;
  
    const projectedMapCorners = [
      map.project(mapBounds.getNorthWest()),
      map.project(mapBounds.getNorthEast()),
      map.project(mapBounds.getSouthEast()),
      map.project(mapBounds.getSouthWest())
    ];
  
    const minX = Math.min(...projectedMapCorners.map((coord) => coord.x));
    const maxX = Math.max(...projectedMapCorners.map((coord) => coord.x));
    const minY = Math.min(...projectedMapCorners.map((coord) => coord.y));
    const maxY = Math.max(...projectedMapCorners.map((coord) => coord.y));
  
    const xScaleFactor = (viewBoxSize) / (maxX - minX);
    const yScaleFactor = (viewBoxSize) / (maxY - minY);

    if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
      const latLngs = layer.getLatLngs();
      // subtract the min values from the coordinates to make them relative to the map's origin
      // then scale them to fit the viewBox
      // then add the offset to center the map in the viewBox
      const projectedCorners = latLngs[0].map((latLng) => {
        const projected = map.project(latLng);
        return {
          x: (projected.x - minX) * xScaleFactor,
          y: (projected.y - minY) * yScaleFactor,
        };
      });
      const points = projectedCorners
        .map((coord) => {
          return `${coord.x},${coord.y}`;
        })
        .join(' ');
  
      const polygonElement = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygonElement.setAttribute('points', points);
      polygonElement.setAttribute('fill', svgColor);
      polygonElement.setAttribute('stroke', svgColor);
      polygonElement.setAttribute('stroke-width', layer.options.weight);
      svgContainer.appendChild(polygonElement);
    } else if (layer instanceof L.CircleMarker && !(layer instanceof L.Circle)) {
      const latLng = layer.getLatLng();
      const projected = map.project(latLng);
      const xloc = (projected.x - minX) * xScaleFactor;
      const yloc = (projected.y - minY) * yScaleFactor;


      const circleMarker = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circleMarker.setAttribute("cx", xloc);
      circleMarker.setAttribute("cy", yloc);
      circleMarker.setAttribute("r", "3");
      circleMarker.setAttribute("fill", svgColor);
      circleMarker.setAttribute("stroke", svgColor);
      circleMarker.setAttribute("stroke-width", layer.options.weight);
      svgContainer.appendChild(circleMarker);




    } else if (layer instanceof L.Circle) {
      // Handle circle layers
      const latLng = layer.getLatLng();
      const projected = map.project(latLng);
      const xloc = (projected.x - minX) * xScaleFactor;
      const yloc = (projected.y - minY) * yScaleFactor;
      const radius = layer.getRadius() * xScaleFactor * 0.1;

      const circleElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circleElement.setAttribute('cx', xloc);
      circleElement.setAttribute('cy', yloc);
      circleElement.setAttribute('r', radius);
      circleElement.setAttribute('fill', svgColor);
      circleElement.setAttribute('stroke', svgColor);
      circleElement.setAttribute('stroke-width', layer.options.weight);
      svgContainer.appendChild(circleElement);
    } else {
      console.warn('Unsupported layer type for preview');
    }


    layer.on('mouseover', function(event) {
      highlightLayer(layer);
      previewContainer.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
      previewContainer.style.position = 'relative'; // Change the position property to relative when hovered
      previewContainer.style.zIndex = '1000'; // Set the z-index property to be above other elements when hovered
      previewContainer.style.transform = 'scale(1.05)'; // Scale up the container slightly
      previewContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)'; // Add a subtle box shadow
      previewContainer.style.borderColor = '#ffff00'; // Change the border color to yellow
    });
    
    layer.on('mouseout', function(event) {
      resetLayerStyle(layer);
      previewContainer.style.transform = 'scale(1)';
      previewContainer.style.boxShadow = 'none';
      previewContainer.style.borderColor = '#ccc'; // Change the border color back to the default
    });

    const dropDownContainer = document.createElement('div');

    // console.log(layer instanceof L.CircleMarker, layer instanceof L.Circle);
    if (layer instanceof L.Polygon || layer instanceof L.Rectangle || ((layer instanceof L.CircleMarker) && layer instanceof L.Circle)){
      dropDownContainer.classList.add('drop-down-container-polygon');
      dropDownContainer.innerHTML = '<span class="loading-spinner"></span>';
      // dropDownContainer.innerHTML = '<span class="loading-spinner" style="display: flex; justify-content: center; align-items: center;"></span>';
      cell.addEventListener('mouseenter', () => {
        dropDownContainer.style.display = 'grid';
      });
      
      cell.addEventListener('mouseleave', () => {
        dropDownContainer.style.display = 'none';
      });

      fetchDataOverFeature(layer, dropDownContainer);
  
    } else if (layer instanceof L.CircleMarker){
      
      dropDownContainer.classList.add('drop-down-container-circle-marker');
      dropDownContainer.innerHTML = '<span class="loading-spinner"></span>';
      // dropDownContainer.innerHTML = '<span class="loading-spinner" style="display: flex; justify-content: center; align-items: center; width: 100%"></span>';
      cell.addEventListener('mouseenter', () => {
        dropDownContainer.style.display = 'block';
      });
      
      let timeoutId;

      cell.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
        dropDownContainer.style.display = 'block';
      });

      cell.addEventListener('mouseleave', () => {
        timeoutId = setTimeout(() => {
          dropDownContainer.style.display = 'none';
        }, 500); // 500 milliseconds delay
      });
      
      // cell.addEventListener('mouseleave', () => {
      //   dropDownContainer.style.display = 'none';
      // });
      
      fetchDataTS(layer, dropDownContainer)
      
    }
    
    cell.appendChild(previewContainer);
    // Append the drop-down container to the preview container
    cell.appendChild(dropDownContainer);  

    return cell;
  }

  const featuresPreviews = document.getElementById('features-previews');
  // featuresPreviews.style.maxHeight = '350px'; // set the maximum height
  // featuresPreviews.style.overflowY = 'auto'; // make the container scrollable

  let addedLayerIds = []; // keep track of the layer ids that have already been added

  function updateFeaturesList(featureGroup) {
    if (featureGroup.getLayers().length === 0) {
      // no layers in the feature group
      // featuresPreviews.innerHTML = '<p>No features drawn on the map.</p>';
      // remove all the features from the list
      featuresPreviews.innerHTML = '';
      return;
    }
  
    // create a document fragment to avoid multiple reflows when appending elements
    const fragment = document.createDocumentFragment();
  
    featureGroup.eachLayer((layer) => {
      if (!addedLayerIds.includes(layer._leaflet_id)) {
        // this layer has not been added to the list yet
        const featurePreview = createFeaturePreview(layer);
        fragment.appendChild(featurePreview);
        addedLayerIds.push(layer._leaflet_id);
      }
    });
  
    featuresPreviews.appendChild(fragment);
    featuresPreviews.scrollTop = featuresPreviews.scrollHeight;
  }

  // function updateFeaturesList(featureGroup) {
  //   featuresPreviews.innerHTML = '';

  //   if (featureGroup.getLayers().length > 0) {
  //     featureGroup.eachLayer((layer) => {
  //       const featurePreview = createFeaturePreview(layer);
  //       // const featurePreview = createPolygonPreview(layer);
  //       featuresPreviews.appendChild(featurePreview);
  //       featuresPreviews.scrollTop = featuresPreviews.scrollHeight;
  //     });
  //   } else {
  //     const noFeaturesMessage = document.createElement('p');
  //     noFeaturesMessage.textContent = 'No features drawn on the map.';
  //     featuresPreviews.appendChild(noFeaturesMessage);
  //   }
  // }
  
  // Declare featureGroup in the outer scope
  let featureGroup;

  function enableDrawing(map) {
    // Initialize the feature group for storing the polygons
    if (!featureGroup) {
      featureGroup = new L.FeatureGroup();
    }
  
    if (!map.hasLayer(featureGroup)) {
      featureGroup.addTo(map);
    }
    var MyCustomMarker = L.Icon.extend({
      options: {
          shadowUrl: null,
          iconAnchor: new L.Point(12, 12),
          iconSize: new L.Point(24, 24),
          // iconUrl: 'link/to/image.png'
      }
    });
    
    if (!drawControl) {
      const drawOptions = {
        draw: {
          polygon: {
            allowIntersection: false, // Prevent overlapping polygons
            showArea: true, // Show the area of the polygon in the tooltip
            metric: true, // Use metric measurement units
            shapeOptions: {
              color: '#007bff', // Set the polygon color
              weight: 2 // Set the polygon border width
            }
          },
          circle: true, // Disable other shapes
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
          remove: true // Allow deleting polygons
        }
      };
      drawControl = new L.Control.Draw(drawOptions);
      map.addControl(drawControl);
      // Initialize the Leaflet.draw plugin
      // var drawControl = new L.Control.Draw().addTo(map);
  
  

    } else {
      drawControl.options.edit.featureGroup = featureGroup;
    }
  }
    // Add event listeners for the draw, edit, and delete events
    map.on('draw:created', function(event) {
      featureGroup.addLayer(event.layer);
      updateFeaturesList(featureGroup);
    });

    map.on('draw:edited', function(event) {
      var layers = event.layers;
      layers.eachLayer(function(layer) {
        featureGroup.addLayer(layer);
        updateFeaturesList(featureGroup);
      });
    });

    map.on('draw:deleted', function(event) {
      var layers = event.layers;
      layers.eachLayer(function(layer) {
        featureGroup.removeLayer(layer);
        updateFeaturesList(featureGroup);
      });
    });
    
  function disableDrawing(map) {
    if (drawControl) {
      map.removeControl(drawControl);
      drawControl = null;
    }
  }
  
  function enableClick(map) {
    clickEvent = map.on('click', function (e) {
      // showTimeSeriesData(e.latlng);
    });
  }
  
  function disableClick(map) {
    if (clickEvent) {
      map.off('click', clickEvent);
    }
  }
  map.on('zoomend', function () {
    handleZoomChange(map);
  });



  // let imageOverlayGroup = L.layerGroup();
  // let geojsonLayer = null; // Move this outside the fetchSatelliteImages function

  function fetchSatelliteImages(searchOptions) {
    const searchResults = document.getElementById('search-results');
    let highlightedResult = null;
    const stacApiSearchUrl = 'https://192.171.169.103/search';
  
    // // Clear search results and remove layers
    searchResults.innerHTML = "";
    map.eachLayer(function(layer) {
      if (layer !== basemap) {
        map.removeLayer(layer);
      }
    });
  
    let imageOverlayGroup = L.layerGroup();
        // Store the original view settings
    const originalView = {
      center: map.getCenter(),
      zoom: map.getZoom(),
    };


    fetch(stacApiSearchUrl, searchOptions)
      .then(response => response.json())
      .then(data => {
        const items = data.features;
        // const imageOverlayGroup = L.layerGroup();
        const geojsonLayer = L.geoJSON(items, {
          style: {
            color: '#3388ff',
            weight: 1,
            fillOpacity: 0
          },
          onEachFeature: function(feature, layer) {
            if (feature.links && feature.links.length > 0) {
              const selfURL = feature.links[3].href;
              const httpsURL = selfURL.replace('http://', 'https://').replace(':8080', '');
              fetch(httpsURL)
                .then(response => response.json())
                .then(data => {
                  const previewUrl = data.assets.BOA_thumbnal.href;
                  // const bounds = layer.getBounds();
                  // const imageOverlay = L.imageOverlay(previewUrl, bounds);
                  // imageOverlayGroup.addLayer(imageOverlay);
                  
                  //  get topleft, topright, bottomleft coordinates from data.geometry.coordinates[0] swap lat and long
                  var topleft = [data.geometry.coordinates[0][0][1], data.geometry.coordinates[0][0][0]],
                      topright = [data.geometry.coordinates[0][1][1], data.geometry.coordinates[0][1][0]],
                      bottomleft = [data.geometry.coordinates[0][3][1], data.geometry.coordinates[0][3][0]];

                  var imageOverlay = L.imageOverlay.rotated(previewUrl, topleft, topright, bottomleft, {
                    opacity: 1,
                    interactive: true,
                    attribution: "Historical building plan &copy; <a href='http://www.ign.es'>Instituto Geográfico Nacional de España</a>"
                  });
                  
                  // map.addLayer(imageOverlay);
                  imageOverlayGroup.addLayer(imageOverlay);
                  
                  const title = feature.id;
                  const date = new Date(feature.properties.datetime).toDateString();
                  const cloudCover = feature.properties['eo:cloud_cover'];
  
                  const searchResult = document.createElement('div');
                  searchResult.innerHTML = `
                    <div class="search-result-item">
                      <img src="${previewUrl}" alt="${title}" class="search-result-thumbnail">
                      <div class="search-result-info">
                        <div class="search-result-title">${title}</div>
                        <div class="search-result-date">${date}</div>
                        <div class="search-result-cloud-cover">
                          <span class="search-result-cloud-value">☁️    ${cloudCover.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  `;
                  let searchResultClicked = false;

                  searchResult.addEventListener('mouseenter', function() {
                    searchResultClicked = false;
                    layer.bringToFront()
                    const timeDots = timeBarContainer.querySelectorAll('.time-dot');
                    timeDots.forEach(dot => {
                      dot.remove();
                    });
                    analysisPanel.classList.add('hidden');

                    // test feature group exists
                    // and if it does, remove its layers
                    if (featureGroup) {
                      console.log(featureGroup)
                      featureGroup.eachLayer((layer) => {
                        map.removeLayer(layer);
                      });
                    }
                    
                    addedGeoTiffLayers.forEach((geoTiffLayer) =>{
                      layerControl.removeLayer(geoTiffLayer)
                      map.removeLayer(geoTiffLayer)
                    })
                    if (highlightedResult) {
                      highlightedResult.classList.remove('highlighted');
                      const layerID = highlightedResult.getAttribute('layerID');
                      const layer = geojsonLayer.getLayer(layerID);
                      geojsonLayer.resetStyle(layer);
                    }
                    imageOverlay.bringToFront()
                    layer.setStyle({
                      color: 'yellow',
                      weight: 2
                    });
                    searchResult.classList.add('highlighted');
                    highlightedResult = searchResult;
                    map.addLayer(imageOverlay)
                    map.flyTo(imageOverlay.getBounds().getCenter(), 9);
                    // map.setZoom(7);
                  });

                  searchResult.addEventListener('mouseleave', function () {
                    const layerID = searchResult.getAttribute('layerID');
                    const layer = geojsonLayer.getLayer(layerID);
                    geojsonLayer.resetStyle(layer);
                    searchResult.classList.remove('highlighted');
                    highlightedResult = null;
                    map.removeLayer(imageOverlay);
                    
                    setTimeout(() => {
                      // ... (the rest of your mouseout code remains the same)
                  
                      // If no search result is highlighted, fly back to the original view
                    // If no search result is highlighted and none has been clicked, fly back to the original view
                    if (!highlightedResult && !searchResultClicked) {
                      map.flyTo(originalView.center, originalView.zoom);
                      addedGeoTiffLayers.forEach((geoTiffLayer) =>{
                        layerControl.removeLayer(geoTiffLayer)
                        map.removeLayer(geoTiffLayer)
                      })
                      
                    }
                    }, 500);

                  });
  
                  searchResults.appendChild(searchResult);
  
                  layer.on('mouseover', function(e) {
                    if (searchResultClicked) {
                      return;
                    }
                    if (highlightedResult) {
                      highlightedResult.classList.remove('highlighted');
                      const layerID = highlightedResult.getAttribute('layerID');
                      const layer = geojsonLayer.getLayer(layerID);
                      geojsonLayer.resetStyle(layer);
                    }

                    map.addLayer(imageOverlay);
                    imageOverlay.bringToFront();
                    searchResult.classList.add('highlighted');
                    
                    layer.setStyle({
                      color: 'yellow',
                      weight: 2
                    });
                    
                    highlightedResult = searchResult;

                    highlightedResult.scrollIntoView({
                      behavior: 'smooth'
                    });
                  });

                  layer.addEventListener('mouseout', function() {
                    const layerID = searchResult.getAttribute('layerID');
                    const layer = geojsonLayer.getLayer(layerID);
                    geojsonLayer.resetStyle(layer);
                    searchResult.classList.remove('highlighted');
                    highlightedResult = null;
                    map.removeLayer(imageOverlay);
                  });

                  let removedLayers = [];
                  let previousBounds = null;
                  let previousZoom = null;

                  function addedGeoTiffLayer() {
                    // Store the current bounds and zoom level
                    map.removeLayer(imageOverlay)
                    searchResultClicked = true;
                    addedGeoTiffLayers.forEach((geoTiffLayer) =>{
                      layerControl.removeLayer(geoTiffLayer)
                      map.removeLayer(geoTiffLayer)
                    })
                    layer.bringToFront()

                    const timeBarContainer = document.getElementById('timeBarContainer');

                    const timeDots = timeBarContainer.querySelectorAll('.time-dot');
                    timeDots.forEach(dot => {
                      dot.remove();
                    });
                    

                    previousBounds = geojsonLayer.getBounds();
                    // previousZoom = map.getZoom();
                  
                    // map.eachLayer(function (layer) {
                    //   if (layer !== basemap && layer !== featureGroup && layer !== geojsonLayer){
                    //     removedLayers.push(layer);
                    //     map.removeLayer(layer);
                    //   }
                    // });
                    // remove features and previews
                    featureGroup = null;
                    featuresPreviews.innerHTML = '';
                    // Show the second button
                    document.getElementById('back-to-search-results').style.display = 'inline-block';
                  
                    const url_to_geotiff_file = data.assets.boa_overview.href;
                    var titiler_endpoint = "https://titiler.xyz"; // Developmentseed Demo endpoint. Please be kind.
                    // var titiler_endpoint = "http://192.171.169.103:8000";
                    // titiler url
                    var titilerURL = `${titiler_endpoint}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${url_to_geotiff_file}`;
                    const geoTiffLayer = L.tileLayer(titilerURL, {
                      maxZoom: 15,
                      minZoom: 5,
                      attribution: 'NCEO ARD'
                    }).addTo(map);
                    map.fitBounds(layer.getBounds(), {padding: [0, 0]});
                    updateFieldAnalysisButtonVisibility(geoTiffLayer);
                    layerControl.addOverlay(geoTiffLayer, data.id);
                    addedGeoTiffLayers.push(geoTiffLayer)
                  }


                  searchResult.addEventListener('click', addedGeoTiffLayer);
                  // layer.addEventListener('click', addedGeoTiffLayer);
                  

                  document.getElementById('back-to-search-results').addEventListener('click', function () {
                    // Hide the second button
                    searchResultClicked = false;
                    this.style.display = 'none';
                    // Restore the previous bounds and zoom level smoothly
                    if (previousBounds) {
                      // map.setZoom(previousZoom);
                      // map.flyToBounds(previousBounds, {duration: 0.1});
                      map.fitBounds(previousBounds)
                    }
                    removedLayers.forEach(function (layer) {
                      layer.addTo(map);
                    });
                    updateFieldAnalysisButtonVisibility(null);
                    // Clear the removedLayers array
                    removedLayers = [];
                    
                    addedGeoTiffLayers.forEach((geoTiffLayer) =>{
                      layerControl.removeLayer(geoTiffLayer)
                      map.removeLayer(geoTiffLayer)
                    })
                    
                    const timeBarContainer = document.getElementById('timeBarContainer');

                    const timeDots = timeBarContainer.querySelectorAll('.time-dot');
                    timeDots.forEach(dot => {
                      dot.remove();
                    });
                    

                    
                  });
                  
                
                })
                .catch(error => console.error(error));
            }
          }
        });
        // imageOverlayGroup.addTo(map);
        if (items.length > 0) {
          // map.fitBounds(geojsonLayer.getBounds());
        }
        geojsonLayer.addTo(map);
      })
      .catch(error => console.error(error));
    }
  

  // Throttle function
  function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function (...args) {
      if (!lastRan) {
        func.apply(this, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }
  var bounds = map.getBounds()
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

  // Initialize searchBody
  let searchBody = {
    "collections": ["UK-sentinel-2"],
    "bbox": bbox,
    "limit": 50,
    "datetime": selectedDateRange,
    "intersects": null,
    "query": {
      "eo:cloud_cover": {
        "lt": cloudCoverInput.value
      },
      // "sentinel:MGRS tile": {
      //   "unique": true,
      //   "eq": null
      // }
    },
    "sort": [
      {
        "field": "eo:cloud_cover",
        "direction": "desc"
      }
    ]
  
  };
  
  var searchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchBody)
  }


  let isUpdatingFromFetch = false;
  // Throttle the fetchSatelliteImages function with a 500ms limit
  const throttledFetchSatelliteImages = throttle(function (searchOptions) {
    isUpdatingFromFetch = true;
    fetchSatelliteImages(searchOptions);
    isUpdatingFromFetch = false;
  }, 500);

  throttledFetchSatelliteImages(searchOptions);
  // Create a Proxy handler for the searchBody
  const searchBodyHandler = {
    set: function (target, property, value) {
      if (isUpdatingFromFetch) {
        target[property] = value;
        return true;
      }

      target[property] = value;

      // Update searchOptions
      searchOptions.body = JSON.stringify(searchBody);

      // Trigger throttled fetchSatelliteImages function
      throttledFetchSatelliteImages(searchOptions);

      return true;
    }
  };

  // Create a Proxy for the searchBody
  const searchBodyProxy = new Proxy(searchBody, searchBodyHandler);
  

  cloudCoverInput.addEventListener('input', function (event) {
    document.getElementById('cloud-cover-value').textContent = event.target.value + '%';
    
    var bounds = map.getBounds()
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    searchBodyProxy.query = {"eo:cloud_cover": {"lt": event.target.value}};
    searchBodyProxy.bbox = bbox;
    // console.log(searchBodyProxy.query);
  });


  document.getElementById('search-button').addEventListener('click', function() {
    var bounds = map.getBounds()
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    searchBodyProxy.query = {"eo:cloud_cover": {"lt": cloudCoverInput.value}};
    searchBodyProxy.bbox = bbox;
    searchBodyProxy.datetime = selectedDateRange;

  });

  // // Disable the draw, edit, and delete tools when the map is clicked
  // map.on('click', function() {
  //   drawControl._toolbars.draw._modes.polygon.handler.disable();
  //   drawControl._toolbars.edit._modes.edit.handler.disable();
  //   drawControl._toolbars.edit._modes.remove.handler.disable();
  // });



})

