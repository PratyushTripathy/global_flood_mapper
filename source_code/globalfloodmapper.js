/*
Global Flood Mapper (GFM) v2 - Combined scripts version
Scroll to "MAIN APPLICATION CODE" for the GFM UI code.
*/

var aoiFilter = require('users/aarnavagrawal/gfm-final:countrystates');

// ===== Module: availabilityGraph =====
var availabilityGraph = {
  generateCollectionChart: function(collection) {
    var range = collection.reduceColumns(ee.Reducer.toList(), ["system:time_start"])
        .values().get(0);
    range = ee.List(range)
        .map(function(n){
          return ee.Date(n).format("YYYY-MM-dd");
        });
    
    var availability_dict = range.reduce(ee.Reducer.frequencyHistogram());
    var availability_dict = ee.Dictionary(availability_dict);
    
    var chart = ui.Chart.array.values(availability_dict.values(), 0, availability_dict.keys())
        .setChartType("ColumnChart")
        .setOptions({
          width: 100,
          height: 40,
          title: "Sentinel-1 Image Availability",
          hAxis: {title: 'Date'},
          vAxis: {title: 'Number of images'}
        });
      
    return chart;
  }
};

// ===== Module: availabilityGraphStacked =====
var availabilityGraphStacked = {
  generateCollectionChart: function(collection) {
    var asc_collection = collection.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
    var desc_collection = collection.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
    
    var asc_range = asc_collection.reduceColumns(ee.Reducer.toList(), ["system:time_start"])
        .values().get(0);
    asc_range = ee.List(asc_range)
        .map(function(n){
          return ee.Date(n).format("YYYY-MM-dd");
        });
    var desc_range = desc_collection.reduceColumns(ee.Reducer.toList(), ["system:time_start"])
        .values().get(0);
    desc_range = ee.List(desc_range)
        .map(function(n){
          return ee.Date(n).format("YYYY-MM-dd");
        });
    
    var all_dates = asc_range.distinct().cat(desc_range.distinct()).distinct().sort();
  
    var asc_avail_dict = asc_range.reduce(ee.Reducer.frequencyHistogram());
    var asc_avail_dict = ee.Dictionary(asc_avail_dict);
    var desc_avail_dict = desc_range.reduce(ee.Reducer.frequencyHistogram());
    var desc_avail_dict = ee.Dictionary(desc_avail_dict);
    
    var asc_feat = asc_avail_dict.map(function(date, n){
      return ee.Feature(ee.Geometry.Point(77.58, 13), {label: date, number_images:n, ascending: n, descending: 0, weight:1});
    }).values();
    
    var desc_feat = desc_avail_dict.map(function(date, n){
      return ee.Feature(ee.Geometry.Point(77.58, 13), {label: date, number_images:n, ascending:0, descending: n, weight:1});
    }).values();
    
    var asc_desc = asc_feat.cat(desc_feat);
    var asc_desc_collection = ee.FeatureCollection(asc_desc);
    
    // map over dates
    var merged_collection = ee.FeatureCollection(all_dates.map(function(date){
      var new_feat_collection1 = asc_desc_collection.filter(ee.Filter.equals('label', date));
      var asc_sum = new_feat_collection1.reduceColumns({
        reducer: ee.Reducer.sum(),
        selectors: ['ascending'],
        weightSelectors: ['weight']
        }).get('sum');
      
      var new_feat_collection2 = asc_desc_collection.filter(ee.Filter.equals('label', date));
      var desc_sum = new_feat_collection2.reduceColumns({
        reducer: ee.Reducer.sum(),
        selectors: ['descending'],
        weightSelectors: ['weight']
        }).get('sum');
        
      var merged = asc_desc_collection.filter(ee.Filter.equals('label', date))
        .union().first()
        .set({label:date, Ascending:asc_sum, Descending:desc_sum});
      return(merged);
    }));
    
    // Define the chart and print it to the console.
    var chart = ui.Chart.feature
      .byFeature({
        features: merged_collection.select('Ascending', 'Descending', 'label'),
        xProperty: 'label'
      })
      .setChartType('ColumnChart')
      .setOptions({
        width: 100,
        height: 40,
        title: 'Sentinel-1 Image Availability',
        hAxis: {title: 'Dates', titleTextStyle: {italic: false, bold: true}},
        vAxis: {title: 'Number of images',
                titleTextStyle: {italic: false, bold: true}
        },
        colors: ['C70039', '581845'],
        isStacked: 'absolute'
      });
      
    return(chart);
  }
};

// ===== Module: floodLegend =====
var floodLegend = {
  legend: function() {
    // Add a legend to the maps
    // set position of panel
    var legend = ui.Panel({
      style: {
        position: 'bottom-right',
        padding: '8px 15px'
      }
    });
     
    // Create legend title
    var legendTitle = ui.Label({
      value: 'Flood Map Legend',
      style: {
        fontWeight: 'bold',
        fontSize: '16px',
        margin: '0 0 0 0',
        padding: '0'
        }
    });
     
    // Add the title to the panel
    legend.add(legendTitle);
    
    // Creates and styles 1 row of the legend.
    var makeRow = function(color, name) {
     
          // Create the label that is actually the colored box.
          var colorBox = ui.Label({
            style: {
              backgroundColor: '#' + color,
              // Use padding to give the box height and width.
              padding: '8px',
              margin: '0 0 0 0'
            }
          });
     
          // Create the label filled with the description text.
          var description = ui.Label({
            value: name,
            style: {fontSize: '12px', margin: '0 0 4px 6px'}
          });
     
          // return the panel
          return ui.Panel({
            widgets: [colorBox, description],
            layout: ui.Panel.Layout.Flow('horizontal')
          });
    };
  
    // name of the legend
    var names = ['Permanent Open Water',
                 'High-confidence Flood',
                 'Low-confidence Flood',
                 'Non-water'];
    //  Palette with the colors
    var palette =['031DC9', 'D20103', 'F8E806', 'E3E3E3'];
    // Add color and and names
    for (var i = 0; i < palette.length; i++) {
      legend.add(makeRow(palette[i], names[i]));
      }
      
    legend.add(ui.Label({
      value: 'See details on GitHub',
      style: {fontSize: '12px', margin: '0 0 0 0', padding:'4px'},
      targetUrl: 'https://github.com/PratyushTripathy/global_flood_mapper'
      }));
      
    return legend;
  }
};

// ===== Module: floodMapExport =====
var floodMapExport = {
  // Define a function to smoothen the raster and export the shapefile
  getFloodShpUrl: function(floodLayer, radius, aoi, cellSize, filename) {
    // Define a boxcar or low-pass kernel.
    var boxcar = ee.Kernel.square({
      radius: radius, units: 'pixels', magnitude: 1
    });
    
    //low-confidence flood export
    var low_flood = floodLayer.eq(1).or(floodLayer.eq(2)).convolve(boxcar);
    var low_flood_binary = low_flood.updateMask(low_flood.gt(0.5)).gt(0);
    
    var low_vectors = low_flood_binary.reduceToVectors({
      geometry: aoi,
      crs: floodLayer.projection(),
      scale: cellSize,
      geometryType: 'polygon',
      eightConnected: false,
      labelProperty: 'zone',
      maxPixels: 9e12
      });
    
    var low_vector_features = ee.FeatureCollection(low_vectors);
    
    // print download url
    var low_vector_url = low_vector_features.getDownloadURL({
      format: 'shp',
      filename: filename
    });

    Export.table.toDrive({
      collection: low_vectors,
      description: 'Flood_Map_SHP_LowConf',
      folder:      'GFM_Flood_Exports',  
      fileNamePrefix: 'SHP_flood_map_low',
      fileFormat: 'SHP'
    });

    
    //high-confidence flood export
    var high_flood = floodLayer.eq(3).convolve(boxcar);
    var high_flood_binary = high_flood.updateMask(high_flood.gt(0.5)).gt(0);
    
    var high_vectors = high_flood_binary.reduceToVectors({
      geometry: aoi,
      crs: floodLayer.projection(),
      scale: cellSize,
      geometryType: 'polygon',
      eightConnected: false,
      labelProperty: 'zone',
      maxPixels: 9e12
    });
    
    var high_vector_features = ee.FeatureCollection(high_vectors);
    
    // print download url
    var high_vector_url = high_vector_features.getDownloadURL({
      format: 'shp',
      filename: filename
    });

    Export.table.toDrive({
      collection: high_vectors,
      description: 'Flood_Map_SHP_HighConf',
      folder:      'GFM_Flood_Exports',  
      fileNamePrefix: 'SHP_flood_map_high',
      fileFormat: 'SHP'
    });
    
    
    return ee.List([low_vector_url, high_vector_url]);
  },
  
  // Define a function to smoothen the map and export the TIFF
  getFloodTiffUrl: function(floodLayer, radius, aoi, cellSize, filename) {
  
    // Define a boxcar or low-pass kernel.
    var boxcar = ee.Kernel.square({
      radius: radius, units: 'pixels', magnitude: 1
    });
    
    var visParams = {
      min:     1,
      max:     4,
      palette: [
        '#E3E3E3', // 0 - non-water; non-flood
        '#F8E806', // 1 - VV only
        '#F8E806', // 2 - VH only
        '#D20103', // 3 - VV + VH
        '#031DC9'  // 4 - Permanent open water
      ]
    };
    var colored = floodLayer.visualize(visParams);
    
    // download url
    var tiff_url = colored.getDownloadURL({
      region: aoi,
      scale: cellSize,
      crs: "EPSG:4326",
      format: 'GEO_TIFF',
      }
    );

    Export.image.toDrive({
      image: colored,   
      description: 'Flood_Map_TIFF',
      folder:      'GFM_Flood_Exports_TIFF',
      fileNamePrefix: 'TIFF_Flood_Map',
      region:      aoi,
      scale:       cellSize,
      crs:         "EPSG:4326",
      fileFormat:  'GeoTIFF'      
    });
    
    return tiff_url;
  
  }
};

