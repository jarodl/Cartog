var UILayer = Move.require('UILayer');
// UILayer.debug = true;

var Cartog = new Class({
  initialize: function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 320;
    this.height = 480;
    this.rows = 12;
    this.columns = 8;
    this.tilesize = this.width / this.columns;
    this.colors = ['#F7D688', '#923F3F', '#F78892'];
    this.selectedColor = this.colors[0];
    this.layers = [];
    this.map = UILayer({
      x:this.x, 
      y:this.y,
      width:this.width,
      height:this.height,
    });
    this.palette = UILayer({
      x:this.x,
      y:this.map.frame.y + this.map.frame.height + 20,
      width:this.width,
      height:this.tilesize,
      backgroundColor:'#eee'
    });
    this.addLayer();
    this.drawPalette();
  },
  addLayer: function() {
    var layer = UILayer({
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
    });
    if (this.layers.length != 0) {
      layer.opacity = 0.5;
    };
    this.map.addSublayer(layer);
    this.layers.append([layer]);
    this.addTiles();
    this.bindLayerEvents();
  },
  addTiles: function() {
    for (var x = 0; x < this.columns; x++) {
      for (var y = 0; y < this.rows; y++) {
        var tile = UILayer({
          x: (x * this.tilesize),
          y: (y * this.tilesize),
          width: this.tilesize,
          height: this.tilesize,
        });
        if (this.layers.length == 0) {
          tile.backgroundColor = '#FFF4D9';
        };
        var self = this;
        tile.style.border = '1px solid #ccc';
        var layerCount = this.layers.length;
        this.layers.getLast().addSublayer(tile);
      };
    };
  },
  drawPalette: function() {
    var color_width = this.palette.frame.width / this.colors.length;
    for (var i = 0; i < this.colors.length; i++) {
      var color = UILayer({
        x: i * color_width,
        y: 0,
        width: color_width,
        height: this.palette.frame.height,
        backgroundColor: this.colors[i]
      });
      this.palette.addSublayer(color);
    };
    this.bindPaletteEvents();
  },
  attach: function(elem) {
    elem.grab(this.map.element);
    elem.grab(this.palette.element);
  },
  setSelectedColor: function(color) {
    this.selectedColor = color;
  },
  clearPaletteBorders: function() {
    for(var i = 0; i < this.palette.sublayers.length; i++) {
      var layer = this.palette.sublayers[i];
      layer.style.border = 'none';
    };
  },
  bindLayerEvents: function() {
    var self = this;
    for (var i = 0; i < self.layers.getLast().sublayers.length; i++) {
      var tile = self.layers.getLast().sublayers[i];
      tile.on('touchstart', function() {
        this.backgroundColor = self.selectedColor;
      });
    };
  },
  bindPaletteEvents: function() {
    var self = this;
    for (var i = 0; i < self.palette.sublayers.length; i++) {
      var layer = self.palette.sublayers[i];
      layer.on('touchstart', function() {
        self.clearPaletteBorders();
        self.setSelectedColor(this.backgroundColor);
        this.style.borderBottom = '3px solid #3DA9E8';
      });
    };
  }
});

var sidebar_width = $('map').getCoordinates()['left'];
var align_to_form = $('settings').getCoordinates()['top'];
var cartog = new Cartog(sidebar_width, align_to_form);
cartog.attach($('map'));
$('add_layer').addEvent('click', function() {
  if ($('layer_name').value !== "") {
    Array.each($('layer_list').getChildren('li'), function(elem) {
      elem.getElement('span').removeClass('success');
    });
    var new_layer = $('layer_list').getLast('li').clone();
    new_layer.getElement('span').addClass('success');
    new_layer.getElement('span').set('text', $('layer_name').value);
    new_layer.injectBefore($('layer_list').getFirst('li'));
    cartog.addLayer();
  };
});

// $('rows').set('value', 12);
// $('columns').set('value', 8);
// $('tilesize').set('value', 40);
// $('width').set('value', 320);
// $('height').set('value', 480);

// var rows = parseInt($('rows').get('value'));
// var columns = parseInt($('columns').get('value'));
// var tilesize = parseInt($('tilesize').get('value'));
// var width = parseInt($('width').get('value'));
// var height = parseInt($('height').get('value'));
