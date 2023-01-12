function generateCollectionChart(collection){
  var range = collection.reduceColumns(ee.Reducer.toList(), ["system:time_start"])
      .values().get(0)
  range = ee.List(range)
      .map(function(n){
        return ee.Date(n).format("YYYY-MM-dd")
      })
  
  var availability_dict = range.reduce(ee.Reducer.frequencyHistogram())
  var availability_dict = ee.Dictionary(availability_dict)
  
  var chart = ui.Chart.array.values(availability_dict.values(), 0, availability_dict.keys())
      .setChartType("ColumnChart")
      .setOptions({
        width: 100,
        height: 40,
        title: "Sentinel-1 Image Availability",
        hAxis: {title: 'Date'},
        vAxis: {title: 'Number of images'}
      })
    
  return chart
}

exports.generateCollectionChart = generateCollectionChart;
/*
var chart = generateCollectionChart(s1_collection)
print(chart)

Map.centerObject(aoi, 7)
*/