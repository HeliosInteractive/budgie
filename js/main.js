'use strict';
class InfiniteScroller {

  constructor(items, selector, options = {}) {

    this.selector = selector;
    this.options = Object.assign(this.constructor.defaultOptions(), options);

    this.isNew = true;
    this.position = Math.floor((1 + Math.random()) * 0x10000);
    this.items = items;
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
      self.updateAllElements();
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
      'autoScroll': true,
      'userNavigation': false,
      'imageFit': 'cover',
      'fps': 60
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
    this.parentContainer = parentContainer;

    let infiniteFlexContainer = document.createElement('div');
    infiniteFlexContainer.classList.add('infinite-flex-container');
    infiniteFlexContainer.classList.add(`infinite-container-${this.position}`);
    parentContainer.appendChild(infiniteFlexContainer);
    this.setCSS(infiniteFlexContainer);

    this.container = infiniteFlexContainer;
  }

  bindScrollListener() {
    let self = this;
    let scrollSize = this.scrollSizeMeasurement();
    let scrollDirection = this.scrollProperty();

    if(this.options.inverted && this.isNew) {
      this.parentContainer[scrollDirection] = scrollSize;
    }

    this.parentContainer.addEventListener("scroll", function(){self.onScroll(scrollDirection)});
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
    let numOfSheets = 0;
    if(document.styleSheets[0].cssRules) {
      numOfSheets = document.styleSheets[0].cssRules.length;
    }

    const numberAcross = (this.options.direction === 'horizontal') ? this.options.numberHigh : this.options.numberWide;

    // Width in %
    const width = ((eleWidth / this.options.numberWide / eleWidth) * 100);
    const height = (100 / this.options.numberHigh);

    document.styleSheets[0].insertRule(`.infinite-flex-item-${this.position}{width: ${width}%; height: ${height}%;}`, numOfSheets);
    document.styleSheets[0].insertRule(`.infinite-flex-item-image-${this.position}{background-size: ${this.options.imageFit};}`, numOfSheets);

    for(let i = numberAcross - 1; i >= 0; i--){
      document.styleSheets[0].insertRule(`.infinite-flex-item-${this.position}--filler-${i}{width: ${width*(numberAcross - i)/2}%; height: ${height*(numberAcross - i)/2}%; flex-grow: 1;}`, numOfSheets);
    }

    let direction = this.options.direction === 'horizontal' ? 'column' : 'row';
    document.styleSheets[0].insertRule(`.infinite-container-${this.position}{flex-direction: ${direction};}`, numOfSheets);

    document.styleSheets[0].insertRule(`.infinite-flex-container-parent-${this.position}{overflow-x: ${this.options.direction === 'horizontal' ? 'scroll' : 'hidden'}; overflow-y: ${this.options.direction === 'vertical' ? 'scroll' : 'hidden'}}`, numOfSheets);
    document.styleSheets[0].insertRule(`.infinite-flex-container-parent-${this.position}::-webkit-scrollbar{display: none;}`, numOfSheets);
  }

