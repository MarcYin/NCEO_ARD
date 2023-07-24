// const { fromUrl, fromUrls, fromArrayBuffer, fromBlob } = GeoTIFF;
// import geotiffGeokeysToProj4 from 'https://cdn.skypack.dev/geotiff-geokeys-to-proj4';
import * as mapFunction from'./mapFunctions.js';
import * as featureFunction from './featureFunctions.js';
import {fetchSatelliteImages, updateFieldAnalysisButtonVisibility} from './fetchSatelliteImages.js';

document.addEventListener("DOMContentLoaded", async () => { 
  // Define an array of colormap options
  // <!-- "accent""accent_r""afmhot""afmhot_r""autumn""autumn_r""binary""binary_r""blues""blues_r""bone""bone_r""brbg""brbg_r""brg""brg_r""bugn""bugn_r""bupu""bupu_r""bwr""bwr_r""cfastie""cividis""cividis_r""cmrmap""cmrmap_r""cool""cool_r""coolwarm""coolwarm_r""copper""copper_r""cubehelix""cubehelix_r""dark2""dark2_r""flag""flag_r""gist_earth""gist_earth_r""gist_gray""gist_gray_r""gist_heat""gist_heat_r""gist_ncar""gist_ncar_r""gist_rainbow""gist_rainbow_r""gist_stern""gist_stern_r""gist_yarg""gist_yarg_r""gnbu""gnbu_r""gnuplot""gnuplot2""gnuplot2_r""gnuplot_r""gray""gray_r""greens""greens_r""greys""greys_r""hot""hot_r""hsv""hsv_r""inferno""inferno_r""jet""jet_r""magma""magma_r""nipy_spectral""nipy_spectral_r""ocean""ocean_r""oranges""oranges_r""orrd""orrd_r""paired""paired_r""pastel1""pastel1_r""pastel2""pastel2_r""pink""pink_r""piyg""piyg_r""plasma""plasma_r""prgn""prgn_r""prism""prism_r""pubu""pubu_r""pubugn""pubugn_r""puor""puor_r""purd""purd_r""purples""purples_r""rainbow""rainbow_r""rdbu""rdbu_r""rdgy""rdgy_r""rdpu""rdpu_r""rdylbu""rdylbu_r""rdylgn""rdylgn_r""reds""reds_r""rplumbo""schwarzwald""seismic""seismic_r""set1""set1_r""set2""set2_r""set3""set3_r""spectral""spectral_r""spring""spring_r""summer""summer_r""tab10""tab10_r""tab20""tab20_r""tab20b""tab20b_r""tab20c""tab20c_r""terrain""terrain_r""twilight""twilight_r""twilight_shifted""twilight_shifted_r""viridis""viridis_r""winter""winter_r""wistia""wistia_r""ylgn""ylgn_r""ylgnbu""ylgnbu_r""ylorbr""ylorbr_r""ylorrd""ylorrd_r" -->
        
  let colormapOptions = [
    "accent", "accent_r", "afmhot", "afmhot_r", "autumn", "autumn_r", 
    "binary", "binary_r", "blues", "blues_r", "bone", "bone_r", 
    "brbg", "brbg_r", "brg", "brg_r", "bugn", "bugn_r", "bupu", 
    "bupu_r", "bwr", "bwr_r", "cfastie", "cividis", "cividis_r", 
    "cmrmap", "cmrmap_r", "cool", "cool_r", "coolwarm", "coolwarm_r", 
    "copper", "copper_r", "cubehelix", "cubehelix_r", "dark2", "dark2_r", 
    "flag", "flag_r", "gist_earth", "gist_earth_r", "gist_gray", 
    "gist_gray_r", "gist_heat", "gist_heat_r", "gist_ncar", "gist_ncar_r", 
    "gist_rainbow", "gist_rainbow_r", "gist_stern", "gist_stern_r", 
    "gist_yarg", "gist_yarg_r", "gnbu", "gnbu_r", "gnuplot", "gnuplot2", 
    "gnuplot2_r", "gnuplot_r", "gray", "gray_r", "greens", "greens_r", 
    "greys", "greys_r", "hot", "hot_r", "hsv", "hsv_r", "inferno", 
    "inferno_r", "jet", "jet_r", "magma", "magma_r", "nipy_spectral", 
    "nipy_spectral_r", "ocean", "ocean_r", "oranges", "oranges_r", "orrd", 
    "orrd_r", "paired", "paired_r", "pastel1", "pastel1_r", "pastel2", 
    "pastel2_r", "pink", "pink_r", "piyg", "piyg_r", "plasma", "plasma_r", 
    "prgn", "prgn_r", "prism", "prism_r", "pubu", "pubu_r", "pubugn", 
    "pubugn_r", "puor", "puor_r", "purd", "purd_r", "purples", "purples_r", 
    "rainbow", "rainbow_r", "rdbu", "rdbu_r", "rdgy", "rdgy_r", "rdpu", 
    "rdpu_r", "rdylbu", "rdylbu_r", "rdylgn", "rdylgn_r", "reds", "reds_r", 
    "rplumbo", "schwarzwald", "seismic", "seismic_r", "set1", "set1_r", 
    "set2", "set2_r", "set3", "set3_r", "spectral", "spectral_r", "spring", 
    "spring_r", "summer", "summer_r", "tab10", "tab10_r", "tab20", 
    "tab20_r", "tab20b", "tab20b_r", "tab20c", "tab20c_r", "terrain", 
    "terrain_r", "twilight", "twilight_r", "twilight_shifted", 
    "twilight_shifted_r", "viridis", "viridis_r", "winter", "winter_r", 
    "wistia", "wistia_r", "ylgn", "ylgn_r", "ylgnbu", "ylgnbu_r", "ylorbr", 
    "ylorbr_r", "ylorrd", "ylorrd_r"
  ];

  // Get a reference to the select element
  // let colormapSelect = document.getElementById('colormap-selection');

    
  // Get a reference to the datalist element
  let colormapDatalist = document.getElementById('colormaps');

  // Loop through the array and create an option for each colormap
  for (let i = 0; i < colormapOptions.length; i++) {
      // Create a new option element
      let option = document.createElement('option');

      // Set the value of the option
      option.value = colormapOptions[i];

      // Add the option to the datalist element
      colormapDatalist.appendChild(option);
  }

  const fieldAnalysisButton = document.getElementById('field-analysis-button');
  // const analysisMessage = document.getElementById('analysis-message');
  const analysisPanel = document.getElementById('analysis-panel');
  
  // Select the colormap input field
  let colormapInput = document.getElementById('colormap-selection');
  let selectedColormap = colormapInput.value;
  // Select the input field
  let expressionInput = document.getElementById('expression-input');
  let expression = encodeURIComponent(expressionInput.value);

  const titilerConfig = {
    expression: expression,
    colormap: selectedColormap,
    rescale: '0,10000',
    resample: 'bilinear',
    color_formula: 'Gamma R 3.5, Gamma G 3.5, Gamma B 3.5',
  };

  // Add an event listener for the input event
  colormapInput.addEventListener('input', function(event) {
    // Get the new value of the input field
    selectedColormap = event.target.value;
    titilerConfig.colormap = selectedColormap;
    // console.log(titilerConfig);
  });



  // Add an event listener for the input event
  expressionInput.addEventListener('input', function(event) {
    // Get the new value of the input field
    expression = encodeURIComponent(event.target.value);
    titilerConfig.expression = expression;
    // console.log(titilerConfig);
    // Now do something with the new expression
    // For example, you can call a function that uses this expression
  });

  
  let previewBoxWidth;
  let previewBoxHeight;
  const fieldAnalysisZoom = 13;
  var featureGroup = mapFunction.getFeatureGroup();
  let featuresPreviews = document.getElementById('features-previews');

  // const expression = encodeURIComponent('(B8A-B04)/(B8A+B04)*(cloud<40)');
  


  fieldAnalysisButton.addEventListener('click', () => {
    if (fieldAnalysisButton.disabled) {
      // analysisMessage.style.display = 'inline';
    } else {
      // analysisMessage.style.display = 'none';
      analysisPanel.classList.remove('hidden');
      const currentCenter = map.getCenter();
      map.setZoom(fieldAnalysisZoom);
      map.panTo(currentCenter);
      // const previewBoxRect = analysisPanel.getBoundingClientRect();
      // previewBoxWidth = previewBoxRect.width;
      // previewBoxHeight = previewBoxRect.height;
    
      // console.log(previewBoxWidth, previewBoxHeight);
    
    }
  });

  let addedGeoTiffLayers = [];

  
  // Initially hide the Field Analysis button
  updateFieldAnalysisButtonVisibility(null, analysisPanel);

  /**
   * Returns the start and end date of the current year
   * @returns {Array} - An array containing the start and end date of the current year
   */
  function getDefaultDateRange() {
    const defaultDateStart = new Date();
    defaultDateStart.setDate(1);
    defaultDateStart.setMonth(0);
    defaultDateStart.setHours(0, 0, 0, 0);

    const defaultDateEnd = new Date();
    defaultDateEnd.setDate(defaultDateEnd.getDate() - 16);
    defaultDateEnd.setHours(23, 59, 59, 999);

    return [
      defaultDateStart.toISOString().split('T')[0],
      defaultDateEnd.toISOString().split('T')[0]
    ];
  }

  /**
   * Creates a tick element and appends it to the container
   * @param {string} label - The label for the tick
   * @param {Element} container - The container to append the tick to
   * @param {number} percentage - The percentage position for the tick
   */
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

  /**
   * Adds ticks to the ticksContainer for each month between startDate and endDate
   * @param {Date} startDate - The start date
   * @param {Date} endDate - The end date
   */
  function addTicks(startDate, endDate) {
    const ticksContainer = document.getElementById('ticksContainer');
    ticksContainer.innerHTML = '';

    const totalDuration = endDate.getTime() - startDate.getTime();
    let currentDate = new Date(startDate);

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

  /**
   * Returns the start and end date for a six month period centered around the given date
   * @param {Date} date - The date around which to center the six month period
   * @returns {Array} - An array containing the start and end date of the six month period
   */
  function getSixMonthPeriod(date) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const startDate = new Date(date.getTime() - 6 * 30 * millisecondsPerDay);
    const endDate = new Date(date.getTime() + 6 * 30 * millisecondsPerDay);

    return [startDate, endDate];
  }

  const dateRangeInput = document.getElementById("date-range");
  const cloudCoverInput = document.getElementById('cloud-cover-slider')

  const [defaultDateStart, defaultDateEnd] = getDefaultDateRange();
  let selectedDateRange = `${defaultDateStart}T00:00:00Z/${defaultDateEnd}T23:59:59Z`;
  addTicks(new Date(defaultDateStart), new Date(defaultDateEnd));

  // Initialize Flatpickr with the range calendar plugin
  var dateSelection = flatpickr(dateRangeInput, {
    mode: "range",
    dateFormat: "Y-m-d",
    defaultDate: [defaultDateStart, defaultDateEnd],
    enable: [
      {
        from: "2017-01-01",
        to: defaultDateEnd,
      }
    ],
    onClose: function (selectedDates, dateStr, instance) {
      if (dateStr.includes("to")) {
        selectedDateRange = dateStr.replace(" to ", "T00:00:00Z/") + "T23:59:59Z";
      } else {
        selectedDateRange = dateStr + "T00:00:00Z/" + dateStr + "T23:59:59Z";
      }
      const selectedStartDate = new Date(selectedDateRange.slice( 0,10))
      const selectedEndDate   = new Date(selectedDateRange.slice(21,31)) 
      console.log(selectedDateRange);
      // searchBodyProxy.datetime = selectedDateRange;
      // const [selectedStartDate, selectedEndDate] = getSixMonthPeriod(new Date(selectedDates[0]));
      addTicks(selectedStartDate, selectedEndDate);
    }
  });

  /**
   * Function to handle the change of zoom level on the map.
   * It enables or disables the drawing and clicking capabilities based on the zoom level.
   * @param {Object} map - The map object.
   */
  function handleZoomChange(map) {
    const zoomLevel = map.getZoom();

    if (zoomLevel >= fieldAnalysisZoom) {
      mapFunction.enableDrawing(map);
      mapFunction.enableClick(map);
      analysisPanel.classList.remove('hidden');
      // get analysis panel width and height
      const previewBoxRect = analysisPanel.getBoundingClientRect();
      previewBoxWidth = previewBoxRect.width;
      previewBoxHeight = previewBoxRect.height;
      // console.log(previewBoxWidth, previewBoxHeight);
    } else {
      mapFunction.disableDrawing(map);
      mapFunction.disableClick(map);
      analysisPanel.classList.add('hidden');
    }
  }



  // Basic OSM Leaflet map setup
  let map = L.map('map', {zoomSnap: 0}).setView([52.2, 0], 7);
  let basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 15,
      minZoom: 5,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  L.control.scale({position: 'bottomright', maxWidth: 200}).addTo(map);
  let layerControl = L.control.layers(null, [], {position: 'topleft'}).addTo(map);

  // add an attribute to the map for mgrs tile
  map.mgrsTile = '';
  
  const geoSearchProviderOptions = {
    provider: new GeoSearch.OpenStreetMapProvider({params: {email: 'john@example.com',}}),
    style: 'bar',
    showMarker: false,
    autoComplete: true,
    autoCompleteDelay: 250,
    showPopup: false,
    retainZoomLevel: true,
    animateZoom: true,
    autoClose: true,
    searchLabel: 'Search for',
    keepResult: false
  };

  let geoSearchControl = new GeoSearch.GeoSearchControl(geoSearchProviderOptions);
  map.addControl(geoSearchControl);



  // Access the features preview container
  



  /**
   * This function appends a new feature preview and scrolls to it
   * 
   * @param {HTMLElement} featurePreview - The feature preview to be appended
   */
  function appendAndScrollToFeature(featurePreview) {
    featuresPreviews.appendChild(featurePreview);
    featuresPreviews.scrollTop = featuresPreviews.scrollHeight;
  }

  /**
   * This function updates the features list with new feature previews
   * 
   * @param {L.FeatureGroup} featureGroup - The feature group to get layers from
   */
  function updateFeaturesList(featureGroup) {
    // If there are no layers in the feature group, clear the features previews
    if (featureGroup.getLayers().length === 0) {
      featuresPreviews.innerHTML = '';
      return;
    }
    
    // Create a document fragment to avoid multiple reflows when appending elements
    const fragment = document.createDocumentFragment();
      
    featureGroup.eachLayer((layer) => {
      // If this layer has not been added to the list yet, add it
      if (!addedLayerIds.includes(layer._leaflet_id)) {
        const featurePreview = featureFunction.createFeaturePreview(map, layer, titilerConfig, layerControl, addedGeoTiffLayers, searchBody, previewBoxWidth);
        fragment.appendChild(featurePreview);
        addedLayerIds.push(layer._leaflet_id);
      }
    });
    // console.log('Feature group----,', featureGroup);
    // Append the new feature previews and scroll to them
    appendAndScrollToFeature(fragment);
  }

  mapFunction.enableDrawing(map); // Ensure featureGroup is initialized
  
  map.on('draw:created', event => {
    featureGroup = mapFunction.getFeatureGroup();
    const layer = event.layer;
    layer.property = {};
    layer.property.name = 'Draw feature';
    featureGroup.addLayer(layer);
    updateFeaturesList(featureGroup);
  });

  map.on('draw:edited', event => {
    event.layers.eachLayer(layer => {
      // featureGroup = mapFunction.getFeatureGroup();
      featureGroup.addLayer(layer);
      updateFeaturesList(featureGroup);
    });
  });

  map.on('draw:deleted', event => {
    event.layers.eachLayer(layer => {
      // featureGroup = mapFunction.getFeatureGroup();
      featureGroup.removeLayer(layer);
      updateFeaturesList(featureGroup);
    });
  });

  map.on('zoomend', () => {
    handleZoomChange(map);
  });
  

  let drawControl =  mapFunction.getDrawControl();
  let clickEvent = mapFunction.getClickEvent();

  function resetLayerStyle(layer) {
    if (layer.originalOptions) {
      layer.setStyle(layer.originalOptions);
    }
  }

  /**
   * A utility function to throttle function execution.
   *
   * @param {Function} func - The function to throttle.
   * @param {number} limit - The throttling limit in milliseconds.
   * @returns {Function} The throttled function.
   */
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

  /**
   * Function to get bounding box.
   *
   * @returns {Array} Bounding box.
   */
  function getBoundingBox() {
    const bounds = map.getBounds();
    return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  }

  /**
   * Function to update the searchBodyProxy query.
   *
   * @param {Event} event - The input event.
   * @returns {void}
   */
  function updateSearchBodyQuery(event) {
    const cloudCoverValue = event?.target.value || cloudCoverInput.value;
    document.getElementById('cloud-cover-value').textContent = cloudCoverValue + '%';
    searchBodyProxy.query = {"eo:cloud_cover": {"lt": cloudCoverValue}};
    searchBodyProxy.bbox = getBoundingBox();
  }

  /**
   * Function to initialize the searchBody.
   *
   * @param {Array} bbox - The bounding box array.
   * @returns {Object} Initialized search body.
   */
  function initSearchBody(bbox) {
    return {
      "collections": ["UK-sentinel-2"],
      "bbox": bbox,
      "limit": 50,
      "datetime": selectedDateRange,
      "intersects": null,
      "query": {
        "eo:cloud_cover": {
          "lt": cloudCoverInput.value
        }
      },
      "sort": [
        {
          "field": "eo:cloud_cover",
          "direction": "desc"
        }
      ]
    };
  }

  /**
   * Function to initialize the search options.
   *
   * @param {Object} searchBody - The search body.
   * @returns {Object} Initialized search options.
   */
  function initSearchOptions(searchBody) {
    return {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchBody)
    };
  }

  const searchBody = initSearchBody(getBoundingBox());
  
  let searchOptions = initSearchOptions(searchBody);
  
  const searchResults = document.getElementById('search-results');
  // Keep track of the layer ids that have been added
  let addedLayerIds = [];
  let addedDots = {};

  /**
   * Function to handle fetchSatelliteImages.
   *
   * @param {Object} options - The fetch options.
   * @returns {void}
   */
  const fetchSatelliteImagesHandler = throttle(function (options) {
      // // Clear search results and remove layers
      searchResults.innerHTML = "";
      map.eachLayer(function(layer) {
        if (layer !== basemap) {
          map.removeLayer(layer);
        }
      });
    addedGeoTiffLayers.forEach((geoTiffLayer) => {
      layerControl.removeLayer(geoTiffLayer);
      map.removeLayer(geoTiffLayer);
    });
    // remove layers from addedGeoTiffLayers
    addedGeoTiffLayers = [];
    addedLayerIds = [];

    if (featureGroup) {
      featureGroup.eachLayer((layer) => {
        map.removeLayer(layer);
      });
    }
    // remove layers from featureGroup
    if (featureGroup){
      featureGroup.clearLayers();
    }

    // addedGeoTiffLayers = [];
    fetchSatelliteImages(map, searchResults, analysisPanel, featureGroup, addedGeoTiffLayers, featuresPreviews, layerControl, options);
  }, 500);
  
  
  // console.log(searchOptions);
  fetchSatelliteImagesHandler(searchOptions);

  // Create a Proxy handler for the searchBody
  const searchBodyHandler = {
    set: function (target, property, value) {
      target[property] = value;
      
      // Update searchOptions
      searchOptions = initSearchOptions(target);
      // Trigger throttled fetchSatelliteImages function
      fetchSatelliteImagesHandler(searchOptions);

      return true;
    }
  };

  // Create a Proxy for the searchBody
  const searchBodyProxy = new Proxy(searchBody, searchBodyHandler);

  cloudCoverInput.addEventListener('input', updateSearchBodyQuery);

  document.getElementById('search-button').addEventListener('click', function() {
    updateSearchBodyQuery();
    searchBodyProxy.datetime = selectedDateRange;
  });

})

