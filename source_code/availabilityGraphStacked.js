/*
This is the script to generate the data availability chart
as stacked bar representing ascending and descending pass 
separately.
*/
function generateCollectionChart(collection){
  var asc_collection = collection.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  var desc_collection = collection.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  
  var asc_range = asc_collection.reduceColumns(ee.Reducer.toList(), ["system:time_start"])
      .values().get(0)
  asc_range = ee.List(asc_range)
      .map(function(n){
        return ee.Date(n).format("YYYY-MM-dd")
      })  
  var desc_range = desc_collection.reduceColumns(ee.Reducer.toList(), ["system:time_start"])
      .values().get(0)
  desc_range = ee.List(desc_range)
      .map(function(n){
        return ee.Date(n).format("YYYY-MM-dd")
      })
  
  var all_dates = asc_range.distinct().cat(desc_range.distinct()).distinct().sort()

  var asc_avail_dict = asc_range.reduce(ee.Reducer.frequencyHistogram())
  var asc_avail_dict = ee.Dictionary(asc_avail_dict)
  var desc_avail_dict = desc_range.reduce(ee.Reducer.frequencyHistogram())
  var desc_avail_dict = ee.Dictionary(desc_avail_dict)
  //print(asc_avail_dict, desc_avail_dict)
  
  var asc_feat = asc_avail_dict.map(function(date, n){
    return ee.Feature(ee.Geometry.Point(77.58, 13), {label: date, number_images:n, ascending: n, descending: 0, weight:1})
  }).values()
  
  var desc_feat = desc_avail_dict.map(function(date, n){
    return ee.Feature(ee.Geometry.Point(77.58, 13), {label: date, number_images:n, ascending:0, descending: n, weight:1})
  }).values()
  
  var asc_desc = asc_feat.cat(desc_feat)
  var asc_desc_collection = ee.FeatureCollection(asc_desc);
  //print(asc_desc_collection)
  
  // map over dates
  var merged_collection = ee.FeatureCollection(all_dates.map(function(date){
    var new_feat_collection1 = asc_desc_collection.filter(ee.Filter.equals('label', date))
    var asc_sum = new_feat_collection1.reduceColumns({
      reducer: ee.Reducer.sum(),
      selectors: ['ascending'],
      weightSelectors: ['weight']
      }).get('sum')
    
    var new_feat_collection2 = asc_desc_collection.filter(ee.Filter.equals('label', date))
    var desc_sum = new_feat_collection2.reduceColumns({
      reducer: ee.Reducer.sum(),
      selectors: ['descending'],
      weightSelectors: ['weight']
      }).get('sum')
      
    var merged = asc_desc_collection.filter(ee.Filter.equals('label', date))
      .union().first()
      .set({label:date, Ascending:asc_sum, Descending:desc_sum})
    //return([asc_sum, desc_sum])
    return(merged)
  }))
  //print(asc_desc_collection, merged_collection)
  
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
    })
    
  return(chart);
}
exports.generateCollectionChart = generateCollectionChart;