// ===== Module: mapFloods =====
var mapFloods = {
  mapFloods: function(
    z, // ee.Image of z-score with bands "VV" and "VH"
    zvv_thd, // VV Z-score threshold
    zvh_thd, // VH Z-score threshold
    pow_thd,
    elev_thd,
    slp_thd) // Open water threshold (%)
  
    {
    // defaults
    if(!zvv_thd) {
      zvv_thd = -3;
    }
    if(!zvh_thd) {
      zvh_thd = -3;
    }
    if(!pow_thd) {
      pow_thd = 75;
    }
    if(!elev_thd) {
      elev_thd = 800;
    }
    if(!slp_thd) {
      slp_thd = 15;
    }
    
    // JRC water mask
    var jrc = ee.ImageCollection("JRC/GSW1_1/MonthlyHistory")
      .filterDate('2016-01-01', '2019-01-01');
    var jrcvalid = jrc.map(function(x) {return x.gt(0);}).sum();
    var jrcwat = jrc.map(function(x) {return x.eq(2);}).sum().divide(jrcvalid).multiply(100);
    var jrcmask = jrcvalid.gt(0);
    var ow = jrcwat.gte(ee.Image(pow_thd));
    
    // add elevation and slope masking
    var elevation = ee.ImageCollection('COPERNICUS/DEM/GLO30').mosaic().select('DEM');
    var slope = ee.Terrain.slope(elevation);
  
    // Classify floods
    var vvflag = z.select('VV').lte(ee.Image(zvv_thd));
    var vhflag = z.select('VH').lte(ee.Image(zvh_thd));
  
    var flood_class = ee.Image(0)
      .add(vvflag) 
      .add(vhflag.multiply(2))
      .where(ow.eq(1), 4)
      .rename('flood_class')
      //.updateMask(jrcmask)
      .where(elevation.gt(elev_thd).multiply(ow.neq(1)), 0)
      .where(slope.gt(slp_thd).multiply(ow.neq(1)), 0);
  
    return flood_class;
  },
  
  palette: [
    '#E3E3E3', // 0 - non-water; non-flood
    '#F8E806', // 1 - VV only
    '#F8E806', // 2 - VH only
    '#D20103', // 3 - VV + VH
    '#031DC9'  // 4 - Permanent open water
  ]

};

// ===== Module: zScore =====
var zScore = {
  // Z-score
  calc_zscore: function(s1_collection_t1, s1_collection_t2, mode, direction) {
    var base_mean = s1_collection_t1
      .filter(ee.Filter.equals('orbitProperties_pass', direction))
      .mean();
    
    var anom = s1_collection_t2
      .filter(ee.Filter.equals('orbitProperties_pass', direction))
      .mean()
      .subtract(base_mean)
      .set({'system:time_start': s1_collection_t2.get('system:time_start')});
    
    var base_sd = s1_collection_t1
      .filter(ee.Filter.equals('orbitProperties_pass', direction))
      .reduce(ee.Reducer.stdDev())
      .rename(['VV', 'VH', 'angle']);
        
    return anom.divide(base_sd)
      .set({'system:time_start': anom.get('system:time_start')});
  }
};

// ===== Module: zScoreBasic =====
var zScoreBasic = {
  // Z-score
  calc_zscore: function(s1_collection_t1, s1_image_t2) {
    var anom = s1_image_t2
      .mean()
      .subtract(s1_collection_t1.mean())
      .set({'system:time_start': s1_image_t2.get('system:time_start')});
        
    var basesd = s1_collection_t1
      .reduce(ee.Reducer.stdDev())
      .rename(['VV', 'VH', 'angle']);
    
    return anom.divide(basesd)
      .set({'system:time_start': anom.get('system:time_start')});
  }
};

// ===== MAIN APPLICATION CODE =====
var aoi = 0;
var drawnAOI = false; //checks if the aoi displayed is drawn by the user or selected through the dropdowns

// Define a function to update aoi
function updateAoi(level_0, level_1, ret) {
  aoi = ee.FeatureCollection("FAO/GAUL/2015/level1")
        .filter(ee.Filter.equals('ADM0_NAME', level_0))
        .filter(ee.Filter.equals('ADM1_NAME', level_1))
        .geometry();
  if (ret === true) {
    return(aoi);
  }
}

aoi = ee.Geometry.BBox(-51.614718769210214, -30.026983088996428, -51.15466627897584, -29.818991150568596);

if (ui.url.get('pfd0', null) !== null && ui.url.get('country', null) === null) {
  var leftLon  = parseFloat(ui.url.get('llong')),
      leftLat  = parseFloat(ui.url.get('llat')),
      rightLon = parseFloat(ui.url.get('rlong')),
      rightLat = parseFloat(ui.url.get('rlat'));
  aoi = ee.Geometry.Rectangle([ leftLon, leftLat, rightLon, rightLat ]);
}

// Define a default start date
var start_date = [ee.Date('2020-05-01'), ee.Date('2024-05-08')];

var advance_days;
if(ui.url.get('pfd0', null) !== null) {
  var preFloodDays = parseInt(ui.url.get('sd0'));
  var duringFloodDays = parseInt(ui.url.get('sd1'));
  advance_days = [preFloodDays, duringFloodDays];
}
else{
  advance_days = [60, 8];
}
// Create widgets for the advanced version of the app
var init_zvv_thd = -3;
var init_zvh_thd = -3;
var init_pow_thd = 75;
var init_elev_thd = 900;
var init_slp_thd = 15;

// Create text boxes for advanced tool
var zvv_thd_text = ui.Textbox({value: init_zvv_thd,
  onChange: function(value) {
    init_zvv_thd = value;
    updateFloodMap();
  },
  style: {maxWidth: '45px', padding: '0px'}
});
var zvh_thd_text = ui.Textbox({value: init_zvh_thd,
  onChange: function(value) {
    init_zvh_thd = value;
    updateFloodMap();
  },
  style: {maxWidth: '45px', padding: '0px'}
});
var pow_thd_text = ui.Textbox({value: init_pow_thd,
  onChange: function(value) {
    init_pow_thd = value;
    updateFloodMap();
  },
  style: {maxWidth: '45px', padding: '0px'}
});
var elev_thd_text = ui.Textbox({value: init_elev_thd,
  onChange: function(value) {
    init_elev_thd = value;
    updateFloodMap();
  },
  style: {maxWidth: '50px', padding: '0px'}
});
var slp_thd_text = ui.Textbox({value: init_slp_thd,
  onChange: function(value) {
    init_slp_thd = value;
    updateFloodMap();
  },
  style: {maxWidth: '35px', padding: '0px'}
});

var pass_options = ['Combined', 'Separate', 'Ascending', 'Descending'];
var pass_dd = ui.Select({items: pass_options,
  value: 'Combined',
  onChange: function() {
    updateFloodMap();
  }
});

