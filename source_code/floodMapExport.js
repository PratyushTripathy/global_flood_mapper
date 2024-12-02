// This function will be called by the main script to download the flood map.

// Define a function to smoothen the raster and export the shapefile
var getFloodShpUrl = function(floodLayer, value, radius, aoi, cellSize, filename){
  // Define a boxcar or low-pass kernel.
  var boxcar = ee.Kernel.square({
    radius: radius, units: 'pixels', magnitude: 1
  });
  
  // Smoothen and threshold the binary flood raster
  var smooth_flood = floodLayer.eq(value).convolve(boxcar);
  var smooth_flood_binary = smooth_flood.updateMask(smooth_flood.gt(0.5)).gt(0)
  
  // Vectorise the binary flood raster
  var vectors = smooth_flood_binary.reduceToVectors({
    geometry: aoi,
    crs: floodLayer.projection(),
    scale: cellSize,
    geometryType: 'polygon',
    eightConnected: false,
    labelProperty: 'zone',
    maxPixels: 9e12
    });
  
  // Convert the vector to feature collection
  var flood_vector = ee.FeatureCollection(vectors);
  
  // print download url
  var vector_url = flood_vector.getDownloadURL('kml', [], filename)
  
  return(vector_url)
}

exports.getFloodShpUrl = getFloodShpUrl;


// Define a function to smoothen the map and export the TIFF
var getFloodTiffUrl = function(floodLayer, value, radius, aoi, cellSize, filenamePrefix) {
  // Get the bounding box of the AOI
  var bounds = aoi.bounds();
  var coords = ee.List(bounds.coordinates().get(0));

  // Extract coordinates for splitting
  var minLon = ee.Number(ee.List(coords.get(0)).get(0));
  var minLat = ee.Number(ee.List(coords.get(0)).get(1));
  var maxLon = ee.Number(ee.List(coords.get(2)).get(0));
  var maxLat = ee.Number(ee.List(coords.get(2)).get(1));

  // Calculate longitude and latitude intervals for splitting into a 2x5 grid
  var lonStep = maxLon.subtract(minLon).divide(5); // 5 columns
  var latStep = maxLat.subtract(minLat).divide(2); // 2 rows

  // Define 10 AOIs for a 2x5 grid
  var subAois = [];
  for (var row = 0; row < 2; row++) {
    for (var col = 0; col < 5; col++) {
      var subAoi = ee.Geometry.Rectangle([
        minLon.add(lonStep.multiply(col)),         // Left longitude
        minLat.add(latStep.multiply(row)),         // Bottom latitude
        minLon.add(lonStep.multiply(col + 1)),     // Right longitude
        minLat.add(latStep.multiply(row + 1))      // Top latitude
      ]);
      subAois.push(subAoi);
    }
  }

  // Process each sub-AOI and generate download URLs
  var curlCommands = subAois.map(function(subAoi, index) {
    // Define a boxcar or low-pass kernel
    var boxcar = ee.Kernel.square({
      radius: radius, units: 'pixels', magnitude: 1
    });

    // Smoothen and threshold the binary flood raster
    var smooth_flood = floodLayer.eq(value).convolve(boxcar);
    var smooth_flood_binary = smooth_flood.updateMask(smooth_flood.gt(0.5)).gt(0);

    // Ensure the raster has the correct mask and bands for export
    var flood_image = smooth_flood_binary.selfMask().rename('FloodMap');

    var filename = filenamePrefix + '_Part' + (index + 1);

    // Generate the download URL for the GeoTIFF
    var tiff_url = flood_image.getDownloadURL({
      name: filename,
      crs: 'EPSG:4326',
      scale: cellSize,
      region: subAoi,
      format: 'GeoTIFF'
    });

    // Generate the partial curl command for the link
    return ' -L -o file' + index + '.tif ' + tiff_url;
  });
  
  // Generate the combined curl command
  var curlCommandsString = 'curl' + curlCommands.join('');
  
  return curlCommandsString;
};


exports.getFloodTiffUrl = getFloodTiffUrl;
