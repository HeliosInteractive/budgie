'use strict';

class InfiniteScroller {

  constructor(items, selector, options = {}) {

    this.selector = selector;
    this.options = Object.assign(this.constructor.defaultOptions(), options);

    this.isNew = true
    this.position = Math.floor((1 + Math.random()) * 0x10000)
    this.items = items;
    this.items.previousLength = items.length;
    this.adjustedItems = [];
    this.elements = [];

    var self = this;
    this.items.pop = function(){
      let a = Array.prototype.pop.apply(self.items, arguments);
      self.adjustElements()
      return a
    }
    this.items.push = function(){
      let a = Array.prototype.push.apply(self.items, arguments);
      self.adjustElements()
      return a
    }
    this.items.shift = function(){
      let a = Array.prototype.shift.apply(self.items, arguments);
      self.adjustElements()
      return a
    }
    this.items.unshift = function(){
      let a = Array.prototype.unshift.apply(self.items, arguments);
      self.adjustElements()
      return a
    }
    this.items.splice = function(){
      let a = Array.prototype.splice.apply(self.items, arguments);
      self.adjustElements()
      return a
    }

    this.start()
  }

  static defaultOptions() {
    return {
      'numberHigh': 1,
      'numberWide': 1,
      'oddEndingBehavior': 'default', //'default','duplicate','clip'
      'noScrollIfNoOverflow': true,
      'direction': 'vertical',
      'secondsOnPage': 1.0,
      'stopOnHover': false,
      'inverted': false,
      'scrollMode': true,
      'userNavigation': false,
      'imageFit': 'cover'
    };
  }

  static getElement(selector) {

    // allow dom elements to get passed in directly
    if(typeof selector === 'object' )return selector;

    let splitSelector = selector.substring(0, 1);
    switch(splitSelector){
      case '.':
        return document.getElementsByClassName(selector.substring(1))[0];
      case '#':
        return document.getElementById(selector.substring(1));
      default:
        throw new Error("The selector must be a class or id, prepended by the identifier ('.'/'#')")
    }
  }

  setupContainer() {
    let parentContainer = this.constructor.getElement(this.selector);
    parentContainer.className += ' infinite-flex-container-parent-' + this.position;

    let infiniteFlexContainer = document.createElement('div');
    infiniteFlexContainer.className += ' infinite-flex-container infinite-container-' + this.position;
    parentContainer.appendChild(infiniteFlexContainer);
    this.setCSS(infiniteFlexContainer);

    this.container = infiniteFlexContainer;
  }

  createItemList(){
    var self = this;
    switch(this.options.oddEndingBehavior){
      case 'duplicate':
        // todo
      case 'clip':
        self.adjustedItems = self.items.slice(0, self.items.length - self.numberLeftWithOddEnding())
        break;
      default:
        self.adjustedItems = self.items;
    }
  }

  numberLeftWithOddEnding(){
    let numberAcross = (this.options.direction === 'horizontal') ? this.options.numberHigh : this.options.numberWide
    return (this.items.length % numberAcross)
  }

  setCSS(container){
    let eleWidth = parseInt(window.getComputedStyle(container).width);
    let numOfSheets = document.styleSheets[0].cssRules.length;

    // Width in %
    let width = ((eleWidth / this.options.numberWide / eleWidth) * 100);
    let height = (100 / this.options.numberHigh);

    document.styleSheets[0].insertRule('.infinite-flex-item-'  + this.position + '{width: ' + width + '%; height: ' + height + '%;}', numOfSheets);
    document.styleSheets[0].insertRule('.infinite-flex-item-image-'  + this.position + '{background-size: ' + this.options.imageFit + ';}', numOfSheets);

    let direction = this.options.direction === 'horizontal' ? 'column' : 'row'
    document.styleSheets[0].insertRule('.infinite-container-'  + this.position + '{flex-direction: ' + direction + ';}', numOfSheets);

    document.styleSheets[0].insertRule('.infinite-flex-container-parent-'  + this.position + '{overflow: hidden;}', numOfSheets);
  }

  static createItemAsImage(item, id, position){
    let e = document.createElement('div');
    e.style.backgroundImage = 'url(' + item + ')';
    e.className += ' infinite-flex-item-' + position
    e.className += ' infinite-flex-item-image-' + position
    e.className += ' infinite-' + position + '-' + (id);
    return e;
  }

  insertItems(){
    var self = this
    this.adjustedItems.forEach(function(item, id){
      self.elements.push(self.constructor.createItemAsImage(item, id, self.position))
      self.container.appendChild(self.elements[self.elements.length - 1])
    })
    if(this.numberLeftWithOddEnding() > 0){
      self.elements[self.elements.length - 1].className += ' infinite-flex-item--clear-' + self.options.direction
    }
  }

