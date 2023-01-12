/*
S1Flood Mapping algorithm
=========================

usage:
  var mapFloods = require('users/Amravati/UI:mapFlood);
*/

var mapFloods = function(
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
    .filterDate('2016-01-01', '2019-01-01')
  var jrcvalid = jrc.map(function(x) {return x.gt(0)}).sum();
  var jrcwat = jrc.map(function(x) {return x.eq(2)}).sum().divide(jrcvalid).multiply(100);
  var jrcmask = jrcvalid.gt(0);
  var ow = jrcwat.gte(ee.Image(pow_thd));
  
  // add elevation and slope masking
  var elevation = ee.Image('USGS/SRTMGL1_003').select('elevation');
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
};

var palette = [
    '#E3E3E3', // 0 - non-water; non-flood
    '#FFB100', // 1 - VV only
    '#FFB100', // 2 - VH only
    '#3E9DFF', // 3 - VV + VH
    '#031DC9'  // 4 - Permanent open water
    ];

exports.mapFloods = mapFloods;
exports.palette = palette;