// Modify the function from DeVries to fit the needs
function getFloodImage(s1_collection_t1, s1_collection_t2) {
  // Z-score thresholds using user-defined values
  
  // Compute Z-scores per instrument mode and orbital direction
  if (pass_dd.getValue() == pass_options[0]) {
    var z = zScoreBasic.calc_zscore(s1_collection_t1, s1_collection_t2);
  
  } else if (pass_dd.getValue() == pass_options[1]) {
    var z_iwasc = zScore.calc_zscore(s1_collection_t1, s1_collection_t2, 'IW', 'ASCENDING');
    var z_iwdsc = zScore.calc_zscore(s1_collection_t1, s1_collection_t2, 'IW', 'DESCENDING');
    // DeVries take mosaic because they deal with entire collection and need the last image
    // only. Since GFM explicitly passes time 2 collection, mean should be fine.
    var z = ee.ImageCollection.fromImages([z_iwasc, z_iwdsc]).mean();
  
  } else if (pass_dd.getValue() == pass_options[2]) {
    var z = zScore.calc_zscore(s1_collection_t1, s1_collection_t2, 'IW', 'ASCENDING');
    
  } else if (pass_dd.getValue() == pass_options[3]) {
    var z = zScore.calc_zscore(s1_collection_t1, s1_collection_t2, 'IW', 'DESCENDING');
  }
  
  var floods = mapFloods.mapFloods(z, parseInt(init_zvv_thd), parseInt(init_zvh_thd), 
    parseInt(init_pow_thd), parseInt(init_elev_thd), parseInt(init_slp_thd));
  
  return(floods.clip(aoi));
}

// Create a function for getting updated Sentinel-1 collection
function getSentinel1WithinDateRange(date, span) {
  var filters = [
    ee.Filter.listContains("transmitterReceiverPolarisation", "VV"),
    ee.Filter.listContains("transmitterReceiverPolarisation", "VH"),
    ee.Filter.or(
      ee.Filter.equals("instrumentMode", "IW")
      ),
    ee.Filter.bounds(aoi),
    ee.Filter.eq('resolution_meters', 10),
    ee.Filter.date(date, date.advance(span+1, 'day'))
  ];
  
  var s1_collection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filter(filters);

  return s1_collection;
}

function createS1Composite(s1_collection) {
  var composite = ee.Image.cat([
    s1_collection.select('VH').mean(),
    s1_collection.select('VV').mean(),
    s1_collection.select('VH').mean()
    ]);
    
  return composite.clip(aoi);
}

// Create a function for getting updated Sentinel-2 collection
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask);
}

function getSentinel2WithinDateRange(date, span) {
  var sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                    .filterBounds(aoi)
                    .filterDate(date, date.advance(span+1, 'day'))
                    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 70))
                    .map(maskS2clouds)
                    .select('B4', 'B3', 'B2');
                    
  return sentinel2.mean().clip(aoi);
}

// Create a function to generate Image dynamically
function getS1Image(index) {
  var s1_collection = getSentinel1WithinDateRange(start_date[index], advance_days[index]);
  return createS1Composite(s1_collection);
}

function getS2Image(index) {
  return getSentinel2WithinDateRange(start_date[index], advance_days[index]);
}

var s1RawVizParams = {min: [-25, -20, -25], max: [0, 10, 0]};
var s2RawVizParams = {bands: ['B4', 'B3', 'B2'], max: 3048, gamma: 1};
var show_left_sar = true;
var show_right_sar = true;
var show_left_optical = false;
var show_right_optical = false;
var selectedState;
var selectedCountry;

