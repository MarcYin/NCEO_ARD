const stacApiSearchUrl = 'https://192.171.169.103/search';
    
    /**
   * Highlights a given map layer by changing its style.
   * @param {Object} layer - The layer to highlight.
   */
    function highlightLayer(layer) {
        // Save the original options for resetting later
        if (!layer.originalOptions) {
          layer.originalOptions = Object.assign({}, layer.options);
        }
    
        const highlightOptions = {
          color: '#ff9800', // Change the border color
          fillColor: '#ffff00', // Change the fill color
          weight: 2, // Increase the border width
        };
    
        layer.setStyle(highlightOptions);
      }
    
      /**
       * Resets a given map layer's style to its original.
       * @param {Object} layer - The layer to reset.
       */
      function resetLayerStyle(layer) {
        if (layer.originalOptions) {
          layer.setStyle(layer.originalOptions);
        }
      }

  /**
   * Calculates geometry of a layer.
   * @param {Object} layer - The layer whose geometry needs to be calculated.
   * @returns {Array|null} - An array of layer geometry or null if layer type is unsupported.
   */
  function calculateLayerGeometry(layer) {
    if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
      const latlngs = layer.getLatLngs()[0];
      return latlngs.map(latlng => [latlng.lng, latlng.lat]);
    } else if (layer instanceof L.Circle) {
      const circleCoords = layer.toPolygon().map(latlng => [latlng.lng, latlng.lat]);
      return circleCoords;
    } else {
      console.warn('Unsupported layer type for fetchData');
      return null;
    }
  }

  /**
   * Calculates bounding box coordinates and xy_ratio.
   * @param {Object} map - The map object.
   * @param {Object} layer - The layer whose bounding box needs to be calculated.
   * @returns {Array} - An array containing bounding box coordinates and xy_ratio.
   */
  function calculateBoundingBox(map, layer) {
    const bounds = layer.getBounds();
    const projectedSW = map.project(bounds.getSouthWest());
    const projectedNE = map.project(bounds.getNorthEast());
    
    let xy_ratio = (layer instanceof L.Polygon || layer instanceof L.Rectangle) ? 
                  (projectedNE.x - projectedSW.x) / (projectedSW.y - projectedNE.y) : 
                  1;

    const bbox = [
      bounds.getSouthWest().lng,
      bounds.getSouthWest().lat,
      bounds.getNorthEast().lng,
      bounds.getNorthEast().lat,
    ];

    return {bbox, xy_ratio};
  }

  /**
   * Convert pixel coordinates to geographical coordinates
   * @param {Array} pixel - An array [x, y] representing the pixel coordinates
   * @param {Array} topLeftGeoCoord - The geographical coordinates of the top-left corner of the image
   * @param {Number} imgWidth - The width of the image
   * @param {Number} imgHeight - The height of the image
   * @returns {Array} - An array [longitude, latitude] representing the geographical coordinates
   */
  function pixelToCoord(pixel, bbox, imgWidth, imgHeight) {
    const [pixelX, pixelY] = pixel;
    const geoLeft = bbox[0];  // the left-most longitude
    const geoTop = bbox[3];  // the top-most latitude
    const geoWidth = bbox[2] - bbox[0];  // the width of geographical bounds
    const geoHeight = bbox[3] - bbox[1]; // the height of geographical bounds

    // Linear interpolation
    const longitude = geoLeft + (pixelX / imgWidth) * geoWidth;
    const latitude = geoTop - (pixelY / imgHeight) * geoHeight;  // Note the minus sign because y-axis is reversed in image coordinates

    return [longitude, latitude];
  }

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
  /**
   * Create a mask from a geometry layer
   * @param {Object} layerGeometry - The geometry of the layer
   * @param {Number} imgWidth - The width of the image
   * @param {Number} imgHeight - The height of the image
   * @returns {Array} - A 2D array representing the mask
   */
  function createMaskFromGeometryLayer(layerGeometry, bbox, imgWidth, imgHeight) {
    const mask = new Array(imgHeight).fill(0).map(() => new Array(imgWidth).fill(false));

    // For each pixel in the image...
    for (let y = 0; y < imgHeight; y++) {
      for (let x = 0; x < imgWidth; x++) {
        // Convert the pixel coordinates to geographical coordinates
        const coord = pixelToCoord([x, y], bbox, imgWidth, imgHeight);
        // Check if the geographical coordinate is inside the geometry
        if (isPointInPolygon(coord, layerGeometry)) {
          mask[y][x] = true;
        }
      }
    }

    return mask;
  }

  
  
  async function fetchDataOverFeature(map, layer, dropDownContainer, titilerConfig, searchBody, addedGeoTiffLayers, layerControl) {

    
  
    const layerGeometry = calculateLayerGeometry(layer);
  
    if (!layerGeometry) return;  // If the layer type is unsupported, exit the function
  
    const {bbox, xy_ratio} = calculateBoundingBox(map, layer);
    
    var previewHeight = 256;
    var previewWidth = Math.round(previewHeight * xy_ratio);
    // get the width of the 
    // const topLeftGeoCoord = [bbox[0], bbox[3]];
    const mask = createMaskFromGeometryLayer(layerGeometry, bbox, previewWidth, previewHeight);
    function createPreviewBoxTitle(id) {
      const title = document.createElement('div');
      title.classList.add('preview-box-title');
      title.textContent = id;
      title.style.fontSize = '10px';
      title.style.textAlign = 'center';
      title.style.marginBottom = '5px';
      return title;
    }
    
    function loadImage(url, retries = 5, delay = 50000) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => {
          if (retries === 0) {
            reject(new Error(`Failed to load image from ${url} after multiple attempts.`));
            return;
          }
          console.log(`An error occurred while loading the image from ${url}. Retrying...`);
          setTimeout(() => {
            resolve(loadImage(url, retries - 1, delay));
          }, delay);
        };
        img.src = url;
      });
    }
    /**
     * Apply mask to image data
     * @param {Uint8ClampedArray} data - The image data
     * @param {Array<Array<boolean>>} mask - The mask to apply
     * @param {number} width - The width of the image
     * @param {number} height - The height of the image
     */

    function applyMask(data, mask, width, height) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;

          // Make the pixel transparent if it's outside the geometry OR it's all zeros
          if (!mask[y][x]) {
            data[i + 3] = 0;
          }
        }
      }
    }

    /**
     * Load an image and create a canvas from it
     * @param {string} url - The URL of the image to load
     * @returns {Promise<{img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, data: Uint8ClampedArray}>} - A promise that resolves to an object containing the loaded image, the created canvas, its context, and the image data
     */
    async function loadCanvasFromUrl(url) {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      return {
        img,
        canvas,
        ctx,
        data: imgData.data
      };
    }

    /**
     * Create an image from a URL and append it to a box
     * @param {string} url - The URL to create the image from
     * @param {HTMLElement} box - The box to append the image to
     * @param {Array<number>} bbox - The bounding box
     * @param {number} previewWidth - The preview width
     * @param {number} previewHeight - The preview height
     * @param {Array<Array<boolean>>} mask - The mask to apply
     */
    async function createImageFromUrl(url, previewBox, bbox, previewWidth, previewHeight, mask) {
      try {
        const titiler_endpoint = 'https://192.171.169.9';
        const paras = {
          url: url,
          rescale: "0,1",
          minzoom: 11,
          maxzoom: 18,
          colormap_name: "reds",
        };

        var imageUrl = `${titiler_endpoint}/stac/crop/${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}/${previewWidth}x${previewHeight}.png?url=${paras.url}&expression=${titilerConfig.expression}&rescale=${paras.rescale}&colormap_name=${titilerConfig.colormap}&minzoom=${paras.minzoom}&maxzoom=${paras.maxzoom}&asset_as_band=True`;
      
        const {img, canvas, ctx, data} = await loadCanvasFromUrl(imageUrl);
        applyMask(data, mask, img.width, img.height);
        ctx.putImageData(new ImageData(data, img.width, img.height), 0, 0);
        
        const newImg = new Image();
        newImg.src = canvas.toDataURL();
        previewBox.appendChild(newImg);
      } catch (error) {
        console.error(error);
      }
    }


    /**
     * Removes a geoTiff layer from the map and the layer control.
     * @param {string} titilerURL - The titiler URL of the feature.
     */
    function removeGeoTiffLayer(titilerURL) {
      addedGeoTiffLayers.forEach(layer => {
        if (layer._url === titilerURL) {
          layerControl.removeLayer(layer);
          map.removeLayer(layer);
          const layerIndex = addedGeoTiffLayers.indexOf(layer);
          if (layerIndex !== -1) {
            addedGeoTiffLayers.splice(layerIndex, 1);
          }
        }
      });
    }

    /**
     * Adds a geoTiff layer to the map and the layer control.
     * @param {string} titilerURL - The titiler URL of the feature.
     * @param {string} featureId - The id of the feature.
     */
    function addGeoTiffLayer(titilerURL, featureId) {
      const geoTiffLayer = L.tileLayer(titilerURL, {
        maxZoom: 18,
        minZoom: 5,
        attribution: 'NCEO ARD'
      }).addTo(map);
      layerControl.addOverlay(geoTiffLayer, featureId);
      addedGeoTiffLayers.push(geoTiffLayer);
    }

    /**
     * Returns a function that handles click events on time dots.
     * @param {HTMLElement} timeDot - The time dot element.
     * @param {string} titilerURL - The titiler URL of the feature.
     * @param {string} featureId - The id of the feature.
     * @returns {function} - The event handler function.
     */
    function createpreviewBoxClickHandler(previewBox, titilerURL, featureId) {
      return () => {
        if (previewBox.addedToMap) {
          removeGeoTiffLayer(titilerURL);
          previewBox.addedToMap = false;
          previewBox.classList.remove('active-preview-box'); // Remove the yellow border
        } else {
          previewBox.addedToMap = true;
          addGeoTiffLayer(titilerURL, featureId);
          previewBox.classList.add('active-preview-box'); // Add the yellow border
        }
      };
    }

    
    function createImagePreviewBox(feature) {
      const previewBox = document.createElement('div');
      previewBox.classList.add('preview-box');
      
      // Create title
      const title = createPreviewBoxTitle(feature.id);
      previewBox.appendChild(title);
      
      // Create image
      const url = `https://gws-access.jasmin.ac.uk/public/nceo_ard/NCEO_ARD_STAC_API/UK-sentinel-2/${feature.id}.json`;
      // createImageFromUrl(tiffUrl, previewBox);
      createImageFromUrl(url, previewBox, bbox, previewWidth, previewHeight, mask)
  
      const titiler_endpoint = "https://titiler.xyz";
      const stac_item = `https://gws-access.jasmin.ac.uk/public/nceo_ard/NCEO_ARD_STAC_API/UK-sentinel-2/${feature.id}.json`;
      const paras = {
          url: stac_item,
          expression: "(B8A-B04)/(B8A+B04)",  // NDVI
          rescale: "0,1",
          minzoom: 13,
          maxzoom: 18,
          colormap_name: "reds",
      };

      var titilerURL = `${titiler_endpoint}/stac/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${paras.url}&expression=${titilerConfig.expression}&rescale=${paras.rescale}&colormap_name=${titilerConfig.colormap}&minzoom=${paras.minzoom}&maxzoom=${paras.maxzoom}&asset_as_band=True`
      
      previewBox.onclick = createpreviewBoxClickHandler(previewBox, titilerURL, feature.id);
  
      return previewBox;
    }
    

    // const selectedDateRange = "2023-04-01T00:00:00Z/2023-04-30T23:59:59Z"; // Replace this with the actual date range
    // const cloudCoverInput = { value: 10 }; // Replace this with the actual cloud cover input value


    /**
     * Fetches and processes data from an API and creates image preview boxes
     */
    async function fetchAndProcessData() {
    // // Initialize searchBody
    // let searchBody = {
    //   "collections": ["UK-sentinel-2"],
    //   "bbox": bbox,
    //   "limit": 100,
    //   "datetime": selectedDateRange,
    //   "intersects": null,
    //   "query": {
    //     "eo:cloud_cover": {
    //       "lt": cloudCoverInput.value
    //     }
    //   },
    //   "sort": [
    //     {
    //       "field": "datetime",
    //       "direction": "desc"
    //     }
    //   ]
    // };
    searchBody.bbox = bbox;

    const response = await fetch(stacApiSearchUrl, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchBody),
    });

    // If the response was not ok, throw an error
    if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features.filter(
        feature => feature.properties['sentinel:MGRS tile'] === map.mgrsTile
    );

    // Create image preview boxes for each feature
    const previewBoxPromises = features.map(createImagePreviewBox);
    const previewBoxes = await Promise.all(previewBoxPromises);

    // Append non-null preview boxes to the drop down container
    previewBoxes
        .filter(previewBox => previewBox !== null)
        .forEach(previewBox => dropDownContainer.appendChild(previewBox));


    }
    fetchAndProcessData();
    dropDownContainer.querySelector('.loading-spinner').remove();
  }

  
  async function fetchDataTS(map, layer, dropDownContainer, titilerConfig, layerControl, addedGeoTiffLayers, searchBody, previewBoxWidth) {

    /**
     * Returns the width of the drop down container.
     * @param {object} dropDownContainer - The HTML element of the drop down container.
     * @returns {number} - The width of the drop down container.
     */
    function getDropDownContainerWidth(dropDownContainer) {
      return dropDownContainer.getBoundingClientRect().width;
    }

    const latLng = layer.getLatLng();
    /**
     * Returns the bounding box.
     * @param {object} layer - The map layer.
     * @param {number} buffer - The buffer for the bounding box.
     * @returns {object} - The bounding box.
     */
    function getBoundingBox(layer, buffer) {
      const latLng = layer.getLatLng();
      const bounds = L.latLngBounds(
        L.latLng(latLng.lat - buffer, latLng.lng - buffer),
        L.latLng(latLng.lat + buffer, latLng.lng + buffer)
      );

      return [
        bounds.getSouthWest().lng,
        bounds.getSouthWest().lat,
        bounds.getNorthEast().lng,
        bounds.getNorthEast().lat,
      ];
    }

    /**
     * Returns the date range for the search.
     * @param {string} selectedDateRange - The selected date range.
     * @returns {string} - The search date range.
     */
    function getDateRange(selectedDateRange) {
      const startDate = new Date(selectedDateRange.slice(0,10))
      const endDate   = new Date(selectedDateRange.slice(21,31))
      const totalDuration = endDate.getTime() - startDate.getTime();
      return [startDate, totalDuration];
    }

    /**
     * Sends a search request to the STAC API.
     * @param {string} stacApiSearchUrl - The STAC API search URL.
     * @param {object} body - The search body.
     * @returns {Promise<object>} - The search response.
     * @throws {Error} - If the HTTP response status is not OK.
     */
    async function searchStacApi(stacApiSearchUrl, body) {
      const response = await fetch(stacApiSearchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`HTTP response status not OK: ${response.status}`);
      }
    }

    /**
     * Filters the features by the MGRS tile ID.
     * @param {array} features - The features to be filtered.
     * @returns {array} - The filtered features.
     */
    function filterFeaturesByMGRSTile(features) {
      // const mgrsTileId = features[0].properties['sentinel:MGRS tile'];
      return features.filter(feature => feature.properties['sentinel:MGRS tile'] === map.mgrsTile);
    }
    const dropDownContainerWidth = getDropDownContainerWidth(dropDownContainer);
    console.log(dropDownContainerWidth);
    
    const bbox = getBoundingBox(layer, 0.0001);
      
    //   // getDateRange(selectedDateRange);
    //   // get dateRange and totalDuration
    // console.log(searchBody.datetime);

    const [startDate, totalDuration] = getDateRange(searchBody.datetime);
    // console.log(startDate);
    // console.log(totalDuration);

    searchBody.bbox = bbox;

    const data = await searchStacApi(stacApiSearchUrl, searchBody);
    let features = filterFeaturesByMGRSTile(data.features);
    /**
     * Returns a function that handles mouseenter events on time dots.
     * @param {string} datetime - The datetime of the feature.
     * @param {number} position - The position of the time dot.
     * @param {HTMLElement} ticksContainer - The ticks container element.
     * @returns {function} - The event handler function.
     */
    function createTimeDotMouseEnterHandler(datetime, position, ticksContainer) {
      return () => {
        const dateLabel = document.createElement('div');
        dateLabel.className = 'date-label';
        dateLabel.style.left = `${position}%`;
        dateLabel.innerText = datetime;
        dateLabel.id = `dateLabel-${datetime}`;
        ticksContainer.appendChild(dateLabel);
      };
    }

    /**
     * Returns a function that handles mouseleave events on time dots.
     * @param {string} datetime - The datetime of the feature.
     * @param {HTMLElement} ticksContainer - The ticks container element.
     * @returns {function} - The event handler function.
     */
    function createTimeDotMouseLeaveHandler(datetime, ticksContainer) {
      return () => {
        const dateLabel = document.getElementById(`dateLabel-${datetime}`);
        if (dateLabel) {
          ticksContainer.removeChild(dateLabel);
        }
      };
    }

    /**
     * Returns a function that handles click events on time dots.
     * @param {HTMLElement} timeDot - The time dot element.
     * @param {string} titilerURL - The titiler URL of the feature.
     * @param {string} featureId - The id of the feature.
     * @returns {function} - The event handler function.
     */
    function createTimeDotClickHandler(timeDot, titilerURL, featureId) {
      return () => {
        if (timeDot.style.backgroundColor === 'rgba(243, 255, 10, 0.4)') {
          timeDot.style.backgroundColor = 'rgba(6, 133, 244, 0.4)';
          timeDot.style.borderColor =  'rgba(6, 133, 244, 0.8)';
          removeGeoTiffLayer(titilerURL);
        } else {
          timeDot.style.backgroundColor = 'rgba(243, 255, 10, 0.4)';
          timeDot.style.borderColor =  'rgba(243, 255, 10, 0.8)';
          addGeoTiffLayer(titilerURL, featureId);
        }
      };
    }

    /**
     * Removes a geoTiff layer from the map and the layer control.
     * @param {string} titilerURL - The titiler URL of the feature.
     */
    function removeGeoTiffLayer(titilerURL) {
      addedGeoTiffLayers.forEach(layer => {
        if (layer._url === titilerURL) {
          layerControl.removeLayer(layer);
          map.removeLayer(layer);
          const layerIndex = addedGeoTiffLayers.indexOf(layer);
          if (layerIndex !== -1) {
            addedGeoTiffLayers.splice(layerIndex, 1);
          }
        }
      });
    }

    /**
     * Adds a geoTiff layer to the map and the layer control.
     * @param {string} titilerURL - The titiler URL of the feature.
     * @param {string} featureId - The id of the feature.
     */
    function addGeoTiffLayer(titilerURL, featureId) {
      const geoTiffLayer = L.tileLayer(titilerURL, {
        maxZoom: 18,
        minZoom: 5,
        attribution: 'NCEO ARD'
      }).addTo(map);
      layerControl.addOverlay(geoTiffLayer, featureId);
      addedGeoTiffLayers.push(geoTiffLayer);
    }


    const ticksContainer = document.getElementById('ticksContainer');
    const timeBarContainer = document.getElementById('timeBarContainer');
    const timeDots = timeBarContainer.querySelectorAll('.time-dot');

    features.forEach(feature => {
      const datetime = feature.properties.datetime;
      // Skip this iteration if timeDot for this datetime has already been added and timeDots exist
      if (timeDots.length > 0) {
        for (let i = 0; i < timeDots.length; i++) {
          if (timeDots[i].id === datetime) {
            return;
          }
        }
      }
    
      const currentDate = new Date(datetime);
      
      const dotProgress = (currentDate.getTime() - startDate.getTime()) / totalDuration;
      const position = dotProgress * 100;
  
      const timeDot = document.createElement('div');
      timeDot.className = 'time-dot';
      timeDot.style.left = `${position}%`;
      timeDot.id = datetime;
  
      const urlToGeotiffFile = feature.assets.boa_overview.href;
      const titilerEndpoint = "https://titiler.xyz";
      const titilerURL = `${titilerEndpoint}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${urlToGeotiffFile}&bidx=1&bidx=2&bidx=3&rescale=0,128`;
  
      timeDot.onmouseenter = createTimeDotMouseEnterHandler(datetime, position, ticksContainer);
      timeDot.onmouseleave = createTimeDotMouseLeaveHandler(datetime, ticksContainer);
      timeDot.onclick = createTimeDotClickHandler(timeDot, titilerURL, feature.id);
      
      ticksContainer.appendChild(timeDot);
    
    });
    
    const datetimeList = [];
    const pixelValueList = [];
    const featureList = [];
    
    const constructParameters = (url) => {
        return {
            url,
            rescale: "0,1",
            minzoom: 11,
            maxzoom: 18,
            colormap_name: "reds",
        };
    };
    
    const constructPixDataURL = (paras, latLng, titiler_endpoint) => {
        return `${titiler_endpoint}/stac/point/${latLng.lng},${latLng.lat}?url=${paras.url}&expression=${titilerConfig.expression}&asset_as_band=true&unscale=false&resampling=nearest`;
    };
    
    const processData = (data, feature) => {
        let pixelValue = data.values[0];
        // Assign null to pixelValue if it's 0
        if (pixelValue === 0) {
            pixelValue = null;
        }
        console.log(pixelValue);
        // Append the datetime and pixel value to the arrays
        const datetime = feature.properties.datetime;
        datetimeList.push(datetime);
        pixelValueList.push(pixelValue);
        featureList.push(feature);
    };
    
    const processFeature = async (feature, retries = 3) => {
        const url = `https://gws-access.jasmin.ac.uk/public/nceo_ard/NCEO_ARD_STAC_API/UK-sentinel-2/${feature.id}.json`;
        const titiler_endpoint = 'https://192.171.169.9';
    
        const paras = constructParameters(url);
        const pixDataURL = constructPixDataURL(paras, latLng, titiler_endpoint);
    
        try {
            // Fetch the pixel data from the titiler service
            const response = await fetch(pixDataURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            });
    
            // If the response was not ok, throw an error
            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.status} ${response.statusText}`);
            }
    
            const data = await response.json();
            processData(data, feature);
    
            return;
        } catch (error) {
            if (retries === 0) throw error;
            console.error(`Error: ${error.message}. Retrying...`);
            // If fetch fails, wait for 1 second then retry
            await new Promise(r => setTimeout(r, 1000));
            return processFeature(feature, retries - 1);
        }
    };
    
    const processFeatures = async (features) => {
    for (let i = 0; i < features.length; i++) {
        try {
            await processFeature(features[i]);
        }
        catch (error) {
            console.error(error);

        }
    }};

    await processFeatures(features);
    
      // Mapping and sorting
      const combinedList = datetimeList.map((datetime, index) => ({
        datetime,
        pixelValue: pixelValueList[index],
        feature: featureList[index]
      })).sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

      // Filtering
      const filteredList = combinedList.filter(item => item.pixelValue !== null);
      const filteredPixelValues = filteredList.map(item => item.pixelValue);
      const filteredDatetimeList = filteredList.map(item => item.datetime);
      const filteredFeatures = filteredList.map(item => item.feature);

      // Preparing for plotting
      let originalMarkerColor = 'rgba(6, 133, 244, 0.8)';
      const colors = new Array(filteredPixelValues.length).fill(originalMarkerColor);
      const sizes = new Array(filteredPixelValues.length).fill(5);

      const trace = {
        x: filteredDatetimeList,
        y: filteredPixelValues,
        type: 'scatter',
        mode: 'lines+markers',
        connectgaps: false, 
        marker: {
          size: sizes,
          color: colors
        },
        line: {
          color: originalMarkerColor,
          width: 2
        },
        customdata: filteredFeatures
      };
      // console.log('width:', previewBoxWidth*0.99)
      const yRange = [Math.min(...filteredPixelValues), Math.max(...filteredPixelValues)];
      yRange[0] = yRange[0] - 0.1 * (yRange[1] - yRange[0]);
      yRange[1] = yRange[1] + 0.1 * (yRange[1] - yRange[0]);
      const layout = {
        autosize: false,
        width: previewBoxWidth*0.95,
        height: 150,
        margin: { t: 20, b: 50, autoexpand: true, l: 50, r: 20 },
        xaxis: { title: 'Date', showgrid: false },
        yaxis: { title: 'Pixel Value', range: yRange, showgrid: true },
        // plot_bgcolor: 'rgba(255,255,255,0)',
        // paper_bgcolor: 'rgba(255,255,255,0)',

      };
        
      const config = {
        displayModeBar: false
      };

      // Plot
      const timeSeriesPlot = await Plotly.newPlot(dropDownContainer, [trace], layout, config);

      let changedColor = 'rgba(243, 255, 10, 0.8)';
      /**
       * Updates the colors and sizes of the markers and restyles the plot.
       * @param {number} index - The index of the point to be updated.
       * @param {string} color - The new color.
       * @param {number} size - The new size.
       */
      function updateMarkerAndReplot(index, color, size) {
        colors[index] = color;
        sizes[index] = size;
        const update = { 'marker': { color: colors, size: sizes } };
        Plotly.restyle(dropDownContainer, update);
      }

      /**
       * Removes a geoTiff layer from the map and the layer control.
       * @param {string} titilerURL - The titiler URL of the layer to be removed.
       */
      function removeGeoTiffLayer(titilerURL) {
        addedGeoTiffLayers.forEach((layer, index) => {
          if (layer._url === titilerURL) {
            layerControl.removeLayer(layer);
            map.removeLayer(layer);
            addedGeoTiffLayers.splice(index, 1);
          }
        });
      }

      timeSeriesPlot.on('plotly_click', (eventData) => {
        const clickedMarker = eventData.points[0];
        const clickedFeature = clickedMarker.customdata;
        
        // const urlToGeotiffFile = clickedFeature.assets.boa_overview.href;
        // const titilerEndpoint = "https://titiler.xyz";
        // const titilerURL = `${titilerEndpoint}/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${urlToGeotiffFile}&bidx=1&bidx=2&bidx=3&rescale=0,128`;

        const titiler_endpoint = "https://titiler.xyz";
        const stac_item = `https://gws-access.jasmin.ac.uk/public/nceo_ard/NCEO_ARD_STAC_API/UK-sentinel-2/${clickedFeature.id}.json`;
        const paras = {
            url: stac_item,
            expression: "(B8A-B04)/(B8A+B04)",  // NDVI
            rescale: "0,1",
            minzoom: 13,
            maxzoom: 18,
            colormap_name: "reds",
        };

        var titilerURL = `${titiler_endpoint}/stac/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=${paras.url}&expression=${titilerConfig.expression}&rescale=${paras.rescale}&colormap_name=${titilerConfig.colormap}&minzoom=${paras.minzoom}&maxzoom=${paras.maxzoom}&asset_as_band=True`
        
        // // url = encodeURIComponent(url)
        // console.log(url)
        // L.tileLayer(url, {
        //   maxZoom: 17,
        //   minZoom: 13,
        //   attribution: 'NCEO ARD'
        // }).addTo(map);

        const pointNumber = clickedMarker.pointNumber;
        
      
        if (colors[pointNumber] === changedColor) {
          updateMarkerAndReplot(pointNumber, originalMarkerColor, 5);
          removeGeoTiffLayer(titilerURL);
        } else {
          updateMarkerAndReplot(pointNumber, changedColor, 10);
          addGeoTiffLayer(titilerURL, clickedFeature.id)
        }
      });

      dropDownContainer.querySelector('.loading-spinner').remove();
  }

  function createFeaturePreview(map, layer, titilerConfig, layerControl, addedGeoTiffLayers, searchBody, previewBoxWidth) {

    const cell = document.createElement('div');
    cell.className = 'cell';
    
    const previewContainer = document.createElement('div');
    previewContainer.className = 'preview-container';

    const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.classList.add('svg-container');

    const mapAspectRatio = map.getSize().x / map.getSize().y;
    svgContainer.setAttribute('viewBox', `0 0 ${100 * mapAspectRatio} 100`);

    previewContainer.appendChild(svgContainer);

    previewContainer.onmouseover = function () {
      highlightLayer(layer); // Highlight the layer on the map
    };

    previewContainer.onmouseout = function () {
      this.style.position = 'static'; 
      this.style.zIndex = '10'; 
      this.style.transform = 'scale(1)'; 
      resetLayerStyle(layer); // Reset the layer's appearance on the map
    };

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
  
    var xScaleFactor = (viewBoxSize) / (maxX - minX);
    var yScaleFactor = (viewBoxSize) / (maxY - minY);
    // Take the mean of the x and y scale factors to make sure the map is scaled proportionally
    var scaleFactor = (xScaleFactor + yScaleFactor) / 2;
    xScaleFactor = scaleFactor;
    yScaleFactor = scaleFactor;
  
    function createSVGElement(type, attributes) {
      const element = document.createElementNS('http://www.w3.org/2000/svg', type);
      
      for (let attr in attributes) {
          element.setAttribute(attr, attributes[attr]);
      }
  
      return element;
    }
    

    function createPolygonElement(points, svgColor, weight) {
        return createSVGElement('polygon', {
            'points': points,
            'fill': svgColor,
            'stroke': svgColor,
            'stroke-width': weight
        });
    }
    
    function createCircleMarkerElement(xloc, yloc, svgColor, weight) {
        return createSVGElement('circle', {
            'cx': xloc,
            'cy': yloc,
            'r': "3",
            'fill': svgColor,
            'stroke': svgColor,
            'stroke-width': weight
        });
    }
    
    function createCircleElement(xloc, yloc, radius, svgColor, weight) {
        return createSVGElement('circle', {
            'cx': xloc,
            'cy': yloc,
            'r': radius,
            'fill': svgColor,
            'stroke': svgColor,
            'stroke-width': weight
        });
    }


    if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
        const latLngs = layer.getLatLngs();
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
        const polygonElement = createPolygonElement(points, svgColor, layer.options.weight);
        svgContainer.appendChild(polygonElement);
    } else if (layer instanceof L.CircleMarker && !(layer instanceof L.Circle)) {
        const latLng = layer.getLatLng();
        const projected = map.project(latLng);
        const xloc = (projected.x - minX) * xScaleFactor;
        const yloc = (projected.y - minY) * yScaleFactor;
        const circleMarker = createCircleMarkerElement(xloc, yloc, svgColor, layer.options.weight);
        svgContainer.appendChild(circleMarker);
    } else if (layer instanceof L.Circle) {
        const latLng = layer.getLatLng();
        const projected = map.project(latLng);
        const xloc = (projected.x - minX) * xScaleFactor;
        const yloc = (projected.y - minY) * yScaleFactor;
        const radius = layer.getRadius() * xScaleFactor * 0.1;
        const circleElement = createCircleElement(xloc, yloc, radius, svgColor, layer.options.weight);
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

    /**
     * This function creates and returns a dropdown container
     * 
     * @returns {HTMLElement} - The created dropdown container
     */
    function createDropdownContainer() {
      const dropDownContainer = document.createElement('div');
      dropDownContainer.innerHTML = '<span class="loading-spinner"></span>';
      return dropDownContainer;
    }

    /**
     * This function shows the dropdown container on mouse enter and hides it on mouse leave with delay
     * 
     * @param {HTMLElement} cell - The cell element the event listeners are added to
     * @param {HTMLElement} dropDownContainer - The dropdown container to be shown or hidden
     */
    function addMouseEventsWithDelay(cell, dropDownContainer, display) {
      let timeoutId;

      cell.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
        dropDownContainer.style.display = display;
      });

      cell.addEventListener('mouseleave', () => {
        timeoutId = setTimeout(() => {
          dropDownContainer.style.display = 'none';
        }, 100); // 500 milliseconds delay
      });
    }

    // // get the width of the previewContainer
    // const dropDownContainerWidth = previewContainer.getBoundingClientRect().width;
    // console.log(dropDownContainerWidth);
    // // get svgContainer width
    // const svgContainerWidth = cell.getBoundingClientRect().width;
    // console.log(svgContainerWidth);

    const dropDownContainer = createDropdownContainer();

    if (layer instanceof L.Polygon || layer instanceof L.Rectangle || ((layer instanceof L.CircleMarker) && layer instanceof L.Circle)){
      dropDownContainer.classList.add('drop-down-container-polygon');
      addMouseEventsWithDelay(cell, dropDownContainer, 'grid');
      fetchDataOverFeature(map, layer, dropDownContainer, titilerConfig,searchBody, addedGeoTiffLayers, layerControl);
      
    } else if (layer instanceof L.CircleMarker){
      dropDownContainer.classList.add('drop-down-container-circle-marker');
      addMouseEventsWithDelay(cell, dropDownContainer, 'block');
      fetchDataTS(map, layer, dropDownContainer, titilerConfig, layerControl, addedGeoTiffLayers, searchBody, previewBoxWidth);
    }
    
    cell.appendChild(previewContainer);
    // Append the drop-down container to the preview container
    cell.appendChild(dropDownContainer);  

    return cell;
  }
export { createFeaturePreview };