  static createElementForItem(item, id, position){
    let e = document.createElement('div');

    if(typeof item === 'string') {
      e.style.backgroundImage = `url(${item})`;
    } else {
      e.appendChild(item);
    }
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

      this.container.appendChild(this.constructor.createElementForItem(item, id, this.position));

      if(this.numberLeftWithOddEnding() > 0 && (this.items.length === id + 1)){
        this.container.appendChild(this.newFillerItem());
      }
    });
    if(this.items.length < this.elementsOnScreen()){
      // Append an extra div so that new items can be added
      let blankEle = document.createElement('div');
      blankEle.classList.add(`infinite-flex-item-${this.position}--blank`);
      this.container.appendChild(blankEle);
    }
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

    if(this.adjustedItems.length > elementsOnScreen){
      [].slice.call(document.getElementsByClassName(`infinite-flex-item-${this.position}`), 0, elementsOnScreen)
          .forEach((element) => {
            let ele = element.cloneNode(true);
            ele.classList.add(`infinite-flex-item-${this.position}--duplicate`);
            this.container.appendChild(ele);
          });
    }

  }

  elementsOnScreen(){
    return parseInt(this.options.numberHigh) * parseInt(this.options.numberWide);
  }

  pushItem(){
    this.addLastItem();
    this.updateListEnding('add');
    this.start();
  }

  popItem(){
    this.removeLastItem();
    this.updateListEnding('remove');
    this.start();
  }

  shiftItem(){
    this.updateExistingItems()
    this.removeLastItem();
    this.updateListEnding('remove');
    this.start();
  }

  unshiftItem(){
    this.updateExistingItems()
    this.addLastItem();
    this.updateListEnding('add');
    this.start();
  }

  updateAllElements(){
    let elementCount = document.querySelectorAll(`.infinite-flex-item-${this.position}:not(.infinite-flex-item-${this.position}--duplicate)`).length
    if(this.items.length > elementCount){
      for(let i = elementCount; i < this.items.length; i++){
        this.addLastItem(i, i - 1);
      }
      this.updateListEnding('add', true);
    } else if (this.items.length < elementCount) {
      for(let i = elementCount; i > this.items.length; i--){
        this.removeLastItem(i-1);
      }
      this.updateListEnding('remove', true);
    }
    this.updateExistingItems()
    this.start();
  }

  removeLastItem(eleIndex = this.items.length){
    let elements = document.getElementsByClassName(`infinite-${this.position}-${eleIndex}`);
    elements[0].parentNode.removeChild(elements[0]);
  }

  addLastItem(itemIndex = this.items.length - 1, eleIndex = this.items.length - 2){
    // eleIndex; subtract 2 to account for using length not index, and also to get the last element before the push
    let elements = document.getElementsByClassName(`infinite-${this.position}-${eleIndex}`);
    let newElement = this.constructor.createElementForItem(this.items[itemIndex], itemIndex, this.position);
    elements[0].parentNode.insertBefore(newElement, elements[0].nextSibling);
  }

  updateExistingItems(){
    this.items.forEach((item, index) => {
      Array.from(document.getElementsByClassName(`infinite-${this.position}-${index}`)).forEach(element =>
        element.style.backgroundImage = `url(${item})`);
    });
  }

  updateListEnding(method, redraw=false){
    let operator;
    if(method === 'remove'){
      operator = 1
    } else if(method === 'add'){
      // this covers 'add'
      operator = -1
    } else {
      throw new Error("Only 'add' and 'remove' are supported arguments")
    }

    if(redraw)
      Array.from(document.getElementsByClassName(`infinite-flex-item-${this.position}--filler`)).forEach(element =>
        element.parentNode.removeChild(element));

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

    if(this.items.length <= this.elementsOnScreen()) {
      Array.from(document.getElementsByClassName(`infinite-flex-item-${this.position}--duplicate`)).forEach(element =>
        element.parentNode.removeChild(element));

      // Append an extra div so that new items can be added
      if(document.getElementsByClassName(`infinite-flex-item-${this.position}--blank`).length === 0){
        let blankEle = document.createElement('div');
        blankEle.classList.add(`infinite-flex-item-${this.position}--blank`);
        this.container.appendChild(blankEle);
      }
    }

    if(this.items.length > this.elementsOnScreen() && document.getElementsByClassName(`infinite-flex-item-${this.position}--duplicate`).length === 0){
      this.appendExtraItems();

      Array.from(document.getElementsByClassName(`infinite-flex-item-${this.position}--blank`)).forEach(blankEle =>
        blankEle.parentNode.removeChild(blankEle));
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

  onScroll(scrollDirection) {
    let scrollContainerSize = this.scrollSizeMeasurement();

    if((this.parentContainer[scrollDirection] >= scrollContainerSize)) {
      this.parentContainer[scrollDirection] = 0;
    } else if((this.parentContainer[scrollDirection] <= 0 )) {
      this.parentContainer[scrollDirection] = scrollContainerSize;
    }
  }

  scrollProperty() {
    if (this.options.direction === 'vertical') {
      return 'scrollTop';
  } else if (this.options.direction === 'horizontal') {
      return 'scrollLeft';
    }
  }

  startAnimation() {

    const fps =  this.options.fps;

    let scrollDirection = this.scrollProperty();

    let scrollContainer = this.container.parentElement;
    let currentScroll;

    let measure = this.elementMeasurement(`infinite-container-${this.position}`);
    let viewMeasure = (this.options.direction === "horizontal") ? measure.width : measure.height;
    let scrollSpeed = (viewMeasure / this.options.secondsOnPage / fps);

    // always clear interval to ensure that only one scroller is running
    this.stop();
    if(this.items.length > this.elementsOnScreen()){
      this.interval = setInterval(() => {
        let scrollDirection = this.scrollProperty()

        currentScroll = scrollContainer[scrollDirection];

        this.options.inverted ? (currentScroll -= scrollSpeed) : (currentScroll += scrollSpeed);

        scrollContainer[scrollDirection] = currentScroll;
      }, 1000/fps);
    } else {
      scrollContainer[scrollDirection] = 0;
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
      this.bindScrollListener();
    }
    if(this.options.autoScroll){
      this.startAnimation();
    }
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
