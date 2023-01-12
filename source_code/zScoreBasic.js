/*
For basic version of the app
Functions to compute baseline statistics from S1 time series

calc_basemean()
calc_basesd()
calc_anomaly()
calc_zscore()

Usage:

```
var zscore = require('users/pratyush_tripathy/zscore');
```
*/

// Z-score
var calc_zscore = function(s1_collection_t1, s1_image_t2) {
  var anom = s1_image_t2
    .mean()
    .subtract(s1_collection_t1.mean())
    .set({'system:time_start': s1_image_t2.get('system:time_start')});
      
  var basesd = s1_collection_t1
    .reduce(ee.Reducer.stdDev())
    .rename(['VV', 'VH', 'angle']);
  
  return anom.divide(basesd)
    .set({'system:time_start': anom.get('system:time_start')})
};


exports.calc_zscore = calc_zscore;



