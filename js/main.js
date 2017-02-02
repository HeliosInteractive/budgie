'use strict';
class InfiniteScroller {

  constructor(items, selector, options = {}) {

    this.selector = selector;
    this.options = Object.assign(this.constructor.defaultOptions(), options);

    this.isNew = true;
    this.position = Math.floor((1 + Math.random()) * 0x10000);
    this.items = items;
    this.items.previousLength = items.length;
    this.adjustedItems = [];

    var self = this;
    this.items.pop = function(){
      let a = Array.prototype.pop.apply(self.items, arguments);
      self.popItem();
      return a;
    };
    this.items.push = function(){
      let a = Array.prototype.push.apply(self.items, arguments);
      self.pushItem();
      return a;
    };
    this.items.shift = function(){
      let a = Array.prototype.shift.apply(self.items, arguments);
      self.shiftItem();
      return a;
    };
    this.items.unshift = function(){
      let a = Array.prototype.unshift.apply(self.items, arguments);
      self.unshiftItem();
      return a;
    };
    this.items.splice = function(){
      let a = Array.prototype.splice.apply(self.items, arguments);
      self.adjustElements();
      return a;
    };

    this.start();
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
    if(typeof selector === 'object' ) return selector;

    let splitSelector = selector.substring(0, 1);
    switch(splitSelector){
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

  setupContainer() {
    let parentContainer = this.constructor.getElement(this.selector);
    parentContainer.classList.add(`infinite-flex-container-parent-${this.position}`);

    let infiniteFlexContainer = document.createElement('div');
    infiniteFlexContainer.classList.add('infinite-flex-container');
    infiniteFlexContainer.classList.add(`infinite-container-${this.position}`);
    parentContainer.appendChild(infiniteFlexContainer);
    this.setCSS(infiniteFlexContainer);

    this.container = infiniteFlexContainer;
  }

  createItemList(){
    switch(this.options.oddEndingBehavior){
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

  numberLeftWithOddEnding(){
    let numberAcross = (this.options.direction === 'horizontal') ? this.options.numberHigh : this.options.numberWide;
    return (this.items.length % numberAcross);
  }

  setCSS(container){
    const eleWidth = parseInt(window.getComputedStyle(container).width);
    const numOfSheets = document.styleSheets[0].cssRules.length;
    const numberAcross = (this.options.direction === 'horizontal') ? this.options.numberHigh : this.options.numberWide;

    // Width in %
    const width = ((eleWidth / this.options.numberWide / eleWidth) * 100);
    const height = (100 / this.options.numberHigh);

    document.styleSheets[0].insertRule(`.infinite-flex-item-${this.position}{width: ${width}%; height: ${height}%; flex-grow: 1;}`, numOfSheets);
    document.styleSheets[0].insertRule(`.infinite-flex-item-image-${this.position}{background-size: ${this.options.imageFit};}`, numOfSheets);

    for(let i = numberAcross - 1; i >= 0; i--){
      document.styleSheets[0].insertRule(`.infinite-flex-item-${this.position}--filler-${i}{width: ${width*(numberAcross - i)/2}%; height: ${height*(numberAcross - i)/2}%; flex-grow: 1;}`, numOfSheets);
    }

    let direction = this.options.direction === 'horizontal' ? 'column' : 'row';
    document.styleSheets[0].insertRule(`.infinite-container-${this.position}{flex-direction: ${direction};}`, numOfSheets);

    document.styleSheets[0].insertRule(`.infinite-flex-container-parent-${this.position}{overflow: hidden;}`, numOfSheets);
  }

  static createItemAsImage(item, id, position){
    let e = document.createElement('div');
    e.style.backgroundImage = `url(${item})`;
    e.classList.add(`infinite-flex-item-${position}`);
    e.classList.add(`infinite-flex-item-image-${position}`);
    e.classList.add(`infinite-${position}-${id}`);
    return e;
  }

  insertItems(){
    this.adjustedItems.forEach((item, id) => {
      if(this.numberLeftWithOddEnding() > 0 && (this.items.length - this.numberLeftWithOddEnding() === id)){
        this.container.appendChild(this.newFillerItem());
      }

      this.container.appendChild(this.constructor.createItemAsImage(item, id, this.position));

      if(this.numberLeftWithOddEnding() > 0 && (this.items.length === id + 1)){
        this.container.appendChild(this.newFillerItem());
      }

    });
  }


  newFillerItem(){
    let filler = document.createElement('div');
    filler.classList.add(`infinite-flex-item-${this.position}--filler`);
    filler.classList.add(`infinite-flex-item-${this.position}--filler-${this.numberLeftWithOddEnding()}`);
    return filler;
  }

  appendExtraItems(){
    let elementsOnScreen = this.elementsOnScreen();
    this.createItemList();

    if(this.adjustedItems.length > elementsOnScreen)
      [].slice.call(document.getElementsByClassName(`infinite-flex-item-${this.position}`), 0, elementsOnScreen)
          .forEach((element) => {
            let ele = element.cloneNode(true);
            ele.classList.add(`infinite-flex-item-${this.position}--duplicate`);
            this.container.appendChild(ele);
          });
  }

  elementsOnScreen(){
    return parseInt(this.options.numberHigh) * parseInt(this.options.numberWide);
  }

  adjustElements(){
    var lastElement;
    this.createItemList();

    this.adjustedItems.forEach((item, id) => {
      let elements = document.getElementsByClassName(`infinite-${this.position}-${id}`);
      if (elements.length > 0) {
        [].map.call(elements, function (element) {
          element.style.backgroundImage = `url(${item})`;
        });
        if(elements.length == 2 && typeof lastElement === 'undefined') {
          lastElement = elements[1]
        }
      } else {
        lastElement.parentNode.insertBefore(this.constructor.createItemAsImage(item, id, this.position), lastElement);
      }
    });
    if(this.items.previousLength > this.adjustedItems.length){
      for(let i = this.items.previousLength; i > this.adjustedItems.length; i--){
        let elements = document.getElementsByClassName(`infinite-${this.position}-${i-1}`);
        for(let e = elements.length; e > 0; e--){
          elements[e-1].parentNode.removeChild(elements[e-1]);
        }
      }
    }

    this.start();
  }

  pushItem(){
    this.addLastItem();
    this.updateListEnding('push');
    this.start();
  }

  popItem(){
    this.removeLastItem();
    this.updateListEnding('pop');
    this.start();
  }

  shiftItem(){
    this.updateExistingItems()
    this.removeLastItem();
    this.updateListEnding('shift');
    this.start();
  }

  unshiftItem(){
    this.updateExistingItems()
    this.addLastItem();
    this.updateListEnding('unshift');
    this.start();
  }

  removeLastItem(){
    let elements = document.getElementsByClassName(`infinite-${this.position}-${this.items.length}`);
    elements[0].parentNode.removeChild(elements[0]);
  }

  addLastItem(){
    // subtract 2 to account for using length not index, and also to get the last element before the push
    let elements = document.getElementsByClassName(`infinite-${this.position}-${this.items.length - 2}`);
    let newElement = this.constructor.createItemAsImage(this.items.slice(-1)[0], this.items.length - 1, this.position);
    elements[0].parentNode.insertBefore(newElement, elements[0].nextSibling);
  }

  updateExistingItems(){
    this.items.forEach((item, index) => {
      Array.from(document.getElementsByClassName(`infinite-${this.position}-${index}`)).forEach(element =>
        element.style.backgroundImage = `url(${item})`);
    });
  }

  updateListEnding(method){
    let operator;
    if(method === 'pop' || method === 'shift'){
      operator = 1
    } else {
      // this covers 'push', 'unshift'
      operator = -1
    }

    if(this.numberLeftWithOddEnding() > 0){
      if(document.getElementsByClassName(`infinite-flex-item-${this.position}--filler`).length === 0) {
        let lastElement = document.getElementsByClassName(`infinite-${this.position}-${this.items.length - 1}`)[0];
        let firstElement = document.getElementsByClassName(`infinite-${this.position}-${this.items.length - this.numberLeftWithOddEnding()}`)[0];
        firstElement.parentNode.insertBefore(this.newFillerItem(), firstElement);
        lastElement.parentNode.insertBefore(this.newFillerItem(), lastElement.nextSibling);
      } else {
        Array.from(document.getElementsByClassName(`infinite-flex-item-${this.position}--filler`)).forEach((element) => {
          element.classList.remove(`infinite-flex-item-${this.position}--filler-${this.numberLeftWithOddEnding() + operator}`);
          element.classList.add(`infinite-flex-item-${this.position}--filler-${this.numberLeftWithOddEnding()}`);
        });
      }
    } else {
      Array.from(document.getElementsByClassName(`infinite-flex-item-${this.position}--filler`)).forEach(element =>
        element.parentNode.removeChild(element));
    }

    if(this.items.length <= this.elementsOnScreen())
      Array.from(document.getElementsByClassName(`infinite-flex-item-${this.position}--duplicate`)).forEach(element =>
        element.parentNode.removeChild(element));

    if(this.items.length > this.elementsOnScreen() && document.getElementsByClassName(`infinite-flex-item-${this.position}--duplicate`).length === 0){
      this.appendExtraItems()
    }
  }

  elementMeasurement(selector){
    let measure = {};
    measure.height = parseFloat(window.getComputedStyle(document.getElementsByClassName(selector)[0]).height);
    measure.width = parseFloat(window.getComputedStyle(document.getElementsByClassName(selector)[0]).width);
    return measure;
  }

  scrollSizeMeasurement(){
    switch(this.options.direction){
      case 'vertical':
        return this.elementMeasurement(`infinite-flex-item-${this.position}`).height * (Math.ceil(this.adjustedItems.length/this.options.numberWide));
        break;
      case 'horizontal':
        return this.elementMeasurement(`infinite-flex-item-${this.position}`).width * (Math.ceil(this.adjustedItems.length/this.options.numberHigh));
        break;
    }
  }

  changeInversion(){
    this.options.inverted = !this.options.inverted;
  }

  startAnimation() {

    const fps = 60;
    const marginSelector = {
      'vertical':'marginTop',
      'horizontal':'marginLeft'
    };

    let scrollContainerSize = this.scrollSizeMeasurement();
    let scrollContainer = this.container;
    let currentMargin;

    if(this.isNew)
      currentMargin = this.options.inverted ? -scrollContainerSize : 0;
    else
      currentMargin = parseFloat(scrollContainer.style[marginSelector[this.options.direction]]);

    let measure = this.elementMeasurement(`infinite-container-${this.position}`);
    let viewMeasure = (this.options.direction === "horizontal") ? measure.width : measure.height;
    let scrollSpeed = (viewMeasure / this.options.secondsOnPage / fps);

    // always clear interval to ensure that only one scroller is running
    this.stop();
    if(this.items.length > this.elementsOnScreen()){
      this.interval = setInterval(() => {
        let marginChange = this.options.inverted ? (currentMargin += scrollSpeed) : (currentMargin -= scrollSpeed);
        scrollContainer.style[marginSelector[this.options.direction]] = marginChange + 'px';
        if((!this.options.inverted && currentMargin <= -scrollContainerSize) || (this.options.inverted && currentMargin >= 0))
          currentMargin = this.options.inverted ? -scrollContainerSize : 0;
        scrollContainer.style[marginSelector[this.options.direction]] = currentMargin + 'px';
      }, 1000/fps);
    } else {
      scrollContainer.style[marginSelector[this.options.direction]] = this.options.inverted ? -scrollContainerSize : 0 + 'px';
    }
  }

  //////////////
  // Public methods for using the scroller
  //////////////
  // start the infinite scroll
  start() {
    if(this.isNew){
      this.setupContainer();
      this.createItemList();
      this.insertItems();
      this.appendExtraItems();
    }
    this.startAnimation();
    this.isNew = false;
  }

  // stop the infinite scroll
  stop() {
    if(!this.interval) return false;
    window.clearInterval(this.interval);
    return true;
  }

  remove() {
    this.stop();
    this.container.parentElement.classList.remove(`infinite-flex-container-parent-${this.position}`);
    this.container.parentElement.removeChild(this.container);
  }
}

if( typeof global !== 'undefined')
  global.InfiniteScroller = InfiniteScroller;
