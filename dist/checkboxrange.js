/*! checkboxrange v0.4.0-alpha [15-05-2015] | (c) Rafael Pawlos (https://pawlos.dev) | MIT license */

(function ($, document, window) {

  var pluginName = 'checkboxrange';
  var storageName = 'plugin_' + pluginName;

  var pluginObject = {
    init: function (opts, support, container) {
      var self = this;

      self.opts = opts;
      self.support = support;
      self.container = $(container);
      self.checkboxes = self.container.find('input[type="checkbox"]');
      self.container.addClass('checkbox-range-container');

      if (!opts.noStyle) {
        self.container.addClass('cr-style');
        self.createStyleMask();
      }
      if (support.touch && opts.onTouchLabels){
        self.createOnTouchLabels();
      }

      self.assembleMarkElements();
      self.indexElements(self.checkboxes);
      self.bindActions();
      self.bindShiftKeyHelpers();
    },
    
    bindActions: function () {
      var self = this;

      self.bind(self.checkboxes, 'mousedown touchstart', self.selectStart);
      self.bind($(window), 'keydown', self.selectStart);
      self.bind($(document),'mouseup touchend', self.clean);
    },
    
    bindShiftKeyHelpers: function () {
      var self = this;

      self.bind(self.checkboxes, 'mouseup.shift', function (e) {
        if (!self.shiftHold) {
          self.lastChecked = $(e.target);
        }
      });

      self.bind($(window), 'keyup', function (e) {
        if (e.keyCode === 16) {
          self.shiftHold = false;
          self.clean();
        }
      });
    },
    
    selectStart: function (e) {
      var self = this;

      if ((e.type === 'touchstart' && e.originalEvent.touches.length !== 1) || (e.type === 'keydown' && !(e.keyCode === 16 && self.lastChecked)) || self.shiftHold) {
        return;
      }
      if (e.type === 'touchstart' && !self.firstTouched){
        self.firstTouched = true;
        self.unbind(self.checkboxes, 'mousedown');
      }
      if(e.type === 'keydown'){
        self.shiftHold = true;
      }
      
      self.startPoint = (e.type === 'keydown') ? self.lastChecked : $(e.target);
      self.startPointIndex = self.startPoint.data(self.iKey);
      self.startPointOffLeft = self.startPoint.offset().left;
      self.startPointOffTop = self.startPoint.offset().top;

      self.containerOffLeft = self.container.offset().left;
      self.containerOffTop = self.container.offset().top;

      self.updateLineStart();
      self.startPoint.next().addClass('show');

      self.bind(self.container, 'mousemove.line touchmove.line', self.moveLine);
      self.bind(self.container, 'mousemove.edge touchmove.edge', self.scrollOnEdge);
      self.bind(self.container, 'touchmove', self.touchDragActions);
      self.bind(self.checkboxes, 'mouseenter touchstart.second', self.dragActions);
    },
    
    dragActions: function (e) {
      var self = this;

      if (e.type === 'touchstart') {
        if (e.originalEvent.touches.length !== 1) {
          self.endPoint = $(e.originalEvent.touches[1].target);
          self.unbind(self.container, 'touchmove');
          self.bind(self.container, 'touchmove', function(e){e.preventDefault();});
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

      self.stopMoveLine = true;
      self.magnetToEndPoint();

      self.endPoint.next().addClass('show');
      self.bind(self.endPoint, 'mouseup.select touchend.select', self.toggleCheckboxesRange, true);

      self.bind(self.endPoint, 'mouseleave touchend', function (e) {
        self.unbind(self.endPoint, 'mouseup.select');
        if (e.target !== self.startPoint[0]) {
          $(e.target).next().removeClass('show');
        }
        self.stopMoveLine = false;
      });
    },
    
    touchDragActions: function (e) {
      var self = this;

      e.preventDefault();
      var target = document.elementFromPoint(e.originalEvent.touches[0].clientX, e.originalEvent.touches[0].clientY);
      if (target) {
        if (self.endPoint && target !== self.endPoint[0] && self.onTouchLeave) {
          self.onTouchLeave = false;
          if (self.endPointIndex !== self.startPointIndex) {
            self.endPoint.next().removeClass('show');
          }
          self.stopMoveLine = false;
          self.endPoint = null;
        }
        if (!self.onTouchLeave && !(self.endPoint && target === self.endPoint[0]) && target !== self.container[0] && self.container[0].contains(target)) {
          self.endPoint = $(target);
          if (!self.touchEndBinded) {
            self.bind(self.checkboxes, 'touchend', self.toggleCheckboxesRange);
            self.touchEndBinded = true;
          }
          self.stopMoveLine = true;
          self.magnetToEndPoint();
          self.endPointIndex = self.endPoint.data(self.iKey);
          self.endPoint.next().addClass('show');
          self.onTouchLeave = true;
        }
      }
    },
    
    clean: function (e) {
      var self = this;
      
      if(self.shiftHold){
        return;
      }

      self.container.find('.checkbox-range-point').removeClass('show');
      self.svgLine.attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0);
      self.unbind(self.container, 'mousemove');
      self.unbind(self.container, 'touchmove');
      self.unbind(self.checkboxes, 'mouseenter');
      self.unbind(self.checkboxes, 'touchstart.second');
      if (self.touchEndBinded) {
        setTimeout(function () {
          self.unbind(self.checkboxes, 'touchend');
          self.onTouchLeave = false;
          self.touchEndBinded = false;
        }, 20);
      }
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

      self.checkboxes.after('<span class="checkbox-range-point"></span>');
      self.svgCanvas = $('<svg class="checkbox-range-bound-canvas"></svg>');
      self.container.append(self.svgCanvas);
      self.svgLine = $(document.createElementNS('http://www.w3.org/2000/svg', 'line'));
      self.svgCanvas.append(self.svgLine);
    },
    
    updateLineStart: function () {
      var self = this;

      var x = self.startPoint.offset().left - self.containerOffLeft + self.opts.lineOffsetLeft;
      var y = self.startPoint.offset().top - self.containerOffTop + self.opts.lineOffsetTop;
      self.svgLine.attr('x1', x).attr('y1', y).attr('x2', x).attr('y2', y);
    },
    
    moveLine: function (e) {
      var self = this;
      if (!self.stopMoveLine) {
        switch (e.type) {
          case 'touchmove':
            var pageX = e.originalEvent.touches[0].pageX;
            var pageY = e.originalEvent.touches[0].pageY;
            break;
          default:
            var pageX = e.pageX;
            var pageY = e.pageY;
        }

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
        self.svgLine.attr('x2', x).attr('y2', y);
      }
    },
    
    scrollOnEdge: function (e) {
      var self = this;

      switch (e.type) {
        case 'touchmove':
          if (e.originalEvent.touches[0].clientY < 20) {
            self.support.stContainer.scrollTop -= 3;
          }
          else if (e.originalEvent.touches[0].clientY > window.innerHeight - 20) {
            self.support.stContainer.scrollTop += 3;
          }
          break;
        default:
          if (e.clientY < 20) {
            self.support.stContainer.scrollTop -= 5;
          }
          else if (e.clientY > window.innerHeight - 20) {
            self.support.stContainer.scrollTop += 5;
          }
      }
    },

    createOnTouchLabels: function () {
      var self = this;

      self.checkboxes.each(function () {
        var checkbox = $(this);
        var label = checkbox.siblings('label')[0] || checkbox.parent('label')[0];
        if (label) {
          var labeltxt = $(label).text();
          if (labeltxt.length > self.opts.onTouchLabelsLimit) {
            labeltxt = labeltxt.substring(0, self.opts.onTouchLabelsLimit - 1) + "...";
          }
          checkbox.parent().append('<span class="ontouch-label">' + labeltxt + '</span>');
        }
      });
    },
    
    magnetToEndPoint: function () {
      var self = this;

      var x = self.endPoint.offset().left - self.containerOffLeft + self.opts.lineOffsetLeft;
      var y = self.endPoint.offset().top - self.containerOffTop + self.opts.lineOffsetTop;
      self.svgLine.attr('x2', x).attr('y2', y);
    },
    
    getElementsRange: function () {
      var self = this;

      if (self.startPointIndex > self.endPointIndex) {
        // toogle variables if end point is before start point
        var startPointIndexTemp = self.startPointIndex;
        self.startPointIndex = self.endPointIndex;
        self.endPointIndex = startPointIndexTemp;
      }

      if (self.shiftHold) {
        var startChecked = self.startPoint.prop('checked');
        var endChecked = self.endPoint.prop('checked');
        if ((startChecked && !endChecked) || (!startChecked && endChecked)) {
          var range = $();
        }
        else {
          var range = self.startPoint;
        }
      } else {
        var range = self.startPoint.add(self.endPoint);
      }

      self.checkboxes.each(function (index) {
        if (index > self.startPointIndex && index < self.endPointIndex) {
          range = range.add(self.checkboxes[index]);
        }
      });

      return range;
    },
    
    toggleCheckboxesRange: function () {
      var self = this;
      
      if (self.endPoint) {
        
        self.lastChecked = self.endPoint;
        
        var rangeElements = self.getElementsRange();
        rangeElements.each(function () {
          if ($(this).prop('checked') === true) {
            $(this).prop('checked', false);
          } else {
            $(this).prop('checked', true);
          }
          if(self.opts.fireChangeEvent){
            var e = document.createEvent('Event');
            e.initEvent('change', false, false);
            this.dispatchEvent(e);
          }
        });
        
        self.opts.onSelectEnd();
        self.shiftHold = false;
      }
    }
  };

  $.fn[pluginName] = function (options) {
    var opts = $.extend(true, {
      path: 'any',
      noStyle: false,
      onTouchLabels: true,
      onTouchLabelsLimit: 25,
      lineOffsetTop: 10,
      lineOffsetLeft: 10,
      fireChangeEvent: false,
      onSelectEnd: function () {}
    }, options);
    var support = {
      stContainer: /AppleWebKit/.test(navigator.userAgent) ? document.body : document.documentElement,
      touch: (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch)
    };
    
    return this.each(function () {
      var pluginInstance = $.data(this, storageName);
      if (!pluginInstance) {
        pluginInstance = Object.create(pluginObject).init(opts, support, this);
        $.data(this, storageName, pluginInstance);
      } else {
        $.error('Plugin is already initialized for this object.');
        return;
      }
    });
  };
}(jQuery, document, window));

// Create objects in older browsers
if (typeof Object.create !== 'function') {
  Object.create = function (obj) {
    function F() {
    }
    F.prototype = obj;
    return new F();
  };
}
