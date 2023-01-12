/*
Functions to compute baseline statistics from S1 time series

calc_basemean()
calc_basesd()
calc_anomaly()
calc_zscore()

Usage:

```
var zscore = require('users/pratyush_tripathy/flood_mapper/zscore');
```
*/

// Z-score
var calc_zscore = function(s1_collection_t1, s1_collection_t2, mode, direction) {
  var base_mean = s1_collection_t1
    .filter(ee.Filter.equals('orbitProperties_pass', direction))
    .mean()
  
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

exports.calc_zscore = calc_zscore;



