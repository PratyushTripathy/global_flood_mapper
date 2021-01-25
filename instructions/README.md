# Recommended steps to generate the flood map: <br/>

<img src="../media/gfm_screenshot.png" height="420" width="845">

1. Select the country and area from the drop-down menu highlighted in 1. Alternatively, the map extent can be used as the AOI by checking the checkbox. <br/>
2. Select a date range of about one-two months before the floods. The start date and the number of succeeding days (defaults to 60). This should be selected in the option highlighted in 2.<br/>
3. With some rough idea about the flood dates, select a date range as highlighted in 3. This should be the minimum number of days required to cover the area. The minimum number of scenes required to wholly cover an area should be determined by a test-and-trial approach, by trying out different values for the 'succeeding days' field.<br/>
4. Switch off the flood map as shown in 4, toggle between the pre and during flood images using the slider in the centre. Check a few values for the during-flood date range and finalise one that shows the most difference visually while toggling. Water/sand appears dark in colour, but a change in black from pre and during image will only represent new water.<br/>
5. Turn on the flood map. Click on the download button to get the extent as SHP or the exact same flood map as PNG, as shown in 5.<br/>

## Advanced options <br/>

<img src="../media/gfm_advanced_screenshot.png" height="150" width="200">

6. The VV and VH thresholds can be tweaked, both default to -3. Increasing it to -2 or -1, etc. will result in a lot more cells in the flood category. <br/> 
7. The valid range for the permanent open water (POW) threshold is 0 through 100, which defaults to 75. This can be tweaked to get desirable flood map. <br/>
8. If the area of interest (AOI) is small enough and is covered by a single 'during-flood' scene, the orbit pass direction of that scene should be selected from the drop-down menu for best results. For large AOIs, if the flood inundation water stagnates for a small period, Ascending and Descending passes should be combined. In case inundated water stays for long enough duration and multiple images of different passes are available, the images of Ascending and Descending passes can be processed separately, which is the ideal way. All these four options are present in the drop down menu. <br/>
9. On comparing the flood map with the Google Earth basemap and Sentinel-1 raw images, if flood class pixels are found on hills/valleys (most likely to result from combining the Ascending and Descending passes), the maximum elevation and slope allowed for the flood pixels can be reduced. The elevation and slope default to 900m and 15 degrees respectively.

## Common Mistakes <br/>

1. If you see linear flood extent (like a proper line). It is most likely the edge of a SAR scene in the during-flood image. In such a case please try to select any other date near the first one. For e.g. the [Roscommon, Ireland 2016](../examples/2016) flood in the examples, a during-flood stretch of 09 to 11 Jan 2016 gave a linear feature, which I avoided by selecting 09 Jan 2016 as the during-flood date.<br/>

<img src="../media/2016_Roscommon_Mistake.png" height="150" width="200">	<img src="../media/expl/2016_Roscommon.png" height="150" width="200"><br/>
<img src="../media/legend_base.png" height="65" width="410"><br/>