// Adds a layer selection widget to the given map, to allow users to change
// which image is displayed in the associated map.
function addLayerSelector(mapToChange, defaultValue, position) {
  var statesDD, countryDD;
  var panelHeading = (defaultValue == '0') ? 
      ui.Label("Pre-flood panel", {fontSize:'18px', fontWeight:'bold'}) : 
      ui.Label("During-flood panel", {fontSize:'18px', fontWeight:'bold'});
  var label = (defaultValue == '0') ? ui.Label("Pre-flood date range:") : ui.Label("During-flood date range:");
  var show_optical = (defaultValue == '0') ? show_left_optical : show_right_optical;
  var show_sar = (defaultValue == '0') ? show_left_sar : show_right_sar;
  
  var controlPanel = ui.Panel({style: {position: position, width:'18%'}});
  // Add panel heading
  controlPanel.add(panelHeading);
  // Add text to point towards the chart
  controlPanel.add(
    ui.Label('Data availability chart:',
      {stretch: 'vertical', textAlign: 'left'})
      );
  
  // This function changes the given map to show the selected image.
  function updateMap() {
    mapToChange.layers().set(0, ui.Map.Layer(getS1Image(defaultValue), s1RawVizParams, 'Sentinel-1', show_sar));
    mapToChange.layers().set(1, ui.Map.Layer(getS2Image(defaultValue), s2RawVizParams, 'Sentinel-2', show_optical));
    
    if (defaultValue == 1) {
      mapToChange.layers().set(2, ui.Map.Layer(
        getFloodImage(getSentinel1WithinDateRange(start_date[0], advance_days[0]), 
                      getSentinel1WithinDateRange(start_date[1], advance_days[1])), 
        {palette: mapFloods.palette}, 'Flood Map', true));
    }
  }

  // Add dropdown for states first so that
  // it can be updated from within country dropdown
  var leftSubPanel1 = ui.Panel({
    layout: ui.Panel.Layout.flow('horizontal'),
    style:{width: '100%'}
  });
  
  countryDD = ui.Select({items:[], placeholder:'Loading..', 
    style:{fontSize:'14px', color:'blue', width:'40%', padding:'0px'}});
  statesDD = ui.Select({items:[], placeholder:'State', 
    style:{fontSize:'14px', color:'blue', width:'40%', padding:'0px'}});
  
  var countryNames = ee.List(Object.keys(aoiFilter.countries).sort());
  countryNames.evaluate(function(states){
    countryDD.items().reset(states);
    if(ui.url.get('country', null) !== null && ui.url.get('state', null) !== null) {
      countryDD.setPlaceholder(ui.url.get('country'));
    }
    else {
      countryDD.setPlaceholder('Country');
    }
    countryDD.onChange(function(state){
      selectedCountry = state;
      // once you select a state (onChange) get all counties and fill the dropdown
      statesDD.setPlaceholder('Loading...');
      var counties = ee.List(aoiFilter.countries[state]);
      //print(counties)
      counties.evaluate(function(countiesNames){
        statesDD.items().reset(countiesNames);
        statesDD.setPlaceholder('State');
      });
    });
  });
  statesDD.onChange(function(value){
    selectedState = value;
    drawnAOI = false;
    updateAoi(countryDD.getValue(), value, false);
    // Using updateMap() function here will only update one map
    updateBothMapPanel();
  });


  if(ui.url.get('country', null) !== null && ui.url.get('state', null) !== null) {
    var country = ui.url.get('country');
    var state = ui.url.get('state');
    countryDD.setPlaceholder(country);
    statesDD.setPlaceholder(state);
    updateAoi(country, state, false);
  }
  leftSubPanel1.add(countryDD);
  leftSubPanel1.add(statesDD);


  // Add the date slider for both the maps
  var dateSlider = ui.DateSlider({
    // MM-DD-YYYY
    start: ee.Date('2015-01-01'),
    period: 1,
    onChange:function renderedDate(dateRange) {
      start_date[defaultValue] = dateRange.start();
      updateMap();
      updateFloodMap();
      updateChart(mapToChange, defaultValue, controlPanel);
    }});
    
  if(ui.url.get('pfd0', null) !== null) {
    var preFloodDate = ui.url.get('pfd0');
    var duringFloodDate = ui.url.get('dfd0');
    start_date = [ee.Date(preFloodDate), ee.Date(duringFloodDate)];
    dateSlider = dateSlider.setValue(start_date[defaultValue].format('Y-MM-dd').getInfo());
  }
  else{
    // Set the default date of the date slider from the actual map dates
    dateSlider = dateSlider.setValue(start_date[defaultValue].format('Y-MM-dd').getInfo());
  }
  
  // Add the text box for users to enter the desired span
  var text_box = ui.Textbox({
    placeholder: "Succeeding days - e.g. "+String(advance_days[defaultValue]),
    onChange: function updateDate(text) {
      advance_days[defaultValue] = Number(text);
      updateMap();
      updateFloodMap();
      updateChart(mapToChange, defaultValue, controlPanel);
    }});
  
  if(ui.url.get('pfd0', null) !== null) {
    text_box.setValue(advance_days[defaultValue]);
  }
  
  
  // Set a common title
  var title = ui.Label('Global Flood Mapper',
  {
    stretch: 'horizontal',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '16px'
  });
  
  // use the legend module to create the legend for flood layer
  var legend = floodLegend.legend();
    
  // Create main control panel
  // Add area selector in the left panel only
  if(defaultValue == 0) {
    var dd_heading = ui.Label("Select area of interest:");
    controlPanel.add(dd_heading);
    controlPanel.add(leftSubPanel1);
    controlPanel.add(
      ui.Button({
        label: 'Draw AOI',
        style: {stretch: 'horizontal'},
        onClick: function() {
          drawnAOI = true;
          leftMap.drawingTools().clear();
          leftMap.drawingTools().setShown(false);
          leftMap.drawingTools().setShape('rectangle');
          leftMap.drawingTools().draw();
          
          leftMap.drawingTools().onDraw(function(geometry) {
            leftMap.drawingTools().stop();
            leftMap.drawingTools().clear();
            rightMap.drawingTools().stop();
            rightMap.drawingTools().clear();
            aoi = geometry;
            updateBothMapPanel();
          });
          
          rightMap.drawingTools().clear();
          rightMap.drawingTools().setShown(false);
          rightMap.drawingTools().setShape('rectangle');
          rightMap.drawingTools().draw();
          
          rightMap.drawingTools().onDraw(function(geometry) {
            rightMap.drawingTools().stop();
            rightMap.drawingTools().clear();
            leftMap.drawingTools().stop();
            leftMap.drawingTools().clear();
            aoi = geometry;
            updateBothMapPanel();
          });
        }
      })    
    );    
  }
  
  // Add common widgets
  controlPanel.add(label);
  controlPanel.add(dateSlider);
  controlPanel.add(text_box);
  
  // Add download button to the right panel
  if(defaultValue == 1) {
    controlPanel.add(
      ui.Label('Go to Flood Impact Portal',
      {stretch: 'horizontal', textAlign: 'left',
      fontSize:'16px', fontWeight:'bold'}));

    var portal_button = ui.Button({
      label: 'Launch Flood Impact Portal',
      onClick: function(){
        displayFloodImpactPortal(aoi);  
      }
    });
    
    var link_button = ui.Button({
      label: 'Get Shareable URL',
      onClick: function() {
        updateLink(selectedState, selectedCountry);
      }
    });
    
    
    controlPanel.add(portal_button);
    controlPanel.add(link_button);

      
    controlPanel.add(
      ui.Label('Download Flood Map',
      {stretch: 'horizontal', textAlign: 'left',
      fontSize:'16px', fontWeight:'bold'}));
    
    // Create sub-panel to accomodate buttons
    var rightSubPanel1 = ui.Panel({
      layout: ui.Panel.Layout.flow('horizontal', true),
      style:{width: '100%'}});
    var rightSubPanel2 = ui.Panel({
      layout: ui.Panel.Layout.flow('horizontal', true),
      style:{width: '100%'}});
    var exportControls = ui.Panel({
      layout: ui.Panel.Layout.flow('horizontal', true),
      style:{width: '100%'}});
    
    // Add button and link to download flood shapefile
    
    var shp_download_button = ui.Button({
      label: 'SHP',
      onClick: function() {
        exportControls.clear();
        // Smoothing Radius Slider (affects both smoothing values)
        var shpSmoothingSliderLabel = ui.Label('Smoothing Radius');
        var shpSmoothingSlider = ui.Slider({
          min: 1,
          max: 10,
          value: 3,
          step: 1,
          style: {width: '100%'},
        });
  
        // Cell Size Slider (affects the cell size)
        var shpCellSizeLabel = ui.Label('Cell Size');
        var shpCellSizeSlider = ui.Slider({
          min: 10,
          max: 1000,
          value: 100,
          step: 10,
          style: {width: '100%'},
        });
  
        // Confirm Button
        var shpConfirmButton = ui.Button({
          label: 'Confirm',
          onClick: function() {
            var smoothingValue = shpSmoothingSlider.getValue();
            var cellSizeValue = shpCellSizeSlider.getValue();
  
            var flood_image = rightMap.layers().get(2).getEeObject();
            var urls = floodMapExport.getFloodShpUrl(
              flood_image,
              smoothingValue,
              aoi,
              cellSizeValue,
              'GFM_' +
                start_date[0].format('YYYYMMdd').getInfo() + '_' +
                start_date[1].format('YYYYMMdd').getInfo() + '_' +
                aoi.bounds().coordinates().get(0).getInfo()[0][1].toFixed(2) + '_' +
                aoi.bounds().coordinates().get(0).getInfo()[0][0].toFixed(2) + '_' +
                aoi.bounds().coordinates().get(0).getInfo()[2][1].toFixed(2) + '_' +
                aoi.bounds().coordinates().get(0).getInfo()[2][0].toFixed(2) + '_' +
                cellSizeValue+'m_SR'+smoothingValue
            );
            
            urls.evaluate(function(urlList){
              var lowUrl = urlList[0];
              var highUrl = urlList[1];
              
              var shp_label_1 = ui.Label('SHP link (Low Confidence)', {shown: true});
              shp_label_1.setUrl(lowUrl);
            
              var shp_label_2 = ui.Label('SHP link (High Confidence)', {shown: true});
              shp_label_2.setUrl(highUrl);

              rightSubPanel2.add(shp_label_1);
              rightSubPanel2.add(shp_label_2);

            });

            shpSmoothingSliderLabel.style().set({shown: false});
            shpSmoothingSlider.style().set({shown: false});
            shpCellSizeLabel.style().set({shown: false});
            shpCellSizeSlider.style().set({shown: false});
            shpConfirmButton.style().set({shown: false});
          }
        });
  
        // Add the sliders and confirm button to the existing right-hand panel
        exportControls.add(shpSmoothingSliderLabel);
        exportControls.add(shpSmoothingSlider);
        exportControls.add(shpCellSizeLabel);
        exportControls.add(shpCellSizeSlider);
        exportControls.add(shpConfirmButton);
        rightSubPanel1.remove(exportControls);
        rightSubPanel1.add(exportControls);
        
        
      }
    });
    
    // Add button and link to download flood PNG map
    var png_label = ui.Label('PNG link', {shown: false});
    var png_download_button = ui.Button({
      label: 'PNG',
      onClick: function() {
        var flood_image = rightMap.layers().get(2).getEeObject();
        var pngToExport = flood_image.visualize({'min':0, 'max':4, 'palette':mapFloods.palette, 'forceRgbOutput':true});
        var png_url = pngToExport.getThumbURL({
          dimensions: 1000,
          region: aoi,
          format: 'png',
        });
        
        png_label.setUrl(png_url);
        png_label.style().set({shown: true});
      }});
    
    // Add button and link to download flood TIFF map
    var tiff_instructions_label = ui.Label('To download, open your terminal and navigate to the desired download directory. Then, copy and paste the command below:', {shown: false});
    var tiff_download_label = ui.Label('TIFF Link', {shown: false});

    var tiff_download_button = ui.Button({
      label: 'TIFF',
      onClick: function() {
        exportControls.clear();
        // Smoothing Radius Slider (affects both smoothing values)
        var smoothingSliderLabel = ui.Label('Smoothing Radius');
        var smoothingSlider = ui.Slider({
          min: 1,
          max: 10,
          value: 3,
          step: 1,
          style: {width: '100%'},
        });
  
        // Cell Size Slider (affects the cell size)
        var cellSizeLabel = ui.Label('Cell Size');
        var cellSizeSlider = ui.Slider({
          min: 10,
          max: 1000,
          value: 400,
          step: 10,
          style: {width: '100%'},
        });
  
        // Confirm Button
        var confirmButton = ui.Button({
          label: 'Confirm',
          onClick: function() {
            var smoothingValue = smoothingSlider.getValue();
            var cellSizeValue = cellSizeSlider.getValue();
  
            var flood_image = rightMap.layers().get(2).getEeObject();
            var tiff_url = floodMapExport.getFloodTiffUrl(
              flood_image,
              smoothingValue,
              aoi,
              cellSizeValue,
              'GFM_' +
                start_date[0].format('YYYYMMdd').getInfo() + '_' +
                start_date[1].format('YYYYMMdd').getInfo() + '_' +
                aoi.bounds().coordinates().get(0).getInfo()[0][1].toFixed(2) + '_' +
                aoi.bounds().coordinates().get(0).getInfo()[0][0].toFixed(2) + '_' +
                aoi.bounds().coordinates().get(0).getInfo()[2][1].toFixed(2) + '_' +
                aoi.bounds().coordinates().get(0).getInfo()[2][0].toFixed(2) + '_' +
                cellSizeValue+'m_SR'+smoothingValue
            );
  
            var tiff_label = ui.Label('TIFF link', {shown: true});
            tiff_label.setUrl(tiff_url);
          
            rightSubPanel2.add(tiff_label);


            smoothingSliderLabel.style().set({shown: false});
            smoothingSlider.style().set({shown: false});
            cellSizeLabel.style().set({shown: false});
            cellSizeSlider.style().set({shown: false});
            confirmButton.style().set({shown: false});
          
          }
        });
        
  
        // Add the sliders and confirm button to the existing right-hand panel
        exportControls.add(smoothingSliderLabel);
        exportControls.add(smoothingSlider);
        exportControls.add(cellSizeLabel);
        exportControls.add(cellSizeSlider);
        exportControls.add(confirmButton);
        rightSubPanel1.remove(exportControls);
        rightSubPanel1.add(exportControls);
      
      }
    });
      
    controlPanel.add(
      ui.Label('Generate the download link using the buttons below:',
      {stretch: 'horizontal', textAlign: 'left',
      fontSize:'12px'}));
      
    // Add download buttons and links to right panel
    rightSubPanel1.add(shp_download_button);
    rightSubPanel1.add(png_download_button);
    rightSubPanel1.add(tiff_download_button);
    
    rightSubPanel2.add(png_label);
    rightSubPanel2.add(tiff_instructions_label);
    rightSubPanel2.add(tiff_download_label);
    controlPanel.add(rightSubPanel1);
    controlPanel.add(rightSubPanel2);
  } else { // This section is to add widgets in the left panel only
    // Add advanced options
    controlPanel.add(ui.Label('Advanced options',
      {stretch: 'horizontal', textAlign: 'left',
      fontSize:'16px', fontWeight: 'bold'}));
      
    controlPanel.add(ui.Panel([ui.Label('VV & VV threshold:', {fontSize:'12px', position:'middle-left'}), 
        zvv_thd_text, zvh_thd_text], ui.Panel.Layout.flow('horizontal', false), {padding: '0px'}));
        
    controlPanel.add(ui.Panel([ui.Label('Open water threshold:', {fontSize:'12px', position:'middle-left'}), 
        pow_thd_text], ui.Panel.Layout.flow('horizontal', false)));
        
    controlPanel.add(ui.Panel([ui.Label('Asc/Desc:', {fontSize:'12px', position:'middle-left'}), 
        pass_dd], ui.Panel.Layout.flow('horizontal', false)));
    
    controlPanel.add(ui.Panel([ui.Label('Max elevation:', {fontSize:'12px', position:'middle-left'}), 
        elev_thd_text], ui.Panel.Layout.flow('horizontal', false)));
        
    controlPanel.add(ui.Panel([ui.Label('Max slope:', {fontSize:'12px', position:'middle-left'}), 
        slp_thd_text], ui.Panel.Layout.flow('horizontal', false)));
  }
  
  // dummy panel to add on the either side
  var dummyPanel = ui.Panel({
    widgets: [], 
    style: {width:'18%'}});
  
  mapToChange.add(legend);
  mapToChange.add(title);
  return [controlPanel, dummyPanel];
}

