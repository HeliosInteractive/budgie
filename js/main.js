'use strict';
class Budgie {

  /**
   *
   * @param items
   * @param selector
   * @param options
   */
  constructor(items, selector, options = {}) {

    this.selector = selector;
    this.options = Object.assign(this.constructor.defaultOptions(), options);

    this.isNew = true;
    this.budgieId = Math.floor((1 + Math.random()) * 0x10000);
    this.items = items;

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
      'direction': 'vertical',
      'secondsOnPage': 1.0,
      'inverted': false,
      'autoScroll': true,
      'fps': 60,
      'infiniteScroll': true
    };
  }

  /**
   *
   * @param selector either an id, class, or DOM element
   * @returns {{}} returns the DOM element that matches the selector
   */
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
    parentContainer.classList.add(`budgie-flex-container-parent`);
    parentContainer.classList.add(`budgie-flex-container-parent-${this.budgieId}`);
    this.parentContainer = parentContainer;

    let budgieFlexContainer = document.createElement('div');
    budgieFlexContainer.classList.add('budgie-flex-container');
    budgieFlexContainer.classList.add(`budgie-container-${this.budgieId}`);
    parentContainer.appendChild(budgieFlexContainer);
    this.setCSS(budgieFlexContainer);

    this.container = budgieFlexContainer;
  }

  setupScrollProperties() {
    let self = this;
    let scrollDirection = this.scrollProperty();

    let budgieElement = this.elementMeasurement(`budgie-flex-item-${this.budgieId}`)
    let budgieElementMeasure = this.options.direction === 'horizontal' ? budgieElement.width : budgieElement.height

    // Set the scroll position to the top of the non-duped elements
    this.parentContainer[scrollDirection] = budgieElementMeasure;

    this.parentContainer.addEventListener("scroll", function(){self.onScroll(scrollDirection)});
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

    // Take the larger of the two
    const numberAcross = this.options.numberHigh >= this.options.numberWide ? this.options.numberHigh : this.options.numberWide;

    // Width in %
    const width = ((eleWidth / this.options.numberWide / eleWidth) * 100);
    const height = (100 / this.options.numberHigh);

    document.styleSheets[0].insertRule(`.budgie-flex-item-${this.budgieId}{width: ${width}%; height: ${height}%;}`, numOfSheets);

    for(let i = numberAcross - 1; i >= 0; i--){
      document.styleSheets[0].insertRule(`.budgie-flex-item-${this.budgieId}--filler-${i}{width: ${width*(this.options.numberWide - i)/2}%; height: ${height*(this.options.numberHigh - i)/2}%; flex-grow: 1;}`, numOfSheets);
    }

    let direction = this.options.direction === 'horizontal' ? 'column' : 'row';
    document.styleSheets[0].insertRule(`.budgie-container-${this.budgieId}{flex-direction: ${direction};}`, numOfSheets);

    document.styleSheets[0].insertRule(`.budgie-flex-container-parent-${this.budgieId}{overflow-x: ${this.options.direction === 'horizontal' ? 'scroll' : 'hidden'}; overflow-y: ${this.options.direction === 'vertical' ? 'scroll' : 'hidden'}}`, numOfSheets);
  }

  insertItems(){
    this.items.forEach((item, id) => {
      // Add a filler item so that odd ending lists will have a centered ending
      if(this.numberLeftWithOddEnding() > 0 && (this.items.length - this.numberLeftWithOddEnding() === id)){
        this.container.appendChild(this.newFillerItem());
      }

      // Add the item
      this.container.appendChild(this.createBudgieDiv(item, id));

      // Add a filler item so that odd ending lists will have a centered ending
      if(this.numberLeftWithOddEnding() > 0 && (this.items.length === id + 1)){
        this.container.appendChild(this.newFillerItem());
      }
    });
    if(this.items.length < this.elementsOnScreen()){
      // Append an extra div so that new items can be added
      let blankEle = document.createElement('div');
      blankEle.classList.add(`budgie-flex-item-${this.budgieId}--blank`);
      this.container.appendChild(blankEle);
    }
  }


  newFillerItem(){
    let filler = document.createElement('div');
    filler.classList.add(`budgie-flex-item-${this.budgieId}--filler`);
    filler.classList.add(`budgie-flex-item-${this.budgieId}--filler-${this.numberLeftWithOddEnding()}`);
    return filler;
  }

  /**
   * Prepends duplicate items equal to the last row/column of items
   */
  prependStartingItems(){
    let elementsOnScreen = this.elementsOnScreen();
    // Store a list of the non duplicated elements
    const realElements = Array.from(document.querySelectorAll(`.budgie-flex-item-${this.budgieId}:not(.budgie-flex-item-${this.budgieId}--duplicate)`));

    // If the number of elements is greater than the number that fit in the given area
    if(this.items.length > elementsOnScreen){
      // Prepends duplicate items equal to the number of elementsOnScreen
      if(this.numberLeftWithOddEnding() > 0) {
        // The column or row is NOT full, fillers are needed
        // Add a filler item so that odd ending lists will have a centered ending
        this.container.insertAdjacentElement('afterbegin', this.newFillerItem());

        // Add the duplicated elements
        realElements.slice(
          realElements.length - this.numberLeftWithOddEnding(),
          realElements.length
        )
          .reverse()
          .forEach((element) => {
            let ele = element.cloneNode(true);
            ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate`);
            this.container.insertAdjacentElement('afterbegin', ele);
          });

        // Add a filler item so that odd ending lists will have a centered ending
        this.container.insertAdjacentElement('afterbegin', this.newFillerItem());
      } else {
        // The column or row is full, not fillers needed
        let elementsToDupe = this.options.direction === 'horizontal' ? this.options.numberHigh : this.options.numberWide;

        // Add the duplicated elements
        realElements.slice(
          realElements.length - elementsToDupe,
          realElements.length
        )
          .reverse()
          .forEach((element) => {
            let ele = element.cloneNode(true);
            ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate`);
            this.container.insertAdjacentElement('afterbegin', ele);
          });
      }
    }
  }

  /**
   * Appends duplicate items equal to the number that fit in the view (numberHigh * numberWide)
   */
  appendEndingItems(){
    let elementsOnScreen = this.elementsOnScreen();
    // Store a list of the non duplicated elements
    const realElements = Array.from(document.querySelectorAll(`.budgie-flex-item-${this.budgieId}:not(.budgie-flex-item-${this.budgieId}--duplicate)`));

    // If the number of elements is greater than the number that fit in the given area
    if(this.items.length > elementsOnScreen){
      // Appends duplicate items equal to the number of elementsOnScreen
      realElements.slice(
        0,
        elementsOnScreen
      )
        .forEach((element) => {
          let ele = element.cloneNode(true);
          ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate`);
          ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate-ending`);
          this.container.insertAdjacentElement('beforeend', ele);
        });
    }
  }

  elementsOnScreen(){
    return parseInt(this.options.numberHigh) * parseInt(this.options.numberWide);
  }

  pushItem(){
    this.addLastItem();
    this.updateBeginningAndEndingItems('add');
    this.start();
  }

  popItem(){
    this.removeLastItem();
    this.updateBeginningAndEndingItems('remove');
    this.start();
  }

  shiftItem(){
    this.updateExistingItems()
    this.removeLastItem();
    this.updateBeginningAndEndingItems('remove');
    this.start();
  }

  unshiftItem(){
    this.updateExistingItems()
    this.addLastItem();
    this.updateBeginningAndEndingItems('add');
    this.start();
  }

  updateAllElements(){
    let elementCount = document.querySelectorAll(`.budgie-flex-item-${this.budgieId}:not(.budgie-flex-item-${this.budgieId}--duplicate)`).length
    if(this.items.length > elementCount){
      for(let i = elementCount; i < this.items.length; i++){
        this.addLastItem(i, i - 1);
      }
      this.updateBeginningAndEndingItems('add', true);
    } else if (this.items.length < elementCount) {
      for(let i = elementCount; i > this.items.length; i--){
        this.removeLastItem(i-1);
      }
      this.updateBeginningAndEndingItems('remove', true);
    }
    this.updateExistingItems();
    this.start();
  }

  removeLastItem(eleIndex = this.items.length){
    let elements = document.getElementsByClassName(`budgie-${this.budgieId}-${eleIndex}`);
    Array.from(elements).forEach(element => {
      element.parentNode.removeChild(element);
    })
  }

  addLastItem(itemIndex = this.items.length - 1, eleIndex = this.items.length - 2){
    // eleIndex; subtract 2 to account for using length not index, and also to get the last element before the push
    let elements = document.getElementsByClassName(`budgie-${this.budgieId}-${eleIndex}`);
    if(!elements.length > 0){
      elements = document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--blank`)
    }
    let newElement = this.createBudgieDiv(this.items[itemIndex], itemIndex);
    // Insert at the end of the main list
    // We use index of 1, because the last few items are duplicated at the top
    let index = 0
    if(elements.length > 1) { index = 1 }
    elements[index].parentNode.insertBefore(newElement, elements[index].nextSibling);
  }

  createBudgieDiv(item, itemIndex){
    let element = document.createElement('div');

    element.classList.add('budgie-flex-item');
    element.classList.add(`budgie-flex-item-${this.budgieId}`);
    element.classList.add(`budgie-${this.budgieId}-${itemIndex}`);

    const innerDiv = this.createItemAsElement(item)

    element.innerHTML = innerDiv.outerHTML;

    return element;
  }

  createItemAsElement(item, itemIndex){
    // If the item is a dom element, then return it
    if(typeof item === 'object' ) return item;

    if(typeof item !== 'string') throw new Error('Only DOM Elements and strings are accepted as budgie items')

    let extension = item.match(/\.{1}\w*$/)
    if(extension) {
      extension = extension[0].substr(1)
    }

    const imageExtensions = ['jpg', 'gif', 'png'];
    const videoExtensions = ['mp4','ogg', 'webm'];

    console.log(item, extension)
    let element;
    if(imageExtensions.includes(extension)) {
      element = document.createElement('img');
      element.src = item
    } else if(videoExtensions.includes(extension)) {
      element = document.createElement('video');
      element.src = item
    }

    if(!element) throw new Error(`Extension of: ${extension} is not supported.`)

    return element;
  }


  /**
   * Updates the existing items by replacing their html
   */
  updateExistingItems(){
    this.items.forEach((item, index) => {
      Array.from(document.getElementsByClassName(`budgie-${this.budgieId}-${index}`)).forEach((element) => {
        // If the element has changed then update, otherwise do nothing
        let newElement = this.createItemAsElement(item).outerHTML;
        if (element.innerHTML !== newElement) {
          element.innerHTML = newElement;
        }
      });
    });
  }

  updateBeginningAndEndingItems(method) {
    this.updateListStart();
    this.updateListEnding(method);
  }

  updateListStart() {
    let numberAtTop;
    if (this.numberLeftWithOddEnding() > 0) {
      numberAtTop = this.numberLeftWithOddEnding();
    } else {
      numberAtTop = this.options.direction === 'horizontal' ? this.options.numberHigh : this.options.numberWide;
    }

    let realElements = Array.from(document.querySelectorAll(`.budgie-flex-item-${this.budgieId}:not(.budgie-flex-item-${this.budgieId}--duplicate)`));

    // Trim the number of elements across one row to get rid of the bottom dupes
    let dupedElements = Array.from(document.querySelectorAll(`.budgie-flex-item-${this.budgieId}.budgie-flex-item-${this.budgieId}--duplicate`));
    let topOfDupedElements = dupedElements.slice(0, dupedElements.length - this.elementsOnScreen());

    // These elements should become the new duped top row
    let lastRowOfRealElements = realElements.slice(realElements.length - numberAtTop, realElements.length);

    const firstRealElement = realElements[0];

    console.log('Updating List Start', numberAtTop, lastRowOfRealElements, topOfDupedElements, firstRealElement)

    // If there are more existing elements than we need, then trim that list
    if(topOfDupedElements.length > lastRowOfRealElements.length) {
      let numberOff = topOfDupedElements.length - lastRowOfRealElements.length
      console.log('Need to remove', numberOff)

      for(let i = 0; i < numberOff; i += 1) {
        console.log('removing elements', i, topOfDupedElements[i])
        topOfDupedElements[i].parentNode.removeChild(topOfDupedElements[i]);
        topOfDupedElements.shift();
      }
    }

    // Exit early if the list is not long enough to scroll
    if(this.items.length <= this.elementsOnScreen()){ return; }

    // Update the existing elements, and add new if needed
    lastRowOfRealElements.forEach((element, index) => {
      let ele = element.cloneNode(true);
      ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate`);
      if(topOfDupedElements[index]){
        console.log('replacing existing')
        topOfDupedElements[index].outerHTML = ele.outerHTML
      } else {
        console.log('adding new')
        firstRealElement.parentNode.insertBefore(ele, firstRealElement);
      }
    })
  }

    /**
     * Updates the Duplicated elements that are on the end of the list.
     * @param method
     * @param redraw
     */
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
      Array.from(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--filler`)).forEach(element =>
        element.parentNode.removeChild(element));

    if(this.numberLeftWithOddEnding() > 0){
      if(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--filler`).length === 0) {
        let lastElements = Array.from(document.getElementsByClassName(`budgie-${this.budgieId}-${this.items.length - 1}`));
        let firstElements = Array.from(document.getElementsByClassName(`budgie-${this.budgieId}-${this.items.length - this.numberLeftWithOddEnding()}`));
        // Put fill around all elements that need it. At the top, and the bottom.
        lastElements.forEach(lastElement => {
          lastElement.parentNode.insertBefore(this.newFillerItem(), lastElement.nextSibling);
        })
        firstElements.forEach(firstElement => {
          firstElement.parentNode.insertBefore(this.newFillerItem(), firstElement);
        })
      } else {
        Array.from(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--filler`)).forEach((element) => {
          element.classList.remove(`budgie-flex-item-${this.budgieId}--filler-${this.numberLeftWithOddEnding() + operator}`);
          element.classList.add(`budgie-flex-item-${this.budgieId}--filler-${this.numberLeftWithOddEnding()}`);
        });
      }
    } else {
      Array.from(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--filler`)).forEach(element =>
        element.parentNode.removeChild(element));
    }

    if(this.items.length <= this.elementsOnScreen()) {
      Array.from(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--duplicate`)).forEach(element =>
        element.parentNode.removeChild(element));

      // Append an extra div so that new items can be added
      if(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--blank`).length === 0){
        let blankEle = document.createElement('div');
        blankEle.classList.add(`budgie-flex-item-${this.budgieId}--blank`);
        this.container.appendChild(blankEle);
      }
    }

    if(this.items.length > this.elementsOnScreen() && document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--duplicate-ending`).length === 0){
      this.appendEndingItems();

      Array.from(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--blank`)).forEach(blankEle =>
        blankEle.parentNode.removeChild(blankEle));
    }
  }

  /**
   * Returns the height and width measurements of the elements associated with the given selector
   * @param selector
   * @returns {{}} The height and width measurements of the element associated with the given selector.
   */
  elementMeasurement(selector){
    let measure = {};
    measure.height = parseFloat(window.getComputedStyle(document.getElementsByClassName(selector)[0]).height);
    measure.width = parseFloat(window.getComputedStyle(document.getElementsByClassName(selector)[0]).width);
    return measure;
  }

  /**
   * Returns the size of the scroll container for this budgie instance
   * @returns {number} Measurement in px.
   */
  scrollSizeMeasurement(){
    switch(this.options.direction){
      case 'vertical':
        return this.elementMeasurement(`budgie-flex-item-${this.budgieId}`).height * (Math.ceil(this.items.length/this.options.numberWide));
        break;
      case 'horizontal':
        return this.elementMeasurement(`budgie-flex-item-${this.budgieId}`).width * (Math.ceil(this.items.length/this.options.numberHigh));
        break;
    }
  }


  /**
  * Will reset the budgie elements scrollProperty if it hits a wrap point.
  * @param {string} scrollDirection - The scroll direction of the given budgie instance.
  *   can be 'scrollTop' or 'scrollLeft'
  * @returns undefined
  * */
  onScroll(scrollDirection) {
    let scrollContainerSize = this.scrollSizeMeasurement();

    let budgieElement = this.elementMeasurement(`budgie-flex-item-${this.budgieId}`);
    let budgieElementMeasure = Math.floor(this.options.direction === 'horizontal' ? budgieElement.width : budgieElement.height);

    if((this.parentContainer[scrollDirection] >= scrollContainerSize + budgieElementMeasure)) {
      this.parentContainer[scrollDirection] = budgieElementMeasure;
    } else if((this.parentContainer[scrollDirection] <= 0 )) {
      this.parentContainer[scrollDirection] = scrollContainerSize;
    }
  }

  /**
   * Will return the scroll property ('scrollTop' or 'scrollLeft') of the budgie instance
   * @returns {String} The scroll property ('scrollTop' or 'scrollLeft') of the budgie instance
   */
  scrollProperty() {
    if (this.options.direction === 'vertical') {
      return 'scrollTop';
    } else if (this.options.direction === 'horizontal') {
      return 'scrollLeft';
    }
  }

  /**
   * Controls the scrolling animation when budgie is set to autoscroll
   */
  startAnimation() {
    const fps =  this.options.fps;

    let scrollDirection = this.scrollProperty();

    let scrollContainer = this.container.parentElement;
    let currentScroll;

    let measure = this.elementMeasurement(`budgie-container-${this.budgieId}`);
    let viewMeasure = (this.options.direction === "horizontal") ? measure.width : measure.height;
    // This needs to be a whole number, so always round up
    let scrollSpeed = Math.ceil(viewMeasure / this.options.secondsOnPage / fps);

    // always clear interval to ensure that only one scroller is running
    this.stop();
    if(this.items.length > this.elementsOnScreen()){

      this.interval = setInterval(() => {
        let scrollDirection = this.scrollProperty()

        currentScroll = scrollContainer[scrollDirection];

        this.options.inverted ? (currentScroll += scrollSpeed) : (currentScroll -= scrollSpeed);

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
      this.insertItems();
      // Only append extra items, and bind the scroll event if this is infinite scroll.
      if(this.options.infiniteScroll){
        this.appendEndingItems();
        this.prependStartingItems();
        this.setupScrollProperties();
      }
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

  /**
   *
   */
  remove() {
    this.stop();
    this.container.parentElement.classList.remove(`budgie-flex-container-parent-${this.budgieId}`);
    this.container.parentElement.removeChild(this.container);
  }

  /*
  * Changes the inversion of the budgie instance.
  * */
  changeInversion(){
    this.options.inverted = !this.options.inverted;
  }
}

if( typeof global !== 'undefined')
  global.Budgie = Budgie;
