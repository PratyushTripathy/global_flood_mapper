function legend(){
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
  var palette =['031DC9', '3E9DFF', 'FFB100', 'E3E3E3'];
  // Add color and and names
  for (var i = 0; i < palette.length; i++) {
    legend.add(makeRow(palette[i], names[i]));
    }
    
  legend.add(ui.Label({
    value: 'See details on GitHub',
    style: {fontSize: '12px', margin: '0 0 0 0', padding:'4px'},
    targetUrl: 'https://github.com/PratyushTripathy/global_flood_mapper'
    }))
    
  return legend
}

exports.legend = legend;