// Create left and right maps
var leftMap = ui.Map();
leftMap.setControlVisibility(true);

var rightMap = ui.Map();
rightMap.setControlVisibility(true);

var left_panel = addLayerSelector(leftMap, 0, 'middle-left');
var left_dummy = left_panel[1];
left_panel = left_panel[0];

var right_panel = addLayerSelector(rightMap, 1, 'middle-right');
var right_dummy = right_panel[1];
right_panel = right_panel[0];

var main_panel = [left_panel, right_panel];

updateBothMapPanel();


// Create a function that takes the checkbox boolean
// value of the two layers of both the maps and updates
// the variable. This function will be called before the 
// updateMap funtion.
function updateVisibility() {
  // Use the checkbox information to update the layers
  // in both the maps. 0 is SAR, 1 is optical.  
  show_left_sar = leftMap.layers().get(0).getShown();
  show_right_sar = rightMap.layers().get(0).getShown();
  
  show_left_optical = leftMap.layers().get(1).getShown();
  show_right_optical = rightMap.layers().get(1).getShown();
}

// This function is called only when 
// a new state is selected
function updateBothMapPanel() {
  updateVisibility();
  updateChart(leftMap, 0, left_panel);
  updateChart(rightMap, 1, right_panel);
  
  // Add Sentinel-1 images to both the maps
  leftMap.layers().set(0, ui.Map.Layer(getS1Image(0),s1RawVizParams, 'Sentinel-1', show_left_sar));
  rightMap.layers().set(0, ui.Map.Layer(getS1Image(1),s1RawVizParams, 'Sentinel-1', show_right_sar));
  
  // Add Sentinel-2 images to both the maps  
  leftMap.layers().set(1, ui.Map.Layer(getS2Image(0),s2RawVizParams, 'Sentinel-2', show_left_optical));
  rightMap.layers().set(1, ui.Map.Layer(getS2Image(1),s2RawVizParams, 'Sentinel-2', show_right_optical));
  
  // Update the flood map
  updateFloodMap();

  leftMap.centerObject(aoi);
}

// Update flood map
function updateFloodMap() {
  rightMap.layers().set(2, ui.Map.Layer(
        getFloodImage(getSentinel1WithinDateRange(start_date[0], advance_days[0]), 
                      getSentinel1WithinDateRange(start_date[1], advance_days[1])), 
        {palette: mapFloods.palette}, 'Flood Map', true));
}

// Update url with necessary information
function updateLink(stateName, countryName) {
  if (drawnAOI == false && stateName != null && stateName.length > 0 && countryName.length > 0) {
    ui.url.set({
    'pfd0': start_date[0].format('YYYY-MM-dd').getInfo(), //pre-flood date
    'pfd1': start_date[0].advance(advance_days[0], 'day').format('YYYY-MM-dd').getInfo(),
    'dfd0': start_date[1].format('YYYY-MM-dd').getInfo(), //during-flood date
    'dfd1': start_date[1].advance(advance_days[1], 'day').format('YYYY-MM-dd').getInfo(),
    'sd0': advance_days[0], //before flood succeeding days
    'sd1': advance_days[1], // during flood succeeding days      
    'state': stateName,
    'country': countryName,
    'zvv': zvv_thd_text.getValue(),
    'zvh': zvh_thd_text.getValue(),
    'pow': pow_thd_text.getValue(),
    'pass': pass_dd.getValue(),
    'elev': elev_thd_text.getValue(),
    'slp': slp_thd_text.getValue()
    });
  }
  else {
    ui.url.set({
      'pfd0': start_date[0].format('YYYY-MM-dd').getInfo(), //pre-flood date
      'pfd1': (start_date[0].advance(advance_days[0], 'day')).format('YYYY-MM-dd').getInfo(),
      'dfd0': start_date[1].format('YYYY-MM-dd').getInfo(), //during-flood date
      'dfd1': start_date[1].advance(advance_days[1], 'day').format('YYYY-MM-dd').getInfo(),
      'sd0': advance_days[0], //before flood succeeding days
      'sd1': advance_days[1], // during flood succeeding days     
      'llat': aoi.bounds().coordinates().get(0).getInfo()[0][1].toFixed(2), //aoi left latitude
      'llong': aoi.bounds().coordinates().get(0).getInfo()[0][0].toFixed(2), //aoi left longitude
      'rlat': aoi.bounds().coordinates().get(0).getInfo()[2][1].toFixed(2), //aoi right latitude
      'rlong': aoi.bounds().coordinates().get(0).getInfo()[2][0].toFixed(2), //aoi right longitude
      'zvv': zvv_thd_text.getValue(),
      'zvh': zvh_thd_text.getValue(),
      'pow': pow_thd_text.getValue(),
      'pass': pass_dd.getValue(),
      'elev': elev_thd_text.getValue(),
      'slp': slp_thd_text.getValue()
    });
  }
}

// Update availability graph
function updateChart(map, defaultValue, controlPanel) {
  var chart = availabilityGraphStacked.generateCollectionChart(
    getSentinel1WithinDateRange(start_date[defaultValue], advance_days[defaultValue])
    );
  
  // If you are adding widgets before the chart,
  // you will need to update the numbers below.
  if (map.widgets().length() > 1) {
    main_panel[defaultValue].widgets().set(2, chart);
  } else {
    controlPanel.add(chart);
  }
}

