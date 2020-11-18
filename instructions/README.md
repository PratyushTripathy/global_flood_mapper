# COINS - Continuity in Street Networks
This repository contains the source code of the COINS tool that allows to deduce natural continuity of street network. For continuity of streets, the deflection angle between adjacent segments are computed, the user can provide the desired angle threshold. Segments will only be considered a part of the same street if the deflection angle is above the threshold, the default value is zero.<br/>

The image below shows the input street network data from the OSM, and its corresponding output from the COINS tool. For visualisation purpose, classification (natural breaks 'Jenks') was done on the length of the street strokes in the resulting shapefile.<br/>
<img src="Images/Input.png" height="250" width="250">
<img src="Images/Output.png" height="250" width="250">

There are two ways of accessing the tool, one is the Python script, which can be found here [[link]](/PythonTool). Second way of using is the QGIS plugin, source code and details are here [[link]](/QGISplugin).<br/>

**Suggested citation**<br/>
Tripathy, P., Rao, P., Balakrishnan, K., & Malladi, T. (2020). An open-source tool to extract natural continuity and hierarchy of urban street networks. Environment & Planning B: Urban Analytics & City Science. In press. [http://dx.doi.org/10.1177/2399808320967680](http://dx.doi.org/10.1177/2399808320967680)<br/>

## Bibtext entry:
```tex
@Article{xxxxx,
AUTHOR = {Tripathy, Pratyush and Rao, Pooja and Balakrishnan, Krishnachandran and Malladi, Teja},
TITLE = {An open-source tool to extract natural continuity and hierarchy of urban street networks},
JOURNAL = {Environment & Planning B: Urban Analytics & City Science},
VOLUME = {xx},
YEAR = {2020},
NUMBER = {x},
ARTICLE-NUMBER = {xxx},
URL = {https://xxxxxxxxxxxxxxxxxxxxxxxxx},
ISSN = {xxxx-xxxx},
ABSTRACT = {Urban streets exhibit a hierarchical structure. From a network analysis perspective, continuity of streets based on the interior angle between street segments can be used to define ‘natural streets’ or ‘strokes’. The length of these ‘strokes’ can then be used to generate a hierarchy of street network. While researchers have described methods for defining such strokes and released tools that enable such analysis, the existing tools are dependent on proprietary applications and only an outline of the algorithm is available in the literature. This paper addresses these limitations and advances past approaches by (a) describing an efficient algorithm ‘COINS’ for conducting street continuity and hierarchy analysis and (b) releasing the python script and QGIS plugin which will enable users to implement this analysis independent of proprietary software and enable automation to process multiple datasets. The paper demonstrates the application of this tool using street network data from OpenStreetMap for 10 Indian cities and two international ones. Results indicate that our algorithm can detect the skeletal structure of a city which is visually very similar to the OpenStreetMap user-generated hierarchy, both at the city level and at the neighbourhood level. Analysing the results from 10 Indian cities using log–log plots of stroke length and stroke rank, we find that the strokes appear to follow Zipf’s law, but only in the mid-range of stroke lengths. Consistent with existing literature, we see that in our sample of Indian cities also there is a strong deviation from Zipf’s law for strokes that are approximately 100 m or lower},
DOI = {10.1177/2399808320967680}
}
```

**Affiliation**<br/>
Geospatial Lab, Indian Institute for Human Settlements, Bengaluru - 560080, India<br/>

**Funding**<br/>
This work was completed with support from the PEAK Urban programme, funded by UKRI’s Global Challenge Research Fund, Grant Ref: ES/P011055/1
