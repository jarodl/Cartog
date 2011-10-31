var UILayer = Move.require('UILayer');

var Cartog = new Class({
  initialize: function(x, y) {
    this.name = 'MyLevel';
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
    this.map = UILayer({
      x:this.x, 
      y:this.y,
      width:this.width,
      height:this.height,
    });
    this.addLayer('background');
  },
  updateTileSize: function() {
    this.tileWidth = this.width / this.columns;
    this.tileHeight = this.height / this.rows;
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
    if (this.map.sublayers.length != 0) {
      layer.opacity = 0.5;
    };
    this.map.addSublayer(layer);
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
        if (this.map.sublayers.length == 0) {
          tile.backgroundColor = '#FFF4D9';
        };
        var self = this;
        tile.style.border = '1px solid #ccc';
        this.map.sublayers.getLast().addSublayer(tile);
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
    Array.each(self.map.sublayers.getLast().sublayers, function(tile) {
      tile.on('touchstart', function() {
        this.backgroundColor = self.selectedColor;
        this.tag = self.selectedColor;
      });
    });
  },
  export: function() {
    var self = this;
    var dict = {};
    dict["attributes"] = {
      width: self.width,
      height: self.height,
      rows: self.rows,
      columns: self.columns
    }
    Array.each(self.map.sublayers, function(layer, index) {
      tiles = self.coordinatesForLayer(layer);
      dict[layer.tag] = tiles;
    });
    return JSON.stringify(dict);
  },
  coordinatesForLayer: function(layer) {
    var self = this;
    var tiles = [];
    Array.each(layer.sublayers, function(tile) {
      if (self.colors.contains(tile.tag)) {
        tiles.append([{
          x:tile.frame.x / self.tileWidth,
          y:tile.frame.y / self.tileHeight,
          color:tile.tag
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
  open: function(file, contents) {
    var self = this;
    self.name = file.name;
    var dict = JSON.parse(contents);
    var attr = dict["attributes"];
    delete dict["attributes"];
    self.width = attr["width"];
    self.height = attr["height"];
    self.columns = attr["columns"];
    self.rows = attr["rows"];
    self.map.removeAllSublayers();
    self.map.frame.width = self.width;
    self.map.frame.height = self.height;
    self.updateTileSize();
    for (var key in dict) {
      self.addLayer(key);
      Array.each(dict[key], function(tile) {
        self.selectedColor = tile.color;
        var index = (self.rows * tile.x) + tile.y;
        var newTile = self.map.layerWithTag(key).sublayers[index];
        newTile.backgroundColor = tile.color;
        newTile.tag = tile.color;
      });
    };
  }
});

var CartogUI = new Class({
  initialize: function(cartogMap) {
    this.cartogMap = cartogMap;
    this.layerList = document.getElementById('layer_list');
    this.colorList = document.getElementById('color_list');
    this.addLayer = document.getElementById('add_layer');
    this.layerName = document.getElementById('layer_name');
    this.addColor = document.getElementById('add_color');
    this.saveState = document.getElementById('save_state');
    this.exportButton = document.getElementById('export');
    this.fileInput = document.getElementById('fileInput');
    this.saveButton = document.getElementById('save');
    this.colorValue = document.getElementById('color_value');
    this.name = document.getElementById('name');
    this.mimeType = 'application/json';
    this.format = $('format');
    this.updateLayerList();
    this.updateColorList();
    this.bindLayerEvents();
    this.bindLayerButtons();
    this.bindFileEvents();
    this.bindColorEvents();
  },
  addLayerToList: function(name) {
    var exists = false;
    Array.each(this.layerList.getChildren(), function(li) {
      if (li.getElement('a').text.toLowerCase() === name) {
        exists = true;
      };
    });
    if (!exists) {
      var new_layer = this.layerList.getLast('li').clone();
      new_layer.getElement('a').addClass('success');
      new_layer.getElement('a').set('text', name);
      new_layer.injectBefore(this.layerList.getFirst('li'));
    };
  },
  bindLayerButtons: function() {
    var self = this;
    Array.each(this.layerList.getChildren(), function(elem) {
      elem.getElement('a').addEvent('click', function() {
        Array.each(elem.getSiblings(), function(sib) {
          sib.getElement('a').removeClass('success');
        });
        this.addClass('success');
        self.cartogMap.bringLayerToFront(this.text.toLowerCase());
      });
    });
  },
  updateColorList: function() {
    var self = this;
    self.colorList.empty();
    Array.each(this.cartogMap.colors, function(color) {
      var elem = new Element('li');
      var content = new Element('a', {
        href: '#',
        'class': 'label span3',
        styles: {
          backgroundColor: color
        },
      })
      content.addEvent('click', function() {
        self.cartogMap.setSelectedColor(color);
      });
      content.set('text', color);
      content.inject(elem);
      elem.inject(self.colorList);
    });
  },
  setAllLayersInactive: function() {
    Array.each(this.layerList.getChildren('li'), function(elem) {
      elem.getElement('a').removeClass('success');
    });
  },
  setLastLayerActive: function() {
    this.layerList.getLast('li').addClass('success');
  },
  bindLayerEvents: function() {
    var self = this;
    self.addLayer.addEvent('click', function() {
      if (self.layerName.value !== "") {
        self.setAllLayersInactive();
        self.cartogMap.addLayer(self.layerName.value.toLowerCase());
        self.addLayerToList(self.layerName.value);
        self.layerName.value = '';
        self.bindLayerButtons();
      };
    });
  },
  cleanUpSave: function(a) {
    a.dataset.disabled = true;

    // Need a small delay for the revokeObjectURL to work properly.
    setTimeout(function() {
      window.URL.revokeObjectURL(a.href);
    }, 1500);
  },
  downloadFile: function() {
    var self = this;
    window.URL = window.webkitURL || window.URL;
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

    // var prevLink = output.querySelector('a');
    // if (prevLink) {
    //   window.URL.revokeObjectURL(prevLink.href);
    //   output.innerHTML = '';
    // }

    var bb = new BlobBuilder();
    bb.append(this.cartogMap.export());

    self.exportButton.download = self.name.value + self.format.value;
    self.exportButton.href = window.URL.createObjectURL(bb.getBlob(self.mimeType));

    self.exportButton.dataset.downloadurl = [self.mimeType, self.exportButton.download, self.exportButton.href].join(':');
    self.exportButton.draggable = true;
    self.exportButton.classList.add('dragout');

    self.exportButton.onclick = function(e) {
      if ('disabled' in this.dataset) {
        return false;
      }

      self.cleanUpSave(this);
    };
  },
  updateLayerList: function(layers) {
    var self = this;
    self.setAllLayersInactive();
    Array.each(layers, function(layer) {
      self.addLayerToList(layer.tag);
    });
    self.setLastLayerActive();
    self.bindLayerButtons();
  },
  bindColorEvents: function() {
    var self = this;
    this.addColor.addEvent('click', function() {
      if (self.colorValue.value !== '') {
        self.cartogMap.addColor('#' + self.colorValue.value);
        self.colorValue.value = '';
        self.updateColorList();
      };
    });
  },
  bindFileEvents: function() {
    var self = this;
    self.saveButton.addEvent('click', function() {
      self.saveState.removeClass('warning');
      self.saveState.addClass('success');
      self.saveState.getElement('p').set('text', 'Saved! Ready to export.');
      self.downloadFile();
      self.exportButton.removeClass('disabled');
    });

    self.fileInput.addEvent('change', function(evt) {
      var files = evt.target.files;

      Array.each(files, function(file) {
        var reader = new FileReader();

        reader.onload = (function(theFile) {
            return function(e) {
              self.name.value = theFile.name.replace('.json', '');
              self.cartogMap.open(theFile, e.target.result);
              self.updateColorList();
              self.updateLayerList();
            };
          })(file);
          reader.readAsText(file);
      });
    });
  },
});

var sidebar_width = $('map').getCoordinates()['left'];
var align_to_form = $('settings').getElement('h6').getCoordinates()['bottom'];
var cartog = new Cartog(sidebar_width, align_to_form);
cartog.attach($('map'));
var cartogUI = new CartogUI(cartog);

$('map').setStyle('width', cartog.map.frame.width);
$('tools').setStyle('left', $('map').getCoordinates()['right'] + 80 + 'px');
