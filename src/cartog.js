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
    dict[this.name] = {
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
  }
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

MIME_TYPE = 'application/json';

var cleanUp = function(a) {
  a.dataset.disabled = true;

  // Need a small delay for the revokeObjectURL to work properly.
  setTimeout(function() {
    window.URL.revokeObjectURL(a.href);
  }, 1500);
};

var downloadFile = function() {
  window.URL = window.webkitURL || window.URL;
  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

  // var prevLink = output.querySelector('a');
  // if (prevLink) {
  //   window.URL.revokeObjectURL(prevLink.href);
  //   output.innerHTML = '';
  // }

  var bb = new BlobBuilder();
  bb.append(cartog.export());

  var exportButton = $('export');
  exportButton.download = $('name').value + $('format').value;
  exportButton.href = window.URL.createObjectURL(bb.getBlob(MIME_TYPE));

  exportButton.dataset.downloadurl = [MIME_TYPE, exportButton.download, exportButton.href].join(':');
  exportButton.draggable = true; // Don't really need, but good practice.
  exportButton.classList.add('dragout');

  exportButton.onclick = function(e) {
    if ('disabled' in this.dataset) {
      return false;
    }

    cleanUp(this);
  };
};

var openFile = function(evt) {
  var files = evt.target.files;

  Array.each(files, function(file) {
    var reader = new FileReader();

    reader.onload = (function(theFile) {
        return function(e) {
          $('name').value = theFile.name.replace('.json', '');
          cartog.open(theFile, e.target.result);
        };
      })(file);
      reader.readAsText(file);
  });
};

$('fileInput').addEvent('change', openFile);

$('save').addEvent('click', function() {
  $('save_state').removeClass('warning');
  $('save_state').addClass('success');
  $('save_state').getElement('p').set('text', 'Saved! Ready to export.');
  downloadFile();
  $('export').removeClass('disabled');
  // cartog.export();
});

$('add_color').addEvent('click', function() {
  if ($('color_value').value !== '') {
    cartog.addColor('#' + $('color_value').value);
    $('color_value').value = '';
    updateColorList();
  };
});

$('map').setStyle('width', cartog.map.frame.width);
$('tools').setStyle('left', $('map').getCoordinates()['right'] + 80 + 'px');
updateColorList();

