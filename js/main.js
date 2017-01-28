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

    var self = this;
    this.items.pop = function(){
      self.arrayMethod('pop')
    }
    this.items.push = function(){
      self.arrayMethod('push')
    }
    this.items.shift = function(){
      self.arrayMethod('shift')
    }
    this.items.unshift = function(){
      self.arrayMethod('unshift')
    }
    this.items.splice = function(){
      self.arrayMethod('splice')
    }

    this.start()
  }

  arrayMethod(method){
    let a = Array.prototype[method].apply(this.items, arguments);
    this.adjustElements()
    return a
  }

  static defaultOptions() {
    return {
      'numberHigh': 1,
      'numberWide': 1,
      'clipOddEnding': false,
      'noScrollIfNoOverflow': true,
      'direction': 'vertical',
      'secondsOnPage': 1.0,
      'stopOnHover': false,
      'inverted': false,
      'duplicateToFill': false,
      'scrollMode': true,
      'userNavigation': false,
      'imageFit': 'cover'
    };
  }

  static getElements(selector) {
    let splitSelector = selector.split(/(\.|#)/,3)
    splitSelector.shift()
    switch(splitSelector[0]){
      case '.':
        return document.getElementsByClassName(splitSelector[1])
      case '#':
        return document.getElementById(splitSelector[1])
      default:
        throw new Error("The selector must be a class or id, prepended by the identifier ('.'/'#')")
    }
  }

  setupContainer() {
    let parentContainer = this.constructor.getElements(this.selector)[0];
    parentContainer.className += ' infinite-flex-container-parent-' + this.position;

    let infiniteFlexContainer = document.createElement('div');
    infiniteFlexContainer.className += ' infinite-flex-container infinite-container-' + this.position;
    parentContainer.appendChild(infiniteFlexContainer);
    this.setCSS(infiniteFlexContainer);

    this.container = infiniteFlexContainer;
  }

  createItemList(){
    let numberAcross = (this.options.direction === 'horizontal') ? this.options.numberHigh : this.options.numberWide
    let remaining = (this.items.length % numberAcross)
    if(remaining > 0)
      this.adjustedItems = this.items.slice(0, this.items.length - remaining)
    else
      this.adjustedItems = this.items
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
      self.container.appendChild(self.constructor.createItemAsImage(item, id, self.position))
    })
  }

  appendExtraItems(){
    var self = this;
    let elementsOnScreen = parseInt(this.options.numberHigh) * parseInt(this.options.numberWide)

    if(this.adjustedItems.length > elementsOnScreen){
      let dupedElements = [].slice.call(self.constructor.getElements('.infinite-flex-item-' + self.position), 0, elementsOnScreen);

      dupedElements.forEach(function(element){
        self.container.appendChild(element.cloneNode(true))
      })
    }
  }

  adjustElements(){
    var self = this;
    var lastElement;
console.log(this.adjustedItems.length, this.items.length)
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
    measure.height = parseFloat(window.getComputedStyle(this.constructor.getElements(selector)[0]).height);
    measure.width = parseFloat(window.getComputedStyle(this.constructor.getElements(selector)[0]).width);
    return measure;
  }

  scrollSizeMeasurement(){
    var self = this;
    switch(this.options.direction){
      case 'vertical':
        return self.elementMeasurement('.infinite-flex-item-' + self.position).height * ((this.adjustedItems.length/this.options.numberWide));
      case 'horizontal':
        return self.elementMeasurement('.infinite-flex-item-' + self.position).width * ((this.adjustedItems.length/this.options.numberHigh));
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