  appendExtraItems(){
    var self = this;
    let elementsOnScreen = parseInt(this.options.numberHigh) * parseInt(this.options.numberWide)

    if(this.adjustedItems.length > elementsOnScreen){
      let dupedElements = [].slice.call(document.getElementsByClassName('infinite-flex-item-' + self.position), 0, elementsOnScreen);

      dupedElements.forEach(function(element){
        self.container.appendChild(element.cloneNode(true))
      })
    }
  }

  adjustElements(){
    var self = this;
    var lastElement;
    this.createItemList();

    this.adjustedItems.forEach(function(item, id) {
      let elements = document.getElementsByClassName('infinite-' + self.position + '-' + id);
      if (elements.length > 0) {
        [].map.call(elements, function (element) {
          element.style.backgroundImage = 'url(' + item + ')';
        })
        if(elements.length == 2 && typeof lastElement === 'undefined') {
          lastElement = elements[1]
        }
      } else {
        lastElement.parentNode.insertBefore(self.constructor.createItemAsImage(item, id, self.position), lastElement);
      }
    })
    if(this.items.previousLength > this.adjustedItems.length){
      for(let i = this.items.previousLength; i > this.adjustedItems.length; i--){
        let elements = document.getElementsByClassName('infinite-' + self.position + '-' + (i-1));
        console.log(elements)
        for(let e = elements.length; e > 0; e--){
          elements[e-1].parentNode.removeChild(elements[e-1]);
        }
      }
    }

    this.start();
  }

  elementMeasurement(selector){
    let measure = {};
    measure.height = parseFloat(window.getComputedStyle(this.constructor.getElement(selector)).height);
    measure.width = parseFloat(window.getComputedStyle(this.constructor.getElement(selector)).width);
    return measure;
  }

  scrollSizeMeasurement(){
    var self = this;
    switch(this.options.direction){
      case 'vertical':
        return self.elementMeasurement('.infinite-flex-item-' + self.position).height * (Math.ceil(this.adjustedItems.length/this.options.numberWide));
      case 'horizontal':
        return self.elementMeasurement('.infinite-flex-item-' + self.position).width * (Math.ceil(this.adjustedItems.length/this.options.numberHigh));
    }
  }

  changeInversion(){
    this.options.inverted = !this.options.inverted
  }

  startAnimation() {
    var self = this;

    const fps = 60;
    const marginSelector = {
      'vertical':'marginTop',
      'horizontal':'marginLeft'
    }

    let scrollContainerSize = this.scrollSizeMeasurement()
    let scrollContainer = this.container
    let currentMargin;

    if(this.isNew)
      currentMargin = this.options.inverted ? -scrollContainerSize : 0;
    else
      currentMargin = parseFloat(scrollContainer.style[marginSelector[this.options.direction]])

    let viewMeasure = (this.options.direction === "horizontal") ?
      this.elementMeasurement('.infinite-container-' + this.position).width :
      this.elementMeasurement('.infinite-container-' + this.position).height
    let scrollSpeed = (viewMeasure / this.options.secondsOnPage / fps);

    // always clear interval to ensure that only one scroller is running
    this.stop()
    this.interval = setInterval(function() {
      let marginChange = self.options.inverted ? (currentMargin += scrollSpeed) : (currentMargin -= scrollSpeed)
      scrollContainer.style[marginSelector[self.options.direction]] = marginChange + 'px';
      if((!self.options.inverted && currentMargin <= -scrollContainerSize) || (self.options.inverted && currentMargin >= 0))
        currentMargin = self.options.inverted ? -scrollContainerSize : 0;
      scrollContainer.style[marginSelector[self.options.direction]] = currentMargin + 'px';
    }, 1000/fps)
  }

  //////////////
  // Public methods for using the scroller
  //////////////
  // start the infinite scroll
  start() {
    if(this.isNew){
      this.setupContainer()
      this.createItemList()
      this.insertItems()
      this.appendExtraItems()
    }
    this.startAnimation()
    this.isNew = false
  }

  // stop the infinite scroll
  stop() {
    if(!this.interval){
      return;
    }
    window.clearInterval(this.interval)
  }

  remove() {
    this.stop()
    this.container.parentElement.className = this.container.parentElement.className.replace(' infinite-flex-container-parent-' + this.position,'')
    this.container.parentElement.removeChild(this.container)
  }
}

if( typeof global !== 'undefined')
  global.InfiniteScroller = InfiniteScroller;
