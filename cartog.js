var UILayer = Move.require('UILayer');

var Cartog = new Class({
  initialize: function(x, y) {
    this.x = x;
    this.y = y;
    this.width = 320;
    this.height = 480;
    this.rows = 12;
    this.columns = 8;
    this.tileWidth = this.width / this.columns;
    this.tileHeight = this.height / this.rows;
    this.colors = ['#F7D688', '#923F3F'];
    this.selectedColor = this.colors[0];
    this.layers = [];
    this.map = UILayer({
      x:this.x, 
      y:this.y,
      width:this.width,
      height:this.height,
    });
    this.addLayer('background');
  },
  addLayer: function(name) {
    var layer = UILayer({
      x: 0,
      y: 0,
      width: this.width,
      height: this.height,
      tag: name,
      zPosition: 1,
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
          x: (x * this.tileWidth),
          y: (y * this.tileHeight),
          width: this.tileWidth,
          height: this.tileHeight,
        });
        if (this.layers.length == 0) {
          tile.backgroundColor = '#FFF4D9';
        };
        var self = this;
        tile.style.border = '1px solid #ccc';
        this.layers.getLast().addSublayer(tile);
      };
    };
  },
  attach: function(elem) {
    elem.grab(this.map.element);
  },
  setSelectedColor: function(color) {
    this.selectedColor = color;
  },
  bindLayerEvents: function() {
    var self = this;
    Array.each(self.layers.getLast().sublayers, function(tile) {
      tile.on('touchstart', function() {
        this.backgroundColor = self.selectedColor;
        this.tag = self.selectedColor;
      });
    });
  },
  coordinateDict: function() {
    var self = this;
    var dict = {};
    Array.each(self.layers, function(layer, index) {
      tiles = self.coordinatesForLayer(layer);
      dict[layer.tag] = tiles;
    });
    return dict;
  },
  coordinatesForLayer: function(layer) {
    var self = this;
    var tiles = [];
    Array.each(layer.sublayers, function(tile) {
      if (self.colors.contains(tile.tag)) {
        tiles.append([{
          x:tile.frame.x / self.tileWidth,
          y:tile.frame.y / self.tileHeight
        }]);
      };
    });
    return tiles;
  },
  addColor: function(color) {
    var self = this;
    self.colors.append([color]);
  },
  bringLayerToFront: function(layer_name) {
    var self = this;
    Array.each(self.map.sublayers, function(layer) {
      layer.zPosition = 0;
    });
    var layer = self.map.layerWithTag(layer_name);
    layer.zPosition = 1;
  },
  export: function() {
    document.location.href = "data:application/json;base64";
  },
});

var sidebar_width = $('map').getCoordinates()['left'];
var align_to_form = $('settings').getElement('h6').getCoordinates()['bottom'];
var cartog = new Cartog(sidebar_width, align_to_form);
cartog.attach($('map'));

var bindLayerButtons = function() {
  Array.each($('layer_list').getChildren(), function(elem) {
    elem.getElement('a').addEvent('click', function() {
      Array.each(elem.getSiblings(), function(sib) {
        sib.getElement('a').removeClass('success');
      });
      this.addClass('success');
      cartog.bringLayerToFront(this.text.toLowerCase());
    });
  });
};

var updateColorList = function() {
  var color_list = $('color_list');
  color_list.empty();
  Array.each(cartog.colors, function(color) {
    var elem = new Element('li');
    var content = new Element('a', {
      href: '#',
      'class': 'label span3',
      styles: {
        backgroundColor: color
      },
    })
    content.addEvent('click', function() {
      cartog.setSelectedColor(color);
    });
    content.set('text', color);
    content.inject(elem);
    elem.inject(color_list);
  });
};

$('add_layer').addEvent('click', function() {
  if ($('layer_name').value !== "") {
    Array.each($('layer_list').getChildren('li'), function(elem) {
      elem.getElement('a').removeClass('success');
    });
    var new_layer = $('layer_list').getLast('li').clone();
    new_layer.getElement('a').addClass('success');
    new_layer.getElement('a').set('text', $('layer_name').value);
    new_layer.injectBefore($('layer_list').getFirst('li'));
    cartog.addLayer($('layer_name').value.toLowerCase());
    $('layer_name').value = '';
    bindLayerButtons();
  };
});

$('save').addEvent('click', function() {
  $('save_state').removeClass('warning');
  $('save_state').addClass('success');
  $('save_state').getElement('p').set('text', 'Saved!');
  cartog.export();
});

$('add_color').addEvent('click', function() {
  if ($('color_value').value !== '') {
    cartog.addColor('#' + $('color_value').value);
    $('color_value').value = '';
    updateColorList();
  };
});

$('map').setStyle('width', cartog.map.frame.width);
$('tools').setStyle('left', $('map').getCoordinates()['right'] + 60 + 'px');
updateColorList();