// display the flood impact portal and clear existing UI elements
function displayFloodImpactPortal(aoi) {
  // Import datasets
  var flood = getFloodImage(
    getSentinel1WithinDateRange(start_date[0], advance_days[0]),
    getSentinel1WithinDateRange(start_date[1], advance_days[1])
  ).clip(aoi);
  
  var dem = ee.ImageCollection('COPERNICUS/DEM/GLO30').select('DEM').mosaic().clip(aoi);
  var landcover = ee.ImageCollection('ESA/WorldCover/v100').first().clip(aoi);
  
  // Load gridded population datasets
  var ghspop  = ee.Image('JRC/GHSL/P2023A/GHS_POP/2025').clip(aoi);
  var gpwpop  = ee.ImageCollection('CIESIN/GPWv411/GPW_Population_Count')
                  .filterDate('2020-01-01', '2020-12-31').mosaic()
                  .select('population_count').clip(aoi);
  var worldpop = ee.ImageCollection('WorldPop/GP/100m/pop')
                  .filter(ee.Filter.eq('year', 2020)).mosaic()
                  .select('population').clip(aoi);
  var hrslpop = ee.ImageCollection("projects/sat-io/open-datasets/hrsl/hrslpop")
                  .mosaic().clip(aoi);
  var landscan = ee.ImageCollection('projects/sat-io/open-datasets/ORNL/LANDSCAN_GLOBAL')
                   .sort('system:time_start', false).first().clip(aoi);
  
  // -------------------------
  // Reprojection Helper Function
  // -------------------------
  function reproject_image(image, scale) {
    return image.reproject({crs: 'EPSG:4326', scale: scale});
  }
  
  // Reproject raster datasets with fixed cell sizes
  landcover  = reproject_image(landcover, 10);
  ghspop  = reproject_image(ghspop, 100);
  gpwpop  = reproject_image(gpwpop, 927.67);
  worldpop = reproject_image(worldpop, 92.77);
  hrslpop = reproject_image(hrslpop, 30);
  landscan = reproject_image(landscan, 1000);

  ///////////////////////////
  // Calculate flood depth //
  ///////////////////////////
  // Function to compute FwDET-style flood depth
  var computeFloodDepth = function(flood, dem) {
    // Ensure binary mask
    flood = flood.gt(0).selfMask();
  
    // Clip DEM to flood buffer
    var demClipped = dem.clip(aoi);
    var projection = demClipped.projection();
  
    // Interpolation using cumulative cost
    var mod = demClipped.updateMask(flood.mask().not());
    var source = mod.mask();
    var val = 10000;
    var push = 5000;
  
    var cost0 = ee.Image(val).where(source, 0).cumulativeCost(source, push);
    var cost1 = ee.Image(val).where(source, 1).cumulativeCost(source, push);
    var cost2 = mod.unmask(val).cumulativeCost(source, push);
  
    var costFill = cost2.subtract(cost0).divide(cost1.subtract(cost0));
    var costSurface = mod.unmask(0).add(costFill);
  
    // Compute and smooth depth
    var boxcar = ee.Kernel.square({radius: 3, units: 'pixels', normalize: true});
    var costDepth = costSurface.subtract(demClipped)
      .convolve(boxcar)
      .updateMask(flood)
      .rename('FwDET_GEE');
  
    // Remove negative values
    var costDepthFiltered = costDepth.where(costDepth.lt(0), 0);
  
    return costDepthFiltered;
  };
  
  var floodDepth = computeFloodDepth(flood, dem);
  
  // get flood depth range to use later for visualization
  var stats = floodDepth.reduceRegion({
    reducer: ee.Reducer.percentile([0, 98]), // 0 = min, 90th percentile
    geometry: aoi,
    scale: 100,
    maxPixels: 1e8,
    bestEffort: true  
  });
  var minDepth = ee.Number(0);
  var maxDepth = ee.Number(15);
  
  
  // Calculate flood affected land cover area
  // Use a coarser scale for large AOIs
  //var areaSize = aoi.area();
  //var computeScale = ee.Number(areaSize).divide(1e6).sqrt().multiply(10).max(30); // Dynamic scale based on AOI size
  
  // Create binary flood mask - include all flood classes (1, 2, 3)
  var floodBinary = flood.gte(1).and(flood.lte(3));
  
  var floodLowConfidence = flood.gte(1).and(flood.lte(2));
  var floodHighConfidence = flood.eq(3);
  
  // Calculate area more efficiently
  var maskedLC = landcover.updateMask(floodBinary);
  var area = ee.Image.pixelArea();
  var joined = area.addBands(maskedLC);
  
  var stats = joined.reduceRegion({
    reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'landcover'}),
    geometry: aoi,
    scale: 500, 
    maxPixels: 1e13,
    bestEffort: true,
    tileScale: 4  
  });
  
  var chartData = ee.List(stats.get('groups')).map(function(d) {
    d = ee.Dictionary(d);
    return [d.get('landcover'), d.get('sum')];
  });
  
  
  // Compute proportional affected population based on flood fraction per pop cell
  //high confidence
  function getProportionalHighConfidenceAffectedPopulation(popImage) {
    // Use the native resolution of each population dataset
    var popScale = popImage.projection().nominalScale();
    
    // Simple approach: directly mask population with flood
    // This works well when flood resolution is finer than population resolution
    var affectedPop = popImage.updateMask(floodHighConfidence);
    
    // Sum the affected population
    var totalAffected = affectedPop.reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: aoi,
      scale: popScale,
      maxPixels: 1e13,
      bestEffort: true,
      tileScale: 4
    });
    
    return ee.Number(totalAffected.values().get(0)).round();
  }
  
  //lowconfidence
  function getProportionalLowConfidenceAffectedPopulation(popImage) {
    // Use the native resolution of each population dataset
    var popScale = popImage.projection().nominalScale();
    
    // Simple approach: directly mask population with flood
    // This works well when flood resolution is finer than population resolution
    var affectedPop = popImage.updateMask(floodLowConfidence);
    
    // Sum the affected population
    var totalAffected = affectedPop.reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: aoi,
      scale: popScale,
      maxPixels: 1e13,
      bestEffort: true,
      tileScale: 4
    });
    
    return ee.Number(totalAffected.values().get(0)).round();
  }
  
  // Create a FeatureCollection with each dataset's affected population
  var affected_pop = ee.FeatureCollection([
    ee.Feature(null, {
      dataset: 'Landscan',
      High: getProportionalHighConfidenceAffectedPopulation(landscan),
      Low: getProportionalLowConfidenceAffectedPopulation(landscan)
    }),
    ee.Feature(null, {
      dataset: 'HRSL',
      High: getProportionalHighConfidenceAffectedPopulation(hrslpop),
      Low: getProportionalLowConfidenceAffectedPopulation(hrslpop)
    }),
    ee.Feature(null, {
      dataset: 'WorldPop',
      High: getProportionalHighConfidenceAffectedPopulation(worldpop),
      Low: getProportionalLowConfidenceAffectedPopulation(worldpop)
    }),
    ee.Feature(null, {
      dataset: 'GPWv4',
      High: getProportionalHighConfidenceAffectedPopulation(gpwpop),
      Low: getProportionalLowConfidenceAffectedPopulation(gpwpop)
    }),
    ee.Feature(null, {
      dataset: 'GHS-POP',
      High: getProportionalHighConfidenceAffectedPopulation(ghspop),
      Low: getProportionalLowConfidenceAffectedPopulation(ghspop)
    })
  ]);

  
  // After calculating the affected population, remove zero values from the population layers
  function mask_pop(image){
    return image.updateMask(image.gte(0)).selfMask();
  }
  
  ghspop = mask_pop(ghspop);
  gpwpop = mask_pop(gpwpop);
  worldpop = mask_pop(worldpop);
  hrslpop = mask_pop(hrslpop);
  landscan = mask_pop(landscan);
  
  
  // Clear the root
  ui.root.clear();
  
  // Create a main panel to hold everything
  var mainPanel = ui.Panel({
    layout: ui.Panel.Layout.Flow('vertical'),
    style: {width: '100%', height: '100%'}
  });
  
  var portalTitle = ui.Label('Global Flood Mapper - Impact Assessment Portal', {
    stretch: 'horizontal',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '2px 0px 4px 0px'
  });
  
  var titleRow = ui.Panel({
    layout: ui.Panel.Layout.Flow('horizontal'),
    style: {width: '100%', height: '4%'}
  });
  titleRow.add(portalTitle);

  // Create top row and bottom row panels
  var topRow = ui.Panel({
    layout: ui.Panel.Layout.Flow('horizontal'),
    style: {width: '100%', height: '48%'}
  });
  
  var bottomRow = ui.Panel({
    layout: ui.Panel.Layout.Flow('horizontal'),
    style: {width: '100%', height: '48%'}
  });
  
  // Create the four panels for our 2x2 grid
  var floodPanel = ui.Panel({
    style: {width: '50%', height: '100%'}
  });
  var landcoverPanel = ui.Panel({
    style: {width: '50%', height: '100%'}
  });
  var populationPanel = ui.Panel({
    style: {width: '50%', height: '100%'}
  });
  var chartPanel = ui.Panel({
    style: {width: '50%', height: '100%'}
  });
  
  // Add the panels to their respective rows
  topRow.add(floodPanel);
  topRow.add(landcoverPanel);
  bottomRow.add(populationPanel);
  bottomRow.add(chartPanel);
  
  
  // Add rows to main panel
  mainPanel.add(titleRow);
  mainPanel.add(topRow);
  mainPanel.add(bottomRow);
  
  // Add the main panel to the UI
  ui.root.add(mainPanel);
  
  // Create maps for each panel
  var floodMap = ui.Map();
  var landcoverMap = ui.Map();
  var populationMap = ui.Map();
  
  
  var baseChange =
      [{featureType: 'all', stylers: [{saturation: -100}, {lightness: 45}]}];
  //floodMap.setOptions('baseChange', {'baseChange': baseChange});
  floodMap.setOptions('SATELLITE', {'SATELLITE': {
    featureType: 'all',
    elementType: 'labels',
    stylers: [{visibility: 'off'}]
  }});
  landcoverMap.setOptions('baseChange', {'baseChange': baseChange});
  populationMap.setOptions('baseChange', {'baseChange': baseChange});
  
  // Clear map default UI elements
  floodMap.setControlVisibility({
    zoomControl: true,
    mapTypeControl: false,
    layerList: false,
    fullscreenControl: false
  });
  
  landcoverMap.setControlVisibility({
    zoomControl: true,
    mapTypeControl: false,
    layerList: false,
    fullscreenControl: false
  });
  
  populationMap.setControlVisibility({
    zoomControl: true,
    mapTypeControl: false,
    layerList: false,
    fullscreenControl: false
  });
  
  
  // a function to add opaque flood extent to population and land cover maps
  // Reusable function to add a flood extent toggle to any map
  function addFloodExtentToggle(map, floodImage, otherImageLayer, otherImgLabel) {
    var options = {
      visParams: {min: 0, max: 1, palette: ['black'], opacity: 0.7},
      label: 'Flood extent',
      shown: false
    };
    var visParams = options.visParams
    var initialVisibility = options.shown
    var label = options.label
  
    // Create the layer
    var floodLayer = ui.Map.Layer(floodImage.gt(0).selfMask(), visParams, label, initialVisibility);
    
    map.layers().add(otherImageLayer);
    map.layers().add(floodLayer);
  
    // Create the checkbox
    var toggle_flood = ui.Checkbox({
      label: label,
      value: initialVisibility,
      onChange: function(checked) {
        floodLayer.setShown(checked);
      }
    });
    var toggle_other_image = ui.Checkbox({
      label: otherImgLabel,
      value: true,
      onChange: function(checked) {
        otherImageLayer.setShown(checked);
      }
    });
  
    // Add checkbox panel to top-right
    var togglePanel = ui.Panel({
      widgets: [toggle_flood, toggle_other_image],
      style: {
        position: 'top-right',
        padding: '0px',
        backgroundColor: 'rgba(255, 255, 255, 0.6)'
      }
    });
  
    map.add(togglePanel);
  }
  
  // Add titles and maps to panels
  var floodTitle = ui.Label('Flood Depth - 30 m', {fontWeight: 'bold', fontSize: '16px', padding: '0px'});
  floodPanel.add(floodTitle);
  floodPanel.add(floodMap);

  var landcoverTitle = ui.Label('ESA World Cover - 10 m', {fontWeight: 'bold', fontSize: '16px', padding: '0px'});
  landcoverPanel.add(landcoverTitle);
  landcoverPanel.add(landcoverMap);
  
  var populationTitle = ui.Label('Gridded Population - various resolutions', {fontWeight: 'bold', fontSize: '16px', padding: '0px'});
  populationPanel.add(populationTitle);
  populationPanel.add(populationMap);
  
  var chartTitle = ui.Label('Flood Impact', {fontWeight: 'bold', fontSize: '16px', padding: '0px'});
  chartPanel.add(chartTitle);
    
  // Link the maps to navigate in sync
  var linkMaps = function() {
    var linkingBounds = ui.Map.Linker([floodMap, landcoverMap, populationMap]);
  };
  linkMaps();
  
  // Add layers to each map
  // Flood map
  var redPalette = ['#ffe5e0', '#fcb5a9', '#f88b74', '#f26449',
                    '#e94129', '#d72a1d', '#b91f1a', '#8c1414', '#5e0a0a'
                    ];
  var floodVis = {
    min: 0,
    max: 15,
    palette: redPalette
  };
  
  var floodDepthLayer = ui.Map.Layer(floodDepth, floodVis, 'Flood Depth', true);
  //floodMap.addLayer(floodDepth, floodVis, 'Flood Depth');
  //floodMap.layers().add(floodDepthLayer);

  addFloodExtentToggle(floodMap, flood, floodDepthLayer, 'Flood Depth');

  // Land cover map
  var worldCoverVis = {
    bands: ['Map'],
    min: 10,
    max: 100,
    palette: [
      '006400', // 10: Tree cover
      'ffbb22', // 20: Shrubland
      'ffff4c', // 30: Grassland
      'f096ff', // 40: Cropland
      'fa0000', // 50: Built-up
      'b4b4b4', // 60: Bare/sparse vegetation
      'f0f0f0', // 70: Snow and ice
      '0064c8', // 80: Permanent water bodies
      '0096a0', // 90: Herbaceous wetland
      '00cf75', // 95: Mangroves
      'fae6a0'  // 100: Moss and lichen
    ]
  };
  
  var landCoverLayer = ui.Map.Layer(landcover, worldCoverVis, 'Land Cover', true);
  addFloodExtentToggle(landcoverMap, flood, landCoverLayer, 'Land Cover');
  
  // Population map
  var populationVis = {
    min: 0,
    max: 100,
    palette: ['#472836', '#9AD2CB', '#ffe87c', '#ffa552', '#ff4d4d']
  };
  
  //populationMap.addLayer(ghspop, populationVis, 'Population');
  
  // Define a mapping of population dataset names to their images.
  var populationDatasets = {
    'HRSL': hrslpop,
    'WorldPop 2020': worldpop,
    'GPWv4.11 2020': gpwpop,
    'GHS-POP 2025': ghspop,
    'Landscan 2023': landscan
  };
  
  
  // Create the checkbox for flood extent toggle.
  var visParams = {min: 0, max: 1, palette: ['black'], opacity: 0.7};
  var initialVisibility = false;
  var label = 'Flood extent';
  
  // Create the layer
  var floodLayer = ui.Map.Layer(flood.gt(0).selfMask(), visParams, label, initialVisibility);
  
  var floodCheckbox = ui.Checkbox({
    label: 'Flood extent',
    value: false,
    onChange: function(checked) {
      floodLayer.setShown(checked);
    }
  });
  
  // Create the select widget for population dataset choice.
  var populationSelect = ui.Select({
    items: Object.keys(populationDatasets),
    value: 'GHS-POP 2025',  // default value
    onChange: function(selected) {
      // Reset populationMap layers.
      populationMap.layers().reset();
      // Add the selected population layer.
      populationMap.addLayer(populationDatasets[selected], populationVis, selected);
      // Also check the state of the flood checkbox.
      floodLayer = ui.Map.Layer(flood.gt(0).selfMask(), visParams, label, floodCheckbox.getValue());
      populationMap.layers().add(floodLayer);
    }
  });
  
  
  // Create a panel that holds both widgets.
  var popOptionsPanel = ui.Panel({
    widgets: [floodCheckbox, populationSelect],
    style: {position: 'top-right', padding: '2px', backgroundColor: 'rgba(255, 255, 255, 0.6)'}
  });
  populationMap.add(popOptionsPanel);
  
  // Initially add the default population layer.
  var populationLayer = ui.Map.Layer(populationDatasets[populationSelect.getValue()], populationVis, populationSelect.getValue());
  populationMap.layers().add(populationLayer);
  populationMap.layers().add(floodLayer);

  // Add the donut chart to the bottom right panel
  function prepareChartData() {
    var worldCoverClasses = {
      10: 'Tree cover',
      20: 'Shrubland',
      30: 'Grassland',
      40: 'Cropland',
      50: 'Built-up',
      60: 'Bare/sparse vegetation',
      70: 'Snow and ice',
      80: 'Permanent water bodies',
      90: 'Herbaceous wetland',
      95: 'Mangroves',
      100: 'Moss and lichen'
    };
    
    var landCoverColors = {
      10: '#006400',
      20: '#ffbb22',
      30: '#ffff4c',
      40: '#f096ff',
      50: '#fa0000',
      60: '#b4b4b4',
      70: '#f0f0f0',
      80: '#0064c8',
      90: '#0096a0',
      95: '#00cf75',
      100: '#fae6a0'
    };    
    
    
    // Evaluate the chart data on the server
    // Evaluate the chart data on the server
    chartData.evaluate(function(data) {
      // Format the data for the chart
      var dataTable = [['Land Cover', 'Area (km²)']];
      var sliceColors = [];
      
      // Process each row of data
      data.forEach(function(item) {
        var classNumber = item[0];
        var area = item[1] / 1e6; // Convert to square kilometers
        var className = worldCoverClasses[classNumber] || 'Unknown';
        
        dataTable.push([className, area]);
        sliceColors.push(landCoverColors[classNumber] || '#cccccc'); // fallback color
      });
      
      // Create and display the chart
      var lc_chart = ui.Chart(dataTable)
        .setChartType('PieChart')
        .setOptions({
          title: 'Affected land cover',
          titleTextStyle: {fontSize: 14},
          pieHole: 0.4,
          legend: {position: 'none'},
          colors: sliceColors,
          chartArea: {
            left: '0%',
            right: '0%',
            top: '10%',
            bottom: '0%',
            width: '10%',
            height: '100%'
          }
        });
      
        
      // Build a bar chart (column chart) with vertical x-axis labels
      var pop_chart = ui.Chart.feature.byFeature({
        features: affected_pop,
        xProperty: 'dataset',
        yProperties: ['High', 'Low']
      })
      .setChartType('ColumnChart')
      .setOptions({
        title: 'Affected Population by Confidence Level',
        titleTextStyle: {fontSize: 14},
        hAxis: {title: 'Population Dataset'},
        vAxis: {title: 'No. of People Affected', format: 'short'},
        isStacked: 'absolute',
        legend: {position: 'top'},
        colors: ['#D20103', 'F8E806']  // High = red, Low = yellow
      });

      
      // Create a horizontal container for chart and legend
      var chartLegendRow = ui.Panel({
        layout: ui.Panel.Layout.Flow('horizontal'),
        style: {
          stretch: 'both',
          width: '100%',
          height: '70%',
          padding: '5px 0 0 0'  // top, right, bottom, left
        }
      });
      
      // Add land cover chart to a panel with padding
      var lc_chartBox = ui.Panel([lc_chart], null, {
        stretch: 'horizontal',
        padding: '0px',
        width: '30%'
      });
  
      // Style the legend
      lcLegend.style().set({
        padding: '0px',
        width: '25%',
        maxHeight: '100%',
        stretch: 'vertical',
        shown: true
      });
      
      // Add population chart to a panel with padding
      var pop_chartBox = ui.Panel([pop_chart], null, {
        stretch: 'horizontal',
        padding: '0px',
        width: '45%'  //
      });
  
      // Add both chart and legend to horizontal row
      chartLegendRow.add(lc_chartBox);
      chartLegendRow.add(lcLegend);
      chartLegendRow.add(pop_chartBox);
      
      // Add the combined panel to chartPanel
      chartPanel.add(chartLegendRow);
      chartPanel.add(ui.Label('Note: You can download all the data displayed here by running the script of this app in GEE code editor. Please find the full source script on the GitHub repository: https://github.com/PratyushTripathy/global_flood_mapper'));
  
      // export flood depth map
      Export.image.toDrive({
        image: floodDepth.visualize(floodVis),   
        description: 'Flood_Depth_Map',
        folder:      'GFM_Map_Exports',
        fileNamePrefix: 'Flood_Depth_Map',
        region:      aoi,
        scale:       10,
        crs:         "EPSG:4326",
        fileFormat:  'GeoTIFF'      
      });
      
      // export land cover map
      Export.image.toDrive({
        image: landcover.visualize(worldCoverVis),   
        description: 'Land_Cover_Map',
        folder:      'GFM_Map_Exports',
        fileNamePrefix: 'Land_Cover_Map',
        region:      aoi,
        scale:       10,
        crs:         "EPSG:4326",
        fileFormat:  'GeoTIFF'      
      });
      
      // export population map
      Export.image.toDrive({
        image: populationDatasets[populationSelect.getValue()].visualize(populationVis),   
        description: 'Gridded_Population_Map',
        folder:      'GFM_Map_Exports',
        fileNamePrefix: 'Gridded_Population_Map',
        region:      aoi,
        scale:       10,
        crs:         "EPSG:4326",
        fileFormat:  'GeoTIFF'      
      });
      
      chartPanel.add(ui.Label({
        value: 'Return to flood mapper',
        targetUrl: 'https://ptripathy.users.earthengine.app/view/global-flood-mapper-v2'
        }));
    });
  }
  
  // Call the function to create the chart
  prepareChartData();
  
  
  // Add legends
  // Flood legend
  var floodLegend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)'
    }
  });
  
  // Utility to make each row of the legend
  var makeRow = function(color, name) {
    var colorBox = ui.Label({
      style: {
        backgroundColor: color,
        padding: '8px',
        margin: '2px 5px 0 0'
      }
    });
    var description = ui.Label(name, {
      fontSize: '12px',
      margin: '2px 0'
    });
    return ui.Panel({
      widgets: [colorBox, description],
      layout: ui.Panel.Layout.Flow('horizontal')
    });
  };

  
  floodLegend.add(ui.Label('Depth', {fontWeight: 'bold'}));
  
  // Define red palette and labels
  var depthLabels = ['High', '', '', '', '', '', '', '', 'Low'];
  var flippedPalette = redPalette.slice().reverse();
  
  // Add each depth color swatch to the legend
  for (var i = 0; i < redPalette.length; i++) {
    floodLegend.add(makeRow(flippedPalette[i], depthLabels[i]));
  }
  
  // Add flood depth legend
  floodMap.add(floodLegend);
  
  
  // Land cover legend
  var lcLegend = ui.Panel({
    style: {
      stretch: 'vertical',
      shown: true
    }
  });
  
  
  lcLegend.add(makeRow('#006400', 'Tree cover'));
  lcLegend.add(makeRow('#ffbb22', 'Shrubland'));
  lcLegend.add(makeRow('#ffff4c', 'Grassland'));
  lcLegend.add(makeRow('#f096ff', 'Cropland'));
  lcLegend.add(makeRow('#fa0000', 'Built-up'));
  lcLegend.add(makeRow('#b4b4b4', 'Bare land'));
  lcLegend.add(makeRow('#f0f0f0', 'Snow/ice'));
  lcLegend.add(makeRow('#0064c8', 'Permanent water'));
  lcLegend.add(makeRow('#0096a0', 'Herbaceous wetland'));
  lcLegend.add(makeRow('#00cf75', 'Mangroves'));
  lcLegend.add(makeRow('#fae6a0', 'Moss/lichen'));
  
  //landcoverMap.add(lcLegend);
  
  // Population legend
  var popLegend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '5px',
      backgroundColor: 'rgba(255, 255, 255, 0.6)'
    }
  });
  
  var popLegendTitle = ui.Label('People per pixel', {fontWeight: 'bold'});
  popLegend.add(popLegendTitle);
  
  popLegend.add(makeRow('#472836', 'Very Low'));
  popLegend.add(makeRow('#9AD2CB', 'Low'));
  popLegend.add(makeRow('#ffe87c', 'Medium'));
  popLegend.add(makeRow('#ffa552', 'High'));
  popLegend.add(makeRow('#ff4d4d', 'Very High'));
  
  populationMap.add(popLegend);
  
  // Set a center location for all maps (automatically updates all maps due to linking)
  floodMap.centerObject(aoi, 11);
}

