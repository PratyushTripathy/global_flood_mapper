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