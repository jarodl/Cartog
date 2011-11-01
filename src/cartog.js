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
      height:this.height
    });
    this.addLayer('background');
  },
  setWidth: function(width) {
    this.width = width;
    this.updateTileSize();
    this.resizeAllLayers();
  },
  setHeight: function(height) {
    this.height = height;
    this.updateTileSize();
    this.resizeAllLayers();
  },
  setRows: function(rows) {
    this.rows = rows;
    this.updateTileSize();
    this.resizeAllLayers();
  },
  setColumns: function(columns) {
    this.columns = columns;
    this.updateTileSize();
    this.resizeAllLayers();
  },
  resizeAllLayers: function() {
    var self = this;
    self.map.frame.width = self.width;
    self.map.frame.height = self.height;
    self.map.removeAllSublayers();
    self.updateTileSize();
    self.addLayer('background');
  },
  updateTileSize: function() {
    this.tileWidth = this.width / this.columns;
    this.tileHeight = this.height / this.rows;
  },
  addLayer: function(name) {
    var layer = UILayer({
      anchor: 'top right bottom left',
      tag: name,
      zPosition: 1
    });
    if (this.map.sublayers.length !== 0) {
      layer.opacity = 0.5;
    }
    this.addTiles(layer);
    this.map.addSublayer(layer);
    this.bindLayerEvents();
  },
  addTiles: function(layer) {
    for (var x = 0; x < this.columns; x++) {
      for (var y = 0; y < this.rows; y++) {
        var tile = UILayer({
          x: (x * this.tileWidth),
          y: (y * this.tileHeight),
          width: this.tileWidth,
          height: this.tileHeight
        });
        // if (this.map.sublayers.length == 0) {
        //   tile.backgroundColor = '#FFF4D9';
        // };
        var self = this;
        tile.style.border = '1px solid #ccc';
        layer.addSublayer(tile);
      }
    }
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
  exportMap: function() {
    var self = this;
    var map = {};
    map.settings = {
      width: self.width,
      height: self.height,
      rows: self.rows,
      columns: self.columns
    };
    Array.each(self.map.sublayers, function(layer, index) {
      var tiles = self.coordinatesForLayer(layer);
      map[layer.tag] = tiles;
    });
    return JSON.stringify(map);
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
      }
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
    var map = JSON.parse(contents);
    var settings = map.settings;
    delete map.settings;
    self.width = settings.width;
    self.height = settings.height;
    self.columns = settings.columns;
    self.rows = settings.rows;
    self.map.removeAllSublayers();
    self.map.frame.width = self.width;
    self.map.frame.height = self.height;
    self.updateTileSize();
    for (var key in map) {
      self.addLayer(key);
      Array.each(map[key], function(tile) {
        self.selectedColor = tile.color;
        var index = (self.rows * tile.x) + tile.y;
        var newTile = self.map.layerWithTag(key).sublayers[index];
        newTile.backgroundColor = tile.color;
        newTile.tag = tile.color;
      });
    }
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
    this.widthSetting = document.getElementById('width');
    this.heightSetting = document.getElementById('height');
    this.rowSetting = document.getElementById('rows');
    this.columnSetting = document.getElementById('columns');
    this.tools = document.getElementById('tools');
    this.mapHolder = document.getElementById('map');
    this.name = document.getElementById('name');
    this.mimeType = 'application/json';
    this.format = document.getElementById('format');
    this.updateLayerList();
    this.updateColorList();
    this.layoutViews();
    this.bindEvents();
  },
  bindEvents: function() {
    this.bindLayerEvents();
    this.bindLayerButtons();
    this.bindFileEvents();
    this.bindColorEvents();
    this.bindSettingsEvents();
  },
  addLayerToList: function(name) {
    var exists = false;
    Array.each(this.layerList.getChildren(), function(li) {
      if (li.getElement('a').text.toLowerCase() === name) {
        exists = true;
      }
    });
    if (!exists) {
      var new_layer = this.layerList.getLast('li').clone();
      new_layer.getElement('a').addClass('success');
      new_layer.getElement('a').set('text', name);
      new_layer.injectBefore(this.layerList.getFirst('li'));
    }
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
        }
      });
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
      }
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
    bb.append(this.cartogMap.exportMap());

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
  updateLayerList: function() {
    var self = this;
    self.setAllLayersInactive();
    Array.each(self.cartogMap.map.sublayers, function(layer) {
      self.addLayerToList(layer.tag);
    });
    self.setLastLayerActive();
    self.bindLayerButtons();
    self.bindLayerEvents();
  },
  bindColorEvents: function() {
    var self = this;
    this.addColor.addEvent('click', function() {
      if (self.colorValue.value !== '') {
        self.cartogMap.addColor('#' + self.colorValue.value);
        self.colorValue.value = '';
        self.updateColorList();
      }
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
      self.disableSettings();
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
  disableSettings: function() {
    var self = this;
    self.widthSetting.addClass('disabled').set('disabled', true);
    self.heightSetting.addClass('disabled').set('disabled', true);
    self.rowSetting.addClass('disabled').set('disabled', true);
    self.columnSetting.addClass('disabled').set('disabled', true);
  },
  layoutViews: function() {
    var self = this;
    self.mapHolder.setStyle('width', self.cartogMap.width + 'px');
    self.tools.setStyle('left', self.mapHolder.getCoordinates().right + 80 + 'px');
  },
  bindSettingsEvents: function() {
    var self = this;
    self.widthSetting.addEvent('keyup', function() {
      if (this.value !== '') {
        self.cartogMap.setWidth(this.value);
        self.cartogMap.bindLayerEvents();
        self.layoutViews();
      }
    });
    self.heightSetting.addEvent('keyup', function() {
      if (this.value !== '') {
        self.cartogMap.setHeight(this.value);
        self.cartogMap.bindLayerEvents();
        self.layoutViews();
      }
    });
    self.rowSetting.addEvent('keyup', function() {
      if (this.value !== '') {
        self.cartogMap.setRows(this.value);
        self.cartogMap.bindLayerEvents();
        self.layoutViews();
      }
    });
    self.columnSetting.addEvent('keyup', function() {
      if (this.value !== '') {
        self.cartogMap.setColumns(this.value);
        self.cartogMap.bindLayerEvents();
        self.layoutViews();
      }
    });
  }
});

var sidebar_width = $('map').getCoordinates().left;
var align_to_form = $('settings').getElement('h6').getCoordinates().bottom;
var cartog = new Cartog(sidebar_width, align_to_form);
cartog.attach($('map'));
var cartogUI = new CartogUI(cartog);
