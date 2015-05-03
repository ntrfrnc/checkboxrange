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

/*! checkboxrange v0.2.0-alpha [03-05-2015] | (c) Rafael Pawlos (http://rafaelpawlos.com) | MIT license */
(function ($, document, window) {

  var pluginName = 'checkboxrange';
  var storageName = 'plugin_' + pluginName;

  var pluginObject = {
    init: function (opts, container) {
      var self = this;

      self.opts = opts;
      self.container = $(container);
      self.checkboxes = self.container.find('input[type="checkbox"]');
      self.container.addClass('checkbox-range-container');
      self.cleanStart = true;

      self.scrollTopContainer = $(/AppleWebKit/.test(navigator.userAgent) ? "body" : "html");

      if (!self.opts.noStyle) {
        self.container.addClass('cr-style');
        self.createStyleMask();
      }

      self.assembleMarkElements();
      self.indexElements(self.checkboxes);
      self.bindActions();
      self.bindShiftKeyActions();
    },
    
    bindActions: function () {
      var self = this;

      self.bind(self.checkboxes, 'mousedown touchstart', self.selectStart);
      self.bind($(window), 'keydown', self.selectStart);
      self.bind($(document),'mouseup touchend', self.clean);
    },
    
    selectStart: function (e) {
      var self = this;

      if ((e.type === 'touchstart' && e.originalEvent.touches.length !== 1) || (e.type === 'keydown' && (e.keyCode !== 16 || !self.lastChecked)) || self.shiftSelectInProgress) {
        return;
      }
      if(e.type === 'keydown'){
        self.shiftSelectInProgress = true;
      }
      
      self.startPoint = (e.type === 'keydown') ? self.lastChecked : $(e.target);
      self.startPointIndex = self.startPoint.data(self.iKey);
      self.startPointOffLeft = self.startPoint.offset().left;
      self.startPointOffTop = self.startPoint.offset().top;

      self.containerOffLeft = self.container.offset().left;
      self.containerOffTop = self.container.offset().top;

      self.updateLineStart();
      self.startPoint.next()[0].style.visibility = 'visible';

      self.bind(self.container, 'mousemove.line touchmove.line', self.moveLine);
      self.bind(self.container, 'mousemove.edge touchmove.edge', self.scrollOnEdge);
      self.bind(self.container, 'touchmove', self.touchDragActions);
      self.bind(self.checkboxes, 'mouseenter touchstart.second', self.hoverActions);
    },
    
    hoverActions: function (e) {
      var self = this;

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

      self.stopMoveLine = true;
      self.magnetToEndPoint();

      self.endPoint.next()[0].style.visibility = 'visible';
      self.bind(self.endPoint, 'mouseup.select touchend.select', self.toggleCheckboxesRange, true);

      self.bind(self.endPoint, 'mouseleave touchend', function (e) {
        self.unbind(self.endPoint, 'mouseup.select');
        if (e.target !== self.startPoint[0]) {
          $(e.target).next()[0].style.visibility = 'hidden';
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
            self.endPoint.next()[0].style.visibility = 'hidden';
          }
          self.stopMoveLine = false;
          self.endPoint = null;
        }
        if (!self.onTouchLeave && (!self.endPoint || target !== self.endPoint[0]) && target !== self.container[0] && (target.parentNode === self.container[0] || target.parentNode.parentNode === self.container[0])) {
          self.endPoint = $(target);
          if (self.cleanStart) {
            self.bind(self.checkboxes, 'touchend', self.toggleCheckboxesRange);
            self.cleanStart = false;
          }
          self.stopMoveLine = true;
          self.magnetToEndPoint();
          self.endPointIndex = self.endPoint.data(self.iKey);
          self.endPoint.next()[0].style.visibility = 'visible';
          self.onTouchLeave = true;
        }
      }
    },
    
    bindShiftKeyActions: function () {
      var self = this;
      
      self.bind(self.checkboxes, 'mouseup.shift', function (e) {
        if (!self.shiftSelectInProgress) {
          self.lastChecked = $(e.target);
        }
      });

      self.bind($(window), 'keyup', function (e) {
        if (e.keyCode === 16) {
          self.shiftSelectInProgress = false;
          self.clean();
        }
      });
    },
    
    clean: function (e) {
      var self = this;
      
      if(self.shiftSelectInProgress){
        return;
      }

      self.container.find('.checkbox-range-point').css({
        visibility: 'hidden'
      });
      self.svgLine.attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 0);
      self.unbind(self.container, 'mousemove');
      self.unbind(self.container, 'touchmove');
      self.unbind(self.checkboxes, 'mouseenter');
      self.unbind(self.checkboxes, 'touchstart.second');
      if (!self.cleanStart) {
        setTimeout(function () {
          self.unbind(self.checkboxes, 'touchend');
          self.onTouchLeave = false;
          self.cleanStart = true;
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
            self.scrollTopContainer[0].scrollTop -= 3;
          }
          else if (e.originalEvent.touches[0].clientY > window.innerHeight - 20) {
            self.scrollTopContainer[0].scrollTop += 3;
          }
          break;
        default:
          if (e.clientY < 20) {
            self.scrollTopContainer[0].scrollTop -= 5;
          }
          else if (e.clientY > window.innerHeight - 20) {
            self.scrollTopContainer[0].scrollTop += 5;
          }
      }
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
      
      if(self.shiftSelectInProgress){
        var range = $();
      }else{
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
        rangeElements.prop('checked', function () {
          if ($(this).prop('checked') === true) {
            $(this).prop('checked', false);
          } else {
            $(this).prop('checked', true);
          }
        });
        
        self.opts.onSelectEnd();
        self.shiftSelectInProgress = false;
      }
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
}(jQuery, document, window));
