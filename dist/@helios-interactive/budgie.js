'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Budgie = function () {

  /**
   *
   * @param items
   * @param selector
   * @param options
   */
  function Budgie(items, selector) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Budgie);

    this.selector = selector;
    this.options = Object.assign(this.constructor.defaultOptions(), options);

    this.isNew = true;
    this.budgieId = Math.floor((1 + Math.random()) * 0x10000);
    this.items = items;

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

  _createClass(Budgie, [{
    key: 'setupContainer',
    value: function setupContainer() {
      var parentContainer = this.constructor.getElement(this.selector);
      parentContainer.classList.add('budgie-flex-container-parent-' + this.budgieId);
      this.parentContainer = parentContainer;

      var budgieFlexContainer = document.createElement('div');
      budgieFlexContainer.classList.add('budgie-flex-container');
      budgieFlexContainer.classList.add('budgie-container-' + this.budgieId);
      parentContainer.appendChild(budgieFlexContainer);
      this.setCSS(budgieFlexContainer);

      this.container = budgieFlexContainer;
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

      document.styleSheets[0].insertRule('.budgie-flex-item-' + this.budgieId + '{width: ' + width + '%; height: ' + height + '%;}', numOfSheets);
      document.styleSheets[0].insertRule('.budgie-flex-item-image-' + this.budgieId + '{background-size: ' + this.options.imageFit + ';}', numOfSheets);

      for (var i = numberAcross - 1; i >= 0; i--) {
        document.styleSheets[0].insertRule('.budgie-flex-item-' + this.budgieId + '--filler-' + i + '{width: ' + width * (numberAcross - i) / 2 + '%; height: ' + height * (numberAcross - i) / 2 + '%; flex-grow: 1;}', numOfSheets);
      }

      var direction = this.options.direction === 'horizontal' ? 'column' : 'row';
      document.styleSheets[0].insertRule('.budgie-container-' + this.budgieId + '{flex-direction: ' + direction + ';}', numOfSheets);

      document.styleSheets[0].insertRule('.budgie-flex-container-parent-' + this.budgieId + '{overflow-x: ' + (this.options.direction === 'horizontal' ? 'scroll' : 'hidden') + '; overflow-y: ' + (this.options.direction === 'vertical' ? 'scroll' : 'hidden') + '}', numOfSheets);
      document.styleSheets[0].insertRule('.budgie-flex-container-parent-' + this.budgieId + '::-webkit-scrollbar{display: none;}', numOfSheets);
    }
  }, {
    key: 'insertItems',
    value: function insertItems() {
      var _this = this;

      this.items.forEach(function (item, id) {
        // Add a filler item so that odd ending lists will have a centered ending
        if (_this.numberLeftWithOddEnding() > 0 && _this.items.length - _this.numberLeftWithOddEnding() === id) {
          _this.container.appendChild(_this.newFillerItem());
        }

        // Add the item
        _this.container.appendChild(_this.constructor.createElementForItem(item, id, _this.budgieId));

        // Add a filler item so that odd ending lists will have a centered ending
        if (_this.numberLeftWithOddEnding() > 0 && _this.items.length === id + 1) {
          _this.container.appendChild(_this.newFillerItem());
        }
      });
      if (this.items.length < this.elementsOnScreen()) {
        // Append an extra div so that new items can be added
        var blankEle = document.createElement('div');
        blankEle.classList.add('budgie-flex-item-' + this.budgieId + '--blank');
        this.container.appendChild(blankEle);
      }
    }
  }, {
    key: 'newFillerItem',
    value: function newFillerItem() {
      var filler = document.createElement('div');
      filler.classList.add('budgie-flex-item-' + this.budgieId + '--filler');
      filler.classList.add('budgie-flex-item-' + this.budgieId + '--filler-' + this.numberLeftWithOddEnding());
      return filler;
    }

    /**
     * Appends duplicate items equal to the number that fit in the view (numberHigh * numberWide)
     * Prepends duplicate items equal to the last row/column of items
     */

  }, {
    key: 'appendExtraItems',
    value: function appendExtraItems() {
      var _this2 = this;

      var elementsOnScreen = this.elementsOnScreen();
      // Store a list of the non duplicated elements
      var realElements = Array.from(document.getElementsByClassName('budgie-flex-item-' + this.budgieId));

      // If the number of elements is greater than the number that fit in the given area
      if (this.items.length > elementsOnScreen) {
        // Appends duplicate items equal to the number of elementsOnScreen
        realElements.slice(0, elementsOnScreen).forEach(function (element) {
          var ele = element.cloneNode(true);
          ele.classList.add('budgie-flex-item-' + _this2.budgieId + '--duplicate');
          _this2.container.insertAdjacentElement('beforeend', ele);
        });

        // Prepends duplicate items equal to the number of elementsOnScreen
        if (this.numberLeftWithOddEnding() > 0) {
          // The column or row is NOT full, fillers are needed
          // Add a filler item so that odd ending lists will have a centered ending
          this.container.insertAdjacentElement('afterbegin', this.newFillerItem());

          // Add the duplicated elements
          realElements.slice(realElements.length - this.numberLeftWithOddEnding(), realElements.length).forEach(function (element) {
            var ele = element.cloneNode(true);
            ele.classList.add('budgie-flex-item-' + _this2.budgieId + '--duplicate');
            _this2.container.insertAdjacentElement('afterbegin', ele);
          });

          // Add a filler item so that odd ending lists will have a centered ending
          this.container.insertAdjacentElement('afterbegin', this.newFillerItem());
        } else {
          // The column or row is full, not fillers needed
          var elementsToDupe = this.options.direction === 'horizontal' ? this.options.numberHigh : this.options.numberWide;

          // Add the duplicated elements
          realElements.slice(realElements.length - elementsToDupe, realElements.length).forEach(function (element) {
            var ele = element.cloneNode(true);
            ele.classList.add('budgie-flex-item-' + _this2.budgieId + '--duplicate');
            _this2.container.insertAdjacentElement('afterbegin', ele);
          });
        }
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
      var elementCount = document.querySelectorAll('.budgie-flex-item-' + this.budgieId + ':not(.budgie-flex-item-' + this.budgieId + '--duplicate)').length;
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

      var elements = document.getElementsByClassName('budgie-' + this.budgieId + '-' + eleIndex);
      elements[0].parentNode.removeChild(elements[0]);
    }
  }, {
    key: 'addLastItem',
    value: function addLastItem() {
      var itemIndex = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.items.length - 1;
      var eleIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.items.length - 2;

      // eleIndex; subtract 2 to account for using length not index, and also to get the last element before the push
      var elements = document.getElementsByClassName('budgie-' + this.budgieId + '-' + eleIndex);
      var newElement = this.constructor.createElementForItem(this.items[itemIndex], itemIndex, this.budgieId);
      elements[0].parentNode.insertBefore(newElement, elements[0].nextSibling);
    }
  }, {
    key: 'updateExistingItems',
    value: function updateExistingItems() {
      var _this3 = this;

      this.items.forEach(function (item, index) {
        Array.from(document.getElementsByClassName('budgie-' + _this3.budgieId + '-' + index)).forEach(function (element) {
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

      if (redraw) Array.from(document.getElementsByClassName('budgie-flex-item-' + this.budgieId + '--filler')).forEach(function (element) {
        return element.parentNode.removeChild(element);
      });

      if (this.numberLeftWithOddEnding() > 0) {
        if (document.getElementsByClassName('budgie-flex-item-' + this.budgieId + '--filler').length === 0) {
          var lastElement = document.getElementsByClassName('budgie-' + this.budgieId + '-' + (this.items.length - 1))[0];
          var firstElement = document.getElementsByClassName('budgie-' + this.budgieId + '-' + (this.items.length - this.numberLeftWithOddEnding()))[0];
          firstElement.parentNode.insertBefore(this.newFillerItem(), firstElement);
          lastElement.parentNode.insertBefore(this.newFillerItem(), lastElement.nextSibling);
        } else {
          Array.from(document.getElementsByClassName('budgie-flex-item-' + this.budgieId + '--filler')).forEach(function (element) {
            element.classList.remove('budgie-flex-item-' + _this4.budgieId + '--filler-' + (_this4.numberLeftWithOddEnding() + operator));
            element.classList.add('budgie-flex-item-' + _this4.budgieId + '--filler-' + _this4.numberLeftWithOddEnding());
          });
        }
      } else {
        Array.from(document.getElementsByClassName('budgie-flex-item-' + this.budgieId + '--filler')).forEach(function (element) {
          return element.parentNode.removeChild(element);
        });
      }

      if (this.items.length <= this.elementsOnScreen()) {
        Array.from(document.getElementsByClassName('budgie-flex-item-' + this.budgieId + '--duplicate')).forEach(function (element) {
          return element.parentNode.removeChild(element);
        });

        // Append an extra div so that new items can be added
        if (document.getElementsByClassName('budgie-flex-item-' + this.budgieId + '--blank').length === 0) {
          var blankEle = document.createElement('div');
          blankEle.classList.add('budgie-flex-item-' + this.budgieId + '--blank');
          this.container.appendChild(blankEle);
        }
      }

      if (this.items.length > this.elementsOnScreen() && document.getElementsByClassName('budgie-flex-item-' + this.budgieId + '--duplicate').length === 0) {
        this.appendExtraItems();

        Array.from(document.getElementsByClassName('budgie-flex-item-' + this.budgieId + '--blank')).forEach(function (blankEle) {
          return blankEle.parentNode.removeChild(blankEle);
        });
      }
    }

    /**
     * Returns the height and width measurements of the elements associated with the given selector
     * @param selector
     * @returns {{}} The height and width measurements of the element associated with the given selector.
     */

  }, {
    key: 'elementMeasurement',
    value: function elementMeasurement(selector) {
      var measure = {};
      measure.height = parseFloat(window.getComputedStyle(document.getElementsByClassName(selector)[0]).height);
      measure.width = parseFloat(window.getComputedStyle(document.getElementsByClassName(selector)[0]).width);
      return measure;
    }

    /**
     * Returns the size of the scroll container for this budgie instance
     * @returns {number} Measurement in px.
     */

  }, {
    key: 'scrollSizeMeasurement',
    value: function scrollSizeMeasurement() {
      switch (this.options.direction) {
        case 'vertical':
          return this.elementMeasurement('budgie-flex-item-' + this.budgieId).height * Math.ceil(this.items.length / this.options.numberWide);
          break;
        case 'horizontal':
          return this.elementMeasurement('budgie-flex-item-' + this.budgieId).width * Math.ceil(this.items.length / this.options.numberHigh);
          break;
      }
    }

    /**
    * Will reset the budgie elements scrollProperty if it hits a wrap point.
    * @param {string} scrollDirection - The scroll direction of the given budgie instance.
    *   can be 'scrollTop' or 'scrollLeft'
    * @returns undefined
    * */

  }, {
    key: 'onScroll',
    value: function onScroll(scrollDirection) {
      var scrollContainerSize = this.scrollSizeMeasurement();

      console.log('On Scroll', this.parentContainer[scrollDirection], scrollContainerSize);
      if (this.parentContainer[scrollDirection] >= scrollContainerSize) {
        this.parentContainer[scrollDirection] = 0;
      } else if (this.parentContainer[scrollDirection] <= 0) {
        this.parentContainer[scrollDirection] = scrollContainerSize;
      }
    }

    /**
     * Will return the scroll property ('scrollTop' or 'scrollLeft') of the budgie instance
     * @returns {String} The scroll property ('scrollTop' or 'scrollLeft') of the budgie instance
     */

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

      var measure = this.elementMeasurement('budgie-container-' + this.budgieId);
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

    /**
     *
     */

  }, {
    key: 'remove',
    value: function remove() {
      this.stop();
      this.container.parentElement.classList.remove('budgie-flex-container-parent-' + this.budgieId);
      this.container.parentElement.removeChild(this.container);
    }

    /*
    * Changes the inversion of the budgie instance.
    * */

  }, {
    key: 'changeInversion',
    value: function changeInversion() {
      this.options.inverted = !this.options.inverted;
    }
  }], [{
    key: 'defaultOptions',
    value: function defaultOptions() {
      return {
        'numberHigh': 1,
        'numberWide': 1,
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

    /**
     *
     * @param selector either an id, class, or DOM element
     * @returns {{}} returns the DOM element that matches the selector
     */

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
    value: function createElementForItem(item, id, budgieId) {
      var e = document.createElement('div');

      if (typeof item === 'string') {
        e.style.backgroundImage = 'url(' + item + ')';
      } else {
        e.appendChild(item);
      }
      e.classList.add('budgie-flex-item-' + budgieId);
      e.classList.add('budgie-flex-item-image-' + budgieId);
      e.classList.add('budgie-' + budgieId + '-' + id);
      return e;
    }
  }]);

  return Budgie;
}();

if (typeof global !== 'undefined') global.Budgie = Budgie;
//# sourceMappingURL=budgie.js.map
