'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var InfiniteScroller = function () {
  function InfiniteScroller(items, selector) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, InfiniteScroller);

    this.selector = selector;
    this.options = Object.assign(this.constructor.defaultOptions(), options);

    this.isNew = true;
    this.position = Math.floor((1 + Math.random()) * 0x10000);
    this.items = items;
    this.adjustedItems = [];

    var self = this;
    this.items.pop = function () {
      var a = Array.prototype.pop.apply(self.items, arguments);
      self.popItem();
      return a;
    };
    this.items.push = function () {
      var a = Array.prototype.push.apply(self.items, arguments);
      self.pushItem();
      return a;
    };
    this.items.shift = function () {
      var a = Array.prototype.shift.apply(self.items, arguments);
      self.shiftItem();
      return a;
    };
    this.items.unshift = function () {
      var a = Array.prototype.unshift.apply(self.items, arguments);
      self.unshiftItem();
      return a;
    };
    this.items.splice = function () {
      var a = Array.prototype.splice.apply(self.items, arguments);
      self.updateAllElements();
      return a;
    };

    this.start();
  }

  _createClass(InfiniteScroller, [{
    key: 'setupContainer',
    value: function setupContainer() {
      var parentContainer = this.constructor.getElement(this.selector);
      parentContainer.classList.add('infinite-flex-container-parent-' + this.position);
      this.parentContainer = parentContainer;

      var infiniteFlexContainer = document.createElement('div');
      infiniteFlexContainer.classList.add('infinite-flex-container');
      infiniteFlexContainer.classList.add('infinite-container-' + this.position);
      parentContainer.appendChild(infiniteFlexContainer);
      this.setCSS(infiniteFlexContainer);

      this.container = infiniteFlexContainer;
    }
  }, {
    key: 'bindScrollListener',
    value: function bindScrollListener() {
      var self = this;
      var scrollSize = this.scrollSizeMeasurement();
      var scrollDirection = this.scrollProperty();

      if (this.options.inverted && this.isNew) {
        this.parentContainer[scrollDirection] = scrollSize;
      }

      this.parentContainer.addEventListener("scroll", function () {
        self.onScroll(scrollDirection);
      });
    }
  }, {
    key: 'createItemList',
    value: function createItemList() {
      switch (this.options.oddEndingBehavior) {
        case 'duplicate':
          break;
        // todo
        case 'clip':
          this.adjustedItems = this.items.slice(0, this.items.length - this.numberLeftWithOddEnding());
          break;
        default:
          this.adjustedItems = this.items;
      }
    }
  }, {
    key: 'numberLeftWithOddEnding',
    value: function numberLeftWithOddEnding() {
      var numberAcross = this.options.direction === 'horizontal' ? this.options.numberHigh : this.options.numberWide;
      return this.items.length % numberAcross;
    }
  }, {
    key: 'setCSS',
    value: function setCSS(container) {
      var eleWidth = parseInt(window.getComputedStyle(container).width);
      var numOfSheets = 0;
      if (document.styleSheets[0].cssRules) {
        numOfSheets = document.styleSheets[0].cssRules.length;
      }

      var numberAcross = this.options.direction === 'horizontal' ? this.options.numberHigh : this.options.numberWide;

      // Width in %
      var width = eleWidth / this.options.numberWide / eleWidth * 100;
      var height = 100 / this.options.numberHigh;

      document.styleSheets[0].insertRule('.infinite-flex-item-' + this.position + '{width: ' + width + '%; height: ' + height + '%;}', numOfSheets);
      document.styleSheets[0].insertRule('.infinite-flex-item-image-' + this.position + '{background-size: ' + this.options.imageFit + ';}', numOfSheets);

      for (var i = numberAcross - 1; i >= 0; i--) {
        document.styleSheets[0].insertRule('.infinite-flex-item-' + this.position + '--filler-' + i + '{width: ' + width * (numberAcross - i) / 2 + '%; height: ' + height * (numberAcross - i) / 2 + '%; flex-grow: 1;}', numOfSheets);
      }

      var direction = this.options.direction === 'horizontal' ? 'column' : 'row';
      document.styleSheets[0].insertRule('.infinite-container-' + this.position + '{flex-direction: ' + direction + ';}', numOfSheets);

      document.styleSheets[0].insertRule('.infinite-flex-container-parent-' + this.position + '{overflow-x: ' + (this.options.direction === 'horizontal' ? 'scroll' : 'hidden') + '; overflow-y: ' + (this.options.direction === 'vertical' ? 'scroll' : 'hidden') + '}', numOfSheets);
      document.styleSheets[0].insertRule('.infinite-flex-container-parent-' + this.position + '::-webkit-scrollbar{display: none;}', numOfSheets);
    }
  }, {
    key: 'insertItems',
    value: function insertItems() {
      var _this = this;

      this.adjustedItems.forEach(function (item, id) {
        if (_this.numberLeftWithOddEnding() > 0 && _this.items.length - _this.numberLeftWithOddEnding() === id) {
          _this.container.appendChild(_this.newFillerItem());
        }

        _this.container.appendChild(_this.constructor.createElementForItem(item, id, _this.position));

        if (_this.numberLeftWithOddEnding() > 0 && _this.items.length === id + 1) {
          _this.container.appendChild(_this.newFillerItem());
        }
      });
      if (this.items.length < this.elementsOnScreen()) {
        // Append an extra div so that new items can be added
        var blankEle = document.createElement('div');
        blankEle.classList.add('infinite-flex-item-' + this.position + '--blank');
        this.container.appendChild(blankEle);
      }
    }
  }, {
    key: 'newFillerItem',
    value: function newFillerItem() {
      var filler = document.createElement('div');
      filler.classList.add('infinite-flex-item-' + this.position + '--filler');
      filler.classList.add('infinite-flex-item-' + this.position + '--filler-' + this.numberLeftWithOddEnding());
      return filler;
    }
  }, {
    key: 'appendExtraItems',
    value: function appendExtraItems() {
      var _this2 = this;

      var elementsOnScreen = this.elementsOnScreen();
      this.createItemList();

      if (this.adjustedItems.length > elementsOnScreen) {
        [].slice.call(document.getElementsByClassName('infinite-flex-item-' + this.position), 0, elementsOnScreen).forEach(function (element) {
          var ele = element.cloneNode(true);
          ele.classList.add('infinite-flex-item-' + _this2.position + '--duplicate');
          _this2.container.appendChild(ele);
        });
      }
    }
  }, {
    key: 'elementsOnScreen',
    value: function elementsOnScreen() {
      return parseInt(this.options.numberHigh) * parseInt(this.options.numberWide);
    }
  }, {
    key: 'pushItem',
    value: function pushItem() {
      this.addLastItem();
      this.updateListEnding('add');
      this.start();
    }
  }, {
    key: 'popItem',
    value: function popItem() {
      this.removeLastItem();
      this.updateListEnding('remove');
      this.start();
    }
  }, {
    key: 'shiftItem',
    value: function shiftItem() {
      this.updateExistingItems();
      this.removeLastItem();
      this.updateListEnding('remove');
      this.start();
    }
  }, {
    key: 'unshiftItem',
    value: function unshiftItem() {
      this.updateExistingItems();
      this.addLastItem();
      this.updateListEnding('add');
      this.start();
    }
  }, {
    key: 'updateAllElements',
    value: function updateAllElements() {
      var elementCount = document.querySelectorAll('.infinite-flex-item-' + this.position + ':not(.infinite-flex-item-' + this.position + '--duplicate)').length;
      if (this.items.length > elementCount) {
        for (var i = elementCount; i < this.items.length; i++) {
          this.addLastItem(i, i - 1);
        }
        this.updateListEnding('add', true);
      } else if (this.items.length < elementCount) {
        for (var _i = elementCount; _i > this.items.length; _i--) {
          this.removeLastItem(_i - 1);
        }
        this.updateListEnding('remove', true);
      }
      this.updateExistingItems();
      this.start();
    }
  }, {
    key: 'removeLastItem',
    value: function removeLastItem() {
      var eleIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.items.length;

      var elements = document.getElementsByClassName('infinite-' + this.position + '-' + eleIndex);
      elements[0].parentNode.removeChild(elements[0]);
    }
  }, {
    key: 'addLastItem',
    value: function addLastItem() {
      var itemIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.items.length - 1;
      var eleIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.items.length - 2;

      // eleIndex; subtract 2 to account for using length not index, and also to get the last element before the push
      var elements = document.getElementsByClassName('infinite-' + this.position + '-' + eleIndex);
      var newElement = this.constructor.createElementForItem(this.items[itemIndex], itemIndex, this.position);
      elements[0].parentNode.insertBefore(newElement, elements[0].nextSibling);
    }
  }, {
    key: 'updateExistingItems',
    value: function updateExistingItems() {
      var _this3 = this;

      this.items.forEach(function (item, index) {
        Array.from(document.getElementsByClassName('infinite-' + _this3.position + '-' + index)).forEach(function (element) {
          return element.style.backgroundImage = 'url(' + item + ')';
        });
      });
    }
  }, {
    key: 'updateListEnding',
    value: function updateListEnding(method) {
      var _this4 = this;

      var redraw = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      var operator = void 0;
      if (method === 'remove') {
        operator = 1;
      } else if (method === 'add') {
        // this covers 'add'
        operator = -1;
      } else {
        throw new Error("Only 'add' and 'remove' are supported arguments");
      }

      if (redraw) Array.from(document.getElementsByClassName('infinite-flex-item-' + this.position + '--filler')).forEach(function (element) {
        return element.parentNode.removeChild(element);
      });

      if (this.numberLeftWithOddEnding() > 0) {
        if (document.getElementsByClassName('infinite-flex-item-' + this.position + '--filler').length === 0) {
          var lastElement = document.getElementsByClassName('infinite-' + this.position + '-' + (this.items.length - 1))[0];
          var firstElement = document.getElementsByClassName('infinite-' + this.position + '-' + (this.items.length - this.numberLeftWithOddEnding()))[0];
          firstElement.parentNode.insertBefore(this.newFillerItem(), firstElement);
          lastElement.parentNode.insertBefore(this.newFillerItem(), lastElement.nextSibling);
        } else {
          Array.from(document.getElementsByClassName('infinite-flex-item-' + this.position + '--filler')).forEach(function (element) {
            element.classList.remove('infinite-flex-item-' + _this4.position + '--filler-' + (_this4.numberLeftWithOddEnding() + operator));
            element.classList.add('infinite-flex-item-' + _this4.position + '--filler-' + _this4.numberLeftWithOddEnding());
          });
        }
      } else {
        Array.from(document.getElementsByClassName('infinite-flex-item-' + this.position + '--filler')).forEach(function (element) {
          return element.parentNode.removeChild(element);
        });
      }

      if (this.items.length <= this.elementsOnScreen()) {
        Array.from(document.getElementsByClassName('infinite-flex-item-' + this.position + '--duplicate')).forEach(function (element) {
          return element.parentNode.removeChild(element);
        });

        // Append an extra div so that new items can be added
        if (document.getElementsByClassName('infinite-flex-item-' + this.position + '--blank').length === 0) {
          var blankEle = document.createElement('div');
          blankEle.classList.add('infinite-flex-item-' + this.position + '--blank');
          this.container.appendChild(blankEle);
        }
      }

      if (this.items.length > this.elementsOnScreen() && document.getElementsByClassName('infinite-flex-item-' + this.position + '--duplicate').length === 0) {
        this.appendExtraItems();

        Array.from(document.getElementsByClassName('infinite-flex-item-' + this.position + '--blank')).forEach(function (blankEle) {
          return blankEle.parentNode.removeChild(blankEle);
        });
      }
    }
  }, {
    key: 'elementMeasurement',
    value: function elementMeasurement(selector) {
      var measure = {};
      measure.height = parseFloat(window.getComputedStyle(document.getElementsByClassName(selector)[0]).height);
      measure.width = parseFloat(window.getComputedStyle(document.getElementsByClassName(selector)[0]).width);
      return measure;
    }
  }, {
    key: 'scrollSizeMeasurement',
    value: function scrollSizeMeasurement() {
      switch (this.options.direction) {
        case 'vertical':
          return this.elementMeasurement('infinite-flex-item-' + this.position).height * Math.ceil(this.adjustedItems.length / this.options.numberWide);
          break;
        case 'horizontal':
          return this.elementMeasurement('infinite-flex-item-' + this.position).width * Math.ceil(this.adjustedItems.length / this.options.numberHigh);
          break;
      }
    }
  }, {
    key: 'changeInversion',
    value: function changeInversion() {
      this.options.inverted = !this.options.inverted;
    }
  }, {
    key: 'onScroll',
    value: function onScroll(scrollDirection) {
      var scrollContainerSize = this.scrollSizeMeasurement();

      if (this.parentContainer[scrollDirection] >= scrollContainerSize) {
        this.parentContainer[scrollDirection] = 0;
      } else if (this.parentContainer[scrollDirection] <= 0) {
        this.parentContainer[scrollDirection] = scrollContainerSize;
      }
    }
  }, {
    key: 'scrollProperty',
    value: function scrollProperty() {
      if (this.options.direction === 'vertical') {
        return 'scrollTop';
      } else if (this.options.direction === 'horizontal') {
        return 'scrollLeft';
      }
    }
  }, {
    key: 'startAnimation',
    value: function startAnimation() {
      var _this5 = this;

      var fps = this.options.fps;

      var scrollDirection = this.scrollProperty();

      var scrollContainer = this.container.parentElement;
      var currentScroll = void 0;

      var measure = this.elementMeasurement('infinite-container-' + this.position);
      var viewMeasure = this.options.direction === "horizontal" ? measure.width : measure.height;
      var scrollSpeed = viewMeasure / this.options.secondsOnPage / fps;

      // always clear interval to ensure that only one scroller is running
      this.stop();
      if (this.items.length > this.elementsOnScreen()) {
        this.interval = setInterval(function () {
          var scrollDirection = _this5.scrollProperty();

          currentScroll = scrollContainer[scrollDirection];

          _this5.options.inverted ? currentScroll -= scrollSpeed : currentScroll += scrollSpeed;

          scrollContainer[scrollDirection] = currentScroll;
        }, 1000 / fps);
      } else {
        scrollContainer[scrollDirection] = 0;
      }
    }

    //////////////
    // Public methods for using the scroller
    //////////////
    // start the infinite scroll

  }, {
    key: 'start',
    value: function start() {
      if (this.isNew) {
        this.setupContainer();
        this.createItemList();
        this.insertItems();
        this.appendExtraItems();
        this.bindScrollListener();
      }
      if (this.options.autoScroll) {
        this.startAnimation();
      }
      this.isNew = false;
    }

    // stop the infinite scroll

  }, {
    key: 'stop',
    value: function stop() {
      if (!this.interval) return false;
      window.clearInterval(this.interval);
      return true;
    }
  }, {
    key: 'remove',
    value: function remove() {
      this.stop();
      this.container.parentElement.classList.remove('infinite-flex-container-parent-' + this.position);
      this.container.parentElement.removeChild(this.container);
    }
  }], [{
    key: 'defaultOptions',
    value: function defaultOptions() {
      return {
        'numberHigh': 1,
        'numberWide': 1,
        'oddEndingBehavior': 'default', //'default','duplicate','clip'
        'noScrollIfNoOverflow': true,
        'direction': 'vertical',
        'secondsOnPage': 1.0,
        'stopOnHover': false,
        'inverted': false,
        'autoScroll': true,
        'userNavigation': false,
        'imageFit': 'cover',
        'fps': 60
      };
    }
  }, {
    key: 'getElement',
    value: function getElement(selector) {

      // allow dom elements to get passed in directly
      if ((typeof selector === 'undefined' ? 'undefined' : _typeof(selector)) === 'object') return selector;

      var splitSelector = selector.substring(0, 1);
      switch (splitSelector) {
        case '.':
          return document.getElementsByClassName(selector.substring(1))[0];
          break;
        case '#':
          return document.getElementById(selector.substring(1));
          break;
        default:
          throw new Error("The selector must be a class or id, prepended by the identifier ('.'/'#')");
      }
    }
  }, {
    key: 'createElementForItem',
    value: function createElementForItem(item, id, position) {
      var e = document.createElement('div');

      if (typeof item === 'string') {
        e.style.backgroundImage = 'url(' + item + ')';
      } else {
        e.appendChild(item);
      }
      e.classList.add('infinite-flex-item-' + position);
      e.classList.add('infinite-flex-item-image-' + position);
      e.classList.add('infinite-' + position + '-' + id);
      return e;
    }
  }]);

  return InfiniteScroller;
}();

if (typeof global !== 'undefined') global.InfiniteScroller = InfiniteScroller;
//# sourceMappingURL=budgie.js.map
