function updateFieldAnalysisButtonVisibility(geoTiffLayer, analysisPanel) {
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

function fetchSatelliteImages(map, searchResults, analysisPanel, featureGroup, addedGeoTiffLayers, featuresPreviews, layerControl, searchOptions) {
    
    let highlightedResult = null;
    const stacApiSearchUrl = 'https://192.171.169.103/search';


    let imageOverlayGroup = L.layerGroup();
        // Store the original view settings
    const originalView = {
      center: map.getCenter(),
      zoom: map.getZoom(),
    };

    let searchResultClicked = false;
    let previousBounds = null;
    let removedLayers = [];
    /**
     * Handles click events on search results.
     * @param {Event} event - The click event.
     * @param {Object} layer - The corresponding map layer for the search result.
     * @param {Object} data - The data of the search result.
     * @param {Object} map - The map object.
     * @param {Object} geojsonLayer - The GeoJSON layer.
     * @param {Object} imageOverlay - The image overlay object.
     */
    function handleSearchResultClick(layer, data, map, imageOverlay) {
      searchResultClicked = true;
      map.mgrsTile = data.properties['sentinel:MGRS tile'];
      const url_to_geotiff_file = data.assets.boa_overview.href;
      const titiler_endpoint = "https://titiler.xyz";
      const titilerURL = `${titiler_endpoint}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${url_to_geotiff_file}&bidx=1&bidx=2&bidx=3&rescale=0,128`;

      const existingGeoTiffLayer = layerControl._layers.find((added_layer) => added_layer.layer._url === titilerURL);
      if (existingGeoTiffLayer) {
        return;
      }

      map.removeLayer(imageOverlay)

      
      featuresPreviews.innerHTML = '';
      
      // check if layer in map._layers has properties and its name value is 'Draw feature'
      // if so, remove it from map._layers
      map.eachLayer((layer) => {
        if (layer.property) {
          if (layer.property.name === 'Draw feature') {
            console.log('layer to remove:', layer)
            map.removeLayer(layer);
          }
          }
      });
      
      addedGeoTiffLayers.forEach((geoTiffLayer) => {
        layerControl.removeLayer(geoTiffLayer);
        map.removeLayer(geoTiffLayer);
      });

      layerControl._layers.forEach((layer) => {
        layerControl.removeLayer(layer.layer);
        map.removeLayer(layer.layer);
      });

      layer.bringToFront()

      const timeDots = timeBarContainer.querySelectorAll('.time-dot');
      timeDots.forEach(dot => {
        dot.remove();
      });

      // Show the second button
      document.getElementById('back-to-search-results').style.display = 'inline-block';

      const geoTiffLayer = L.tileLayer(titilerURL, {
        maxZoom: 17,
        minZoom: 5,
        attribution: 'NCEO ARD'
      }).addTo(map);

      map.fitBounds(layer.getBounds(), {padding: [0, 0]});
      updateFieldAnalysisButtonVisibility(geoTiffLayer, analysisPanel);

      layerControl.addOverlay(geoTiffLayer, data.id);
      addedGeoTiffLayers.push(geoTiffLayer);
    }

    /**
     * Creates an image overlay for a feature.
     * @param {Object} data - The data of the feature.
     * @returns {Object} The image overlay.
     */
    function createImageOverlay(data) {
      const topleft = [data.geometry.coordinates[0][0][1], data.geometry.coordinates[0][0][0]];
      const topright = [data.geometry.coordinates[0][1][1], data.geometry.coordinates[0][1][0]];
      const bottomleft = [data.geometry.coordinates[0][3][1], data.geometry.coordinates[0][3][0]];
      
      return L.imageOverlay.rotated(data.assets.BOA_thumbnal.href, topleft, topright, bottomleft, {
        opacity: 1,
        interactive: true,
        attribution: "Historical building plan &copy; <a href='http://www.ign.es'>Instituto Geográfico Nacional de España</a>"
      });
    }

    /**
     * Creates a HTML element for a search result.
     * @param {Object} feature - The feature.
     * @param {Object} data - The data of the feature.
     * @returns {HTMLDivElement} The search result element.
     */
    function createSearchResultElement(feature, data) {
      const searchResult = document.createElement('div');
      searchResult.innerHTML = `
        <div class="search-result-item">
          <img src="${data.assets.BOA_thumbnal.href}" alt="${feature.id}" class="search-result-thumbnail">
          <div class="search-result-info">
            <div class="search-result-title">${feature.id}</div>
            <div class="search-result-date">${new Date(feature.properties.datetime).toDateString()}</div>
            <div class="search-result-cloud-cover">
              <span class="search-result-cloud-value">☁️ ${feature.properties['eo:cloud_cover'].toFixed(1)}</span>
            </div>
          </div>
        </div>
      `;
      
      return searchResult;
    }

    function handleSearchResultMouseEnter(event, layer, imageOverlay, geojsonLayer, timeBarContainer, analysisPanel, featureGroup, highlightedResult) {
      
      // console.log(addedGeoTiffLayers)
      // if addedGeoTiffLayers.length > 0, return
      if (addedGeoTiffLayers.length > 0) {
        return;
      }
      
      featuresPreviews.innerHTML = '';

      layer.bringToFront();
      
      const timeDots = timeBarContainer.querySelectorAll('.time-dot');
      timeDots.forEach(dot => {
        dot.remove();
      });
      
      analysisPanel.classList.add('hidden');
    
      if (featureGroup) {
        featureGroup.eachLayer((layer) => {
          map.removeLayer(layer);
        });
      }
      
      addedGeoTiffLayers.forEach((geoTiffLayer) => {
        layerControl.removeLayer(geoTiffLayer);
        map.removeLayer(geoTiffLayer);
      });
    
      if (highlightedResult) {
        highlightedResult.classList.remove('highlighted');
        const layerID = highlightedResult.getAttribute('layerID');
        const layer = geojsonLayer.getLayer(layerID);
        geojsonLayer.resetStyle(layer);
      }
      
      imageOverlay.bringToFront();
      layer.setStyle({
        color: 'yellow',
        weight: 2
      });
      
      event.currentTarget.classList.add('highlighted');
      highlightedResult = event.currentTarget;
      map.addLayer(imageOverlay);
    }
    
    /**
     * Handles the 'mouseleave' event on a search result.
     * @param {Event} event - The event.
     * @param {Object} layer - The layer associated with the search result.
     * @param {Object} imageOverlay - The image overlay associated with the search result.
     * @param {Object} geojsonLayer - The GeoJSON layer.
     * @param {Object} map - The map object.
     * @param {Object} originalView - The original view of the map.
     * @param {Array} addedGeoTiffLayers - The added GeoTiff layers.
     */
    function handleSearchResultMouseLeave(event, layer, imageOverlay, geojsonLayer, map, originalView) {
      geojsonLayer.resetStyle(layer);
      event.currentTarget.classList.remove('highlighted');
      highlightedResult = null;
      map.removeLayer(imageOverlay);
      
      // setTimeout(() => {
      //   if (!highlightedResult && !searchResultClicked) {
      //     map.flyTo(originalView.center, originalView.zoom);
      //     addedGeoTiffLayers.forEach((geoTiffLayer) => {
      //       layerControl.removeLayer(geoTiffLayer);
      //       map.removeLayer(geoTiffLayer);
      //     });
      //   }
      // }, 500);
    }

    /**
     * Handles the 'mouseover' event on a layer.
     * @param {Event} event - The event.
     * @param {Object} geojsonLayer - The GeoJSON layer.
     * @param {Object} map - The map object.
     * @param {Object} imageOverlay - The image overlay associated with the layer.
     * @param {Element} searchResult - The HTML element representing the search result.
     */
    function handleLayerMouseOver(event, geojsonLayer, map, imageOverlay, searchResult) {
      // console.log('handleLayerMouseOver', addedGeoTiffLayers)
      
      if (addedGeoTiffLayers.length > 0) {
        return;
      }

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
      
      event.target.setStyle({
        color: 'yellow',
        weight: 2
      });
      
      highlightedResult = searchResult;
      highlightedResult.scrollIntoView({
        behavior: 'smooth'
      });
    }

    /**
     * Handles the 'mouseout' event on a layer.
     * @param {Event} event - The event.
     * @param {Object} geojsonLayer - The GeoJSON layer.
     * @param {Object} map - The map object.
     * @param {Object} imageOverlay - The image overlay associated with the layer.
     * @param {Element} searchResult - The HTML element representing the search result.
     */
    function handleLayerMouseOut(event, geojsonLayer, map, imageOverlay, searchResult) {
      const layerID = searchResult.getAttribute('layerID');
      const layer = geojsonLayer.getLayer(layerID);
      geojsonLayer.resetStyle(layer);
      searchResult.classList.remove('highlighted');
      highlightedResult = null;
      map.removeLayer(imageOverlay);
    }
    /**
     * Handle click event for 'back-to-search-results' button
     * It resets the map and associated interface elements to their original state
     */
    function handleBackToSearchResultsClick() {
      // Hide the button and reset search result click status
      searchResultClicked = false;
      this.style.display = 'none';
      featuresPreviews.innerHTML = '';
  
      // Restore the previous bounds and zoom level smoothly
      if (previousBounds) {
          map.fitBounds(previousBounds);
      }
  
      // Add removed layers back to map
      removedLayers.forEach(layer => {
          layer.addTo(map);
      });
  
      // Clear removedLayers array
      removedLayers = [];
  
      // Update field analysis button visibility
      updateFieldAnalysisButtonVisibility(null, analysisPanel);
  
      // Remove each geotiff layer from layer control and map
      addedGeoTiffLayers.forEach(geoTiffLayer => {
          layerControl.removeLayer(geoTiffLayer);
          map.removeLayer(geoTiffLayer);
      });
  
      // Clear addedGeoTiffLayers array
      addedGeoTiffLayers = [];
  
      // Remove all 'time-dot' elements from 'timeBarContainer'
      const timeBarContainer = document.getElementById('timeBarContainer');
      const timeDots = timeBarContainer.querySelectorAll('.time-dot');
      timeDots.forEach(dot => {
          dot.remove();
      });
  }

    /**
     * Fetches JSON from the provided URL.
     * @param {string} url - The URL to fetch from.
     * @returns {Promise<object>} The fetched JSON data.
     */
    async function fetchJson(url) {
      try {
        const response = await fetch(url);
        return await response.json();
      } catch (error) {
        console.error(error);
        return null;
      }
    }

    /**
     * Processes each feature asynchronously.
     * @param {object} feature - The feature data.
     * @returns {Promise<object>} The processed feature.
     */
    async function processFeature(feature) {
      if (feature.links && feature.links.length > 0) {
        const selfURL = feature.links[3].href;
        const httpsURL = selfURL.replace('http://', 'https://').replace(':8080', '');
        const data = await fetchJson(httpsURL);
        
        return {
          data: data,
          feature: feature
        };
      }
      return null;
    }

    function addListenersToSearchResult(searchResult, data, layer, imageOverlay, geojsonLayer, timeBarContainer, analysisPanel, featureGroup, highlightedResult) {
      searchResult.addEventListener('mouseenter', function(event) {
        handleSearchResultMouseEnter(event, layer, imageOverlay, geojsonLayer, timeBarContainer, analysisPanel, featureGroup, highlightedResult);
      });
      
      searchResult.addEventListener('mouseleave', function(event) {
        handleSearchResultMouseLeave(event, layer, imageOverlay, geojsonLayer, map, originalView);
      });
      searchResult.addEventListener('click', () => handleSearchResultClick(layer, data, map, imageOverlay));
  
      layer.on('mouseover', function(event) {
        handleLayerMouseOver(event, geojsonLayer, map, imageOverlay, searchResult);
      });
      
      layer.addEventListener('mouseout', function(event) {
        handleLayerMouseOut(event, geojsonLayer, map, imageOverlay, searchResult);
      });

      layer.addEventListener('click', () => handleSearchResultClick(layer, data, map, imageOverlay));
    }

    fetch(stacApiSearchUrl, searchOptions)
      .then(response => response.json())
      .then(data => {
        const items = data.features;
        // get the items with unique mgrs id
        // console.log(items)
        const mgrs_ids = items.map(item => item.properties['sentinel:MGRS tile']);
        // console.log(mgrs_ids)
        const unique_mgrs_ids = [...new Set(mgrs_ids)];
        const unique_items = unique_mgrs_ids.map(mgrs_id => items.find(item => item.properties['sentinel:MGRS tile'] === mgrs_id));
        // console.log(unique_items)

        // const imageOverlayGroup = L.layerGroup();
        const geojsonLayer = L.geoJSON(unique_items, {
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
                  const imageOverlay = createImageOverlay(data);
                  imageOverlayGroup.addLayer(imageOverlay);
          
                  const searchResult = createSearchResultElement(feature, data);

                  addListenersToSearchResult(searchResult, data, layer, imageOverlay, geojsonLayer, timeBarContainer, analysisPanel, featureGroup, highlightedResult)

                  searchResults.appendChild(searchResult);
  
                  previousBounds = geojsonLayer.getBounds();
                  document.getElementById('back-to-search-results').addEventListener('click', handleBackToSearchResultsClick);
                
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

export { fetchSatelliteImages, updateFieldAnalysisButtonVisibility};