var leftPiece = ui.Panel(
  [
    main_panel[0],
    leftMap,
    left_dummy
    ],
    ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'});
var rightPiece = ui.Panel(
  [
    right_dummy,
    rightMap,
    main_panel[1]
    ],
    ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'});

// Create a SplitPanel to hold the adjacent, linked maps.
var splitPanel = ui.SplitPanel({
  firstPanel: leftPiece,
  secondPanel: rightPiece,
  wipe: true,
  style: {stretch: 'both'}
});

// Set the SplitPanel as the only thing in the UI root.
function refresh() {
  ui.root.widgets().reset([splitPanel]);
}
refresh();

var linker = ui.Map.Linker([leftMap, rightMap]);

// Initialize both maps with content
updateBothMapPanel();

// Center on the default AOI
leftMap.centerObject(aoi, 11);

if(ui.url.get('pfd0', null) !== null) {
  var preFloodDate = ui.url.get('pfd0');
  var duringFloodDate = ui.url.get('dfd0');
  
  var preFloodDays = parseInt(ui.url.get('sd0'));
  var duringFloodDays = parseInt(ui.url.get('sd1'));
  
  start_date = [ee.Date(preFloodDate), ee.Date(duringFloodDate)];
  advance_days = [preFloodDays, duringFloodDays];
  
  if(ui.url.get('country', null) !== null) {
    var country = ui.url.get('country');
    var state = ui.url.get('state');
    updateAoi(country, state, false);
  }
  else {
    var leftLon = parseFloat(ui.url.get('llong'));
    var leftLat = parseFloat(ui.url.get('llat'));
    var rightLon = parseFloat(ui.url.get('rlong'));
    var rightLat = parseFloat(ui.url.get('rlat'));
    
    aoi = ee.Geometry.Rectangle(
      [leftLon, leftLat, rightLon, rightLat],
      null,
      false  
    );
  }
  
  zvv_thd_text.setValue(ui.url.get('zvv'));
  zvh_thd_text.setValue(ui.url.get('zvh'));
  pow_thd_text.setValue(ui.url.get('pow'));
  elev_thd_text.setValue(ui.url.get('elev'));
  slp_thd_text.setValue(ui.url.get('slp'));
  pass_dd.setValue(ui.url.get('pass'));
}