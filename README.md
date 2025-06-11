# Global Flood Mapper (GFM) - Version 2
This repository contains the source code and the link to the GFM Version 2. This version is a direct successor to GFM Version 1 ([GFM-v1 code repository link](https://github.com/PratyushTripathy/global_flood_mapper/tree/gfm-v1)).

You can read the details of the flood mapping method in the first article [here](https://link.springer.com/article/10.1007/s11069-022-05428-2). If you are interested in the details of the newly added impact assessment portal in GFM v2, please find the details in the second paper here [TBD]. If you use this tool for flood mapping or use the source code to implement in some other work, please cite references listed in the [suggested citation](#suggested-citation) section below.<br/>

GFM portal is quite intuitive but if you want a quick tutorial of how to use it, check out the usage [instructions](/instructions). Few examples of flood events around the globe can be found in [link](/examples).<br/>

The GIF below shows the GFM flood mapping application: <br/>
![](/media/gfmPortalGif.gif)


The GIF below shows the GFM flood impact assessment portal: <br/>
![](/media/gfmPortalGif.gif)

<strong>Note:</strong> If GFM does not load on your browser, please consider using Google Chrome.<br/>

## Access GFM app [[using this URL](https://ptripathy.users.earthengine.app/view/global-flood-mapper-v2)]
The GFM allows the user to quickly create high-precision flood maps by simply selecting the area of interest from the dropwown menu and selecting the dates for before and during floods. The flood map can be directly downloaded from the GFM either in PNG or KML format. The advanced options in the GFM enable the user to tweak parameters that influence the flood map. For instance, choosing between ascending/descending pass, the threshold for Z-value for VV and VH bands, water seasonality threshold, and the elevation and slope mask threshold.

## Add GFM repository to your GEE scripts
You can accesss the entire source code of GFM and export flood maps at higher resolution directly via GEE code editor. Use the link below to add GFM to your GEE scripts:<br/>
[https://code.earthengine.google.com/?accept_repo=users/ptripathy/GlobalFloodMapper](https://code.earthengine.google.com/?accept_repo=users/ptripathy/GlobalFloodMapper)

Feel free to tweak parameters in the script as per your need or repurpose it to build your own app. But make sure to cite us--keeps the open-source spirit alive :)

## Suggested citation:

Agarwal, A. and Tripathy, P. Global Flood Mapper v2: Flood Impact Assessment Using Sentinel-1 SAR on Google Earth Engine. (manuscript in review)<br/>

Tripathy, P. & Malladi, T. (2022). Global Flood Mapper: a novel Google Earth Engine application for rapid flood mapping using Sentinel-1 SAR. _Natural Hazards_. https://doi.org/10.1007/s11069-022-05428-2<br/>

Tripathy, P. and Malladi, T. (2021). Global Flood Mapper: Democratising open EO resources for flood mapping. _EGU General Assembly 2021_, online, 19–30 Apr 2021, EGU21-16194, https://doi.org/10.5194/egusphere-egu21-16194<br/>

**Affiliation**<br/>
Department of Geography, University of California, Santa Barbara, CA 93106, USA.<br/>
