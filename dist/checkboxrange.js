'use strict';

// Create objects in older browsers
if (typeof Object.create !== 'function') {
  Object.create = function (obj) {
    function F() {
    }
    F.prototype = obj;
    return new F();
  };
}

/*! checkboxrange v0.1.0-alpha [27-04-2015] | (c) Rafael Pawlos (http://rafaelpawlos.com) | MIT license */
(function ($, document) {

  var pluginName = 'checkboxrange';
  var storageName = 'plugin_' + pluginName;

  var pluginObject = {
    init: function (opts, container) {
      var self = this;

      self.opts = opts;
      self.container = $(container);
      self.checkboxes = self.container.find('input[type="checkbox"]');
      self.container.addClass('checkbox-range-container');

      if (!self.opts.noStyle) {
        self.container.addClass('cr-style');
        self.createStyleMask();
      }

      self.indexElements(self.checkboxes);
      self.bindActions();
    },
    
    bindActions: function () {
      var self = this;

      self.checkboxes.on('mousedown touchstart', function (e) {
        if (e.type === 'touchstart' && e.originalEvent.touches.length !== 1) {
          return;
        }

        self.startPoint = $(e.target);
        self.startPointIndex = self.startPoint.data(self.iKey);
        self.startPointOffLeft = self.startPoint.offset().left;
        self.startPointOffTop = self.startPoint.offset().top;

        self.containerOffLeft = self.container.offset().left;
        self.containerOffTop = self.container.offset().top;

        self.assembleMarkElements();
        self.bind(self.container, 'mousemove', self.movePointer);
        self.bindHoverActions();
      });

      $(document).on('mouseup touchend', function () {
        $('#checkbox-range-start, #checkbox-range-bound-canvas, #checkbox-range-stop').remove();
        self.unbind(self.container, 'mousemove');
        self.unbind(self.checkboxes, 'mouseenter');
        self.unbind(self.checkboxes, 'touchstart.second');
      });
    },
    
    bindHoverActions: function () {
      var self = this;

      self.bind(self.checkboxes, 'mouseenter touchstart.second', function (e) {
        if (e.type === 'touchstart') {
          if (e.originalEvent.touches.length !== 1) {
            self.endPoint = $(e.originalEvent.touches[1].target);
          }
          else {
            return;
          }
        }
        else {
          self.endPoint = $(e.target);
        }
        self.endPointIndex = self.endPoint.data(self.iKey);

        if (self.endPointIndex === self.startPointIndex) {
          return;
        }

        self.endPoint.after('<span id="checkbox-range-stop"></span>');
        self.magnetToEndPoint();
        self.unbind(self.container, 'mousemove');
        self.bind(self.endPoint, 'mouseup touchend', self.toggleCheckboxesRange, true);

        self.endPoint.one('mouseleave touchend', function () {
          self.endPoint.off('mouseup');
          $('#checkbox-range-stop').remove();
          self.bind(self.container, 'mousemove', self.movePointer);
        });
      });
    },
    
    bind: function (element, events, method, one) {
      var self = this;

      var namespace = '.' + pluginName;
      if (/ /.test(events)) {
        var eventsArray = events.split(' ');
        var eventsNamespaced = eventsArray.join(namespace + ' ') + namespace;
      }
      else {
        var eventsNamespaced = events + namespace;
      }

      if (one) {
        element.one(eventsNamespaced, function (e) {
          return method.call(self, e);
        });
      }
      else {
        element.on(eventsNamespaced, function (e) {
          return method.call(self, e);
        });
      }
    },
    
    unbind: function (element, event) {
      var eventNamespaced = event + '.' + pluginName;
      element.off(eventNamespaced);
    },
    
    indexElements: function (elements) {
      var self = this;

      self.iKey = pluginName + 'Index';
      elements.each(function (index) {
        $.data(this, self.iKey, index);
      });
    },
    
    createStyleMask: function () {
      var self = this;

      self.checkboxes.after('<span class="checkbox-mask"></span>');
    },
    
    assembleMarkElements: function () {
      var self = this;

      var x = self.startPoint.offset().left - self.containerOffLeft + self.opts.lineOffsetLeft;
      var y = self.startPoint.offset().top - self.containerOffTop + self.opts.lineOffsetTop;
      self.startPoint.after('<span id="checkbox-range-start"></span>');
      self.container.append('<svg id="checkbox-range-bound-canvas"><line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y + '"/></svg>');
    },
    
    movePointer: function (e) {
      var self = this;

      var pageX = e.pageX;
      var pageY = e.pageY;

      switch (self.opts.path) {
        case 'horizontal':
          var x = pageX - self.containerOffLeft;
          var y = self.startPointOffTop - self.containerOffTop + self.opts.lineOffsetTop;
          break;
        case 'vertical':
          var x = self.startPointOffLeft - self.containerOffLeft + self.opts.lineOffsetLeft;
          var y = pageY - self.containerOffTop;
          break;
        case 'any':
          var x = pageX - self.containerOffLeft;
          var y = pageY - self.containerOffTop;
          break;
      }
      $('#checkbox-range-bound-canvas line').attr('x2', x).attr('y2', y);
    },
    
    magnetToEndPoint: function () {
      var self = this;

      var x = self.endPoint.offset().left - self.containerOffLeft + self.opts.lineOffsetLeft;
      var y = self.endPoint.offset().top - self.containerOffTop + self.opts.lineOffsetTop;
      $('#checkbox-range-bound-canvas line').attr('x2', x).attr('y2', y);
    },
    
    getElementsRange: function () {
      var self = this;

      if (self.startPointIndex > self.endPointIndex) {
        // toogle variables if end point is before start point
        var startPointIndexTemp = self.startPointIndex;
        self.startPointIndex = self.endPointIndex;
        self.endPointIndex = startPointIndexTemp;
      }

      var range = self.startPoint.add(self.endPoint);
      self.checkboxes.each(function (index) {
        if (index > self.startPointIndex && index < self.endPointIndex) {
          range = range.add(self.checkboxes[index]);
        }
      });

      return range;
    },
    
    toggleCheckboxesRange: function () {
      var self = this;
      
      var rangeElements = self.getElementsRange();
      rangeElements.prop('checked', function () {
        if ($(this).prop('checked') === true) {
          $(this).prop('checked', false);
        } else {
          $(this).prop('checked', true);
        }
      });
    }
  };

  $.fn[pluginName] = function (options) {
    var opts = $.extend(true, {
      path: 'any',
      noStyle: false,
      lineOffsetTop: 10,
      lineOffsetLeft: 10,
      onSelectEnd: function () {
      }
    }, options);

    return this.each(function () {
      var pluginInstance = $.data(this, storageName);
      if (!pluginInstance) {
        pluginInstance = Object.create(pluginObject).init(opts, this);
        $.data(this, storageName, pluginInstance);
      } else {
        $.error('Plugin is already initialized for this object.');
        return;
      }
    });
  };
}(jQuery, document));
