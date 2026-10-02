# Cartographic linework

The backgrounds are decorative fragments, not georeferenced maps of properties.
They contain no labels, numbers, compass roses or building pictograms.

- `urban.svg` and `neighborhood.svg`: street geometry from the West Oakland
  OpenStreetMap extract distributed with the OSMnx examples. © OpenStreetMap
  contributors, ODbL. https://www.openstreetmap.org/copyright
  Source: https://github.com/gboeing/osmnx-examples/blob/main/notebooks/input_data/West-Oakland.osm.bz2
- `terrain.svg`: contours extracted from the `elevation1.tif` and
  `elevation2.tif` sample rasters in the OSMnx examples; their original heights
  are retained and nodata cells are excluded. The geometry is used as an
  illustrative terrain fragment, not as measured topography of Chile.
  Source: https://github.com/gboeing/osmnx-examples/tree/main/notebooks/input_data
- `coastal.svg`: a coastline excerpt around Chiloé, from Natural Earth
  1:10 million coastline data, public domain.
  Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_coastline.geojson
  Terms: https://www.naturalearthdata.com/about/terms-of-use/
- `rural.svg`: an original schematic cadastral composition of parcels and an
  access lane; it is not a representation of actual land titles.

Source data was converted to static SVG paths. Production does not request
map APIs or load a map renderer for these backgrounds. The page footer
provides visible OpenStreetMap attribution.
