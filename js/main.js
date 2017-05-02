'use strict';

class Budgie {
  /**
   *
   * @param items
   * @param selector
   * @param options
   */
  constructor(items, selector, options = {}) {
    // Set the parentContainer to be accessable
    this.parentContainer = document.querySelector(selector);
    // Apply user options over the default options
    this.options = Object.assign(this.constructor.defaultOptions(), options);
    // Sets a random ID to allow for multiple budgies at once
    this.budgieId = Math.floor((1 + Math.random()) * 0x10000);
    // save a reference to the items array
    this.items = items;

    // Provide methods for manipulating the items array
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

    // Gets the budgie scroller setup for use
    this.budgieSetup();

    // Will start the scrolling animation if autoStart is true
    if (this.options.autoStart) {
      this.budgieAnimate();
    }
  }

  /**
   * Default budgie options are defined here
   * @returns {{numberHigh: number, numberWide: number, direction: string, secondsOnPage: number, inverted: boolean, autoScroll: boolean, fps: number, infiniteScroll: boolean, autoStart: boolean}}
   */
  static defaultOptions() {
    return {
      'numberHigh': 1,
      'numberWide': 1,
      'direction': 'vertical',
      'secondsOnPage': 1.0,
      'inverted': false,
      'autoScroll': true,
      'fps': 60,
      'infiniteScroll': true,
      'autoStart': true
    };
  }

  /**
   * Will return true if budgie has vertical direction
   * @returns {boolean}
   */
  isVertical() {
    return this.options.direction === 'vertical';
  }

  /**
   * Will return true if budgie has horizontal direction
   * @returns {boolean}
   */
  isHorizontal() {
    return this.options.direction === 'horizontal';
  }

  /**
   * Will be true if the last column/row is not completely full
   * @returns {boolean}
   */
  hasOddEnding() {
    return this.numberLeftWithOddEnding() > 0;
  }

  /**
   * Will return the number of elements that can fit in the budgie container
   * @returns {number}
   */
  elementsOnScreen(){
    return parseInt(this.options.numberHigh) * parseInt(this.options.numberWide);
  }

  /**
   * Will be true if all budgie elements fit into container without scrolling
   * @returns {boolean}
   */
  fitsInContainer() {
    return this.items.length <= this.elementsOnScreen();
  }

  /**
   * Will return the number of elements left on the last line.
   * Will return 0 if the last line is full
   * @returns {number}
   */
  numberLeftWithOddEnding(){
    let numberAcross = this.isHorizontal() ? this.options.numberHigh : this.options.numberWide;
    return (this.items.length % numberAcross);
  }

  /**
   * Clears out measurements so that they will be remeasured
   */
  clearMeasurements(){
    this.budgieElementMeasurement = undefined;
    this.scrollContainerSize = undefined;
  }

  /**
   * Will return the scroll property ('scrollTop' or 'scrollLeft') of the budgie instance
   * @returns {String} The scroll property ('scrollTop' or 'scrollLeft') of the budgie instance
   */
  scrollProperty() {
    if (this.isVertical()) {
      return 'scrollTop';
    } else if (this.isHorizontal()) {
      return 'scrollLeft';
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
        return BudgieDom.measureElementWidthAndHeight(`.budgie-flex-item-${this.budgieId}`).height * (Math.ceil(this.items.length/this.options.numberWide));
        break;
      case 'horizontal':
        return BudgieDom.measureElementWidthAndHeight(`.budgie-flex-item-${this.budgieId}`).width * (Math.ceil(this.items.length/this.options.numberHigh));
        break;
    }
  }

  /**
   * Updates the budgie instance based on array changes
   */
  pushItem(){
    this.addLastItem();
    this.updateBeginningAndEndingItems('add');
    this.clearMeasurements();
    this.budgieAnimate();
  }

  /**
   * Updates the budgie instance based on array changes
   */
  popItem(){
    this.removeLastItem();
    this.updateBeginningAndEndingItems('remove');
    this.clearMeasurements();
    this.budgieAnimate();
  }

  /**
   * Updates the budgie instance based on array changes
   */
  shiftItem(){
    this.updateExistingItems()
    this.removeLastItem();
    this.updateBeginningAndEndingItems('remove');
    this.clearMeasurements();
    this.budgieAnimate();
  }

  /**
   * Updates the budgie instance based on array changes
   */
  unshiftItem(){
    this.updateExistingItems()
    this.addLastItem();
    this.updateBeginningAndEndingItems('add');
    this.clearMeasurements();
    this.budgieAnimate();
  }

  /**
   * Updates the budgie instance based on array changes
   */
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
    this.clearMeasurements();
    this.budgieAnimate();
  }

  /**
   * Prepends duplicate items equal to the last row/column of items
   */
  prependStartingItems(){
    let elementsOnScreen = this.elementsOnScreen();
    // Store a list of the non duplicated elements
    const realElements = Array.from(document.querySelectorAll(`.budgie-flex-item-${this.budgieId}:not(.budgie-flex-item-${this.budgieId}--duplicate)`));

    // If the number of elements is greater than the number that fit in the given area
    if(!this.fitsInContainer){
      // Prepends duplicate items equal to the number of elementsOnScreen
      if(this.hasOddEnding()) {
        // The column or row is NOT full, fillers are needed
        // Add a filler item so that odd ending lists will have a centered ending
        this.budgieContainer.insertAdjacentElement('afterbegin', BudgieDom.createBudgieFillerElement(this));

        // Add the duplicated elements
        realElements.slice(
          realElements.length - this.numberLeftWithOddEnding(),
          realElements.length
        )
          .reverse()
          .forEach((element) => {
            let ele = element.cloneNode(true);
            ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate`);
            this.budgieContainer.insertAdjacentElement('afterbegin', ele);
          });

        // Add a filler item so that odd ending lists will have a centered ending
        this.budgieContainer.insertAdjacentElement('afterbegin', BudgieDom.createBudgieFillerElement(this));
      } else {
        // The column or row is full, not fillers needed
        let elementsToDupe = this.isHorizontal() ? this.options.numberHigh : this.options.numberWide;

        // Add the duplicated elements
        realElements.slice(
          realElements.length - elementsToDupe,
          realElements.length
        )
          .reverse()
          .forEach((element) => {
            let ele = element.cloneNode(true);
            ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate`);
            this.budgieContainer.insertAdjacentElement('afterbegin', ele);
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
    if(!this.fitsInContainer()){
      // Appends duplicate items equal to the number of elementsOnScreen
      realElements.slice(
        0,
        elementsOnScreen
      )
        .forEach((element) => {
          let ele = element.cloneNode(true);
          ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate`);
          ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate-ending`);
          this.budgieContainer.insertAdjacentElement('beforeend', ele);
        });
    }
  }

  /**
   * Removes an item from the end of the budgie list
   * @param eleIndex
   */
  removeLastItem(eleIndex = this.items.length){
    let elements = document.getElementsByClassName(`budgie-${this.budgieId}-${eleIndex}`);
    Array.from(elements).forEach(element => {
      element.parentNode.removeChild(element);
    })
  }

  /**
   * Adds an item to the end of the budgie list
   * @param itemIndex
   * @param eleIndex
   */
  addLastItem(itemIndex = this.items.length - 1, eleIndex = this.items.length - 2){
    // eleIndex; subtract 2 to account for using length not index, and also to get the last element before the push
    let elements = document.getElementsByClassName(`budgie-${this.budgieId}-${eleIndex}`);
    if(!elements.length > 0){
      elements = document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--blank`)
    }
    console.log(this.items[itemIndex], itemIndex)
    let newElement = BudgieDom.createBudgieElement(this, this.items[itemIndex], itemIndex);
    // Insert at the end of the main list
    // We use index of 1, because the last few items are duplicated at the top
    let index = 0
    if(elements.length > 1) { index = 1 }
    elements[index].parentNode.insertBefore(newElement, elements[index].nextSibling);
  }

  /**
   * Updates the existing items by replacing their html
   */
  updateExistingItems(){
    this.items.forEach((item, index) => {
      Array.from(document.getElementsByClassName(`budgie-${this.budgieId}-${index}`)).forEach((element) => {
        // If the element has changed then update, otherwise do nothing
        console.log(item)
        let newElement = BudgieDom.createBudgieElement(this, item, index).outerHTML;
        if (element.outerHTML !== newElement) {
          element.outerHTML = newElement;
        }
      });
    });
  }

  /**
   * Calls both updateListStart and updateListEnding in the correct order
   * @param method
   */
  updateBeginningAndEndingItems(method) {
    this.updateListStart();
    this.updateListEnding(method);
  }

  /**
   * Updates the duplicated elements that come before the real budgie elements
   */
  updateListStart() {
    let numberAtTop;
    if (this.hasOddEnding()) {
      numberAtTop = this.numberLeftWithOddEnding();
    } else {
      numberAtTop = this.isHorizontal() ? this.options.numberHigh : this.options.numberWide;
    }

    let realElements = Array.from(document.querySelectorAll(`.budgie-flex-item-${this.budgieId}:not(.budgie-flex-item-${this.budgieId}--duplicate)`));

    // Trim the number of elements across one row to get rid of the bottom dupes
    let dupedElements = Array.from(document.querySelectorAll(`.budgie-flex-item-${this.budgieId}.budgie-flex-item-${this.budgieId}--duplicate`));
    let topOfDupedElements = dupedElements.slice(0, dupedElements.length - this.elementsOnScreen());

    // These elements should become the new duped top row
    let lastRowOfRealElements = realElements.slice(realElements.length - numberAtTop, realElements.length);

    const firstRealElement = realElements[0];


    // If there are more existing elements than we need, then trim that list
    if(topOfDupedElements.length > lastRowOfRealElements.length) {
      let numberOff = topOfDupedElements.length - lastRowOfRealElements.length

      for(let i = 0; i < numberOff; i += 1) {
        topOfDupedElements[i].parentNode.removeChild(topOfDupedElements[i]);
        topOfDupedElements.shift();
      }
    }

    // Exit early if the list is not long enough to scroll
    if(this.fitsInContainer()){ return; }

    // Update the existing elements, and add new if needed
    lastRowOfRealElements.forEach((element, index) => {
      let ele = element.cloneNode(true);
      ele.classList.add(`budgie-flex-item-${this.budgieId}--duplicate`);
      if(topOfDupedElements[index]){
        topOfDupedElements[index].outerHTML = ele.outerHTML
      } else {
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

    if(this.hasOddEnding()){
      if(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--filler`).length === 0) {
        let lastElements = Array.from(document.getElementsByClassName(`budgie-${this.budgieId}-${this.items.length - 1}`));
        let firstElements = Array.from(document.getElementsByClassName(`budgie-${this.budgieId}-${this.items.length - this.numberLeftWithOddEnding()}`));
        // Put fill around all elements that need it. At the top, and the bottom.
        lastElements.forEach(lastElement => {
          lastElement.parentNode.insertBefore(BudgieDom.createBudgieFillerElement(this), lastElement.nextSibling);
        })
        firstElements.forEach(firstElement => {
          firstElement.parentNode.insertBefore(BudgieDom.createBudgieFillerElement(this), firstElement);
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

    // If all elements fit in the container and scrolling is not needed
    if(this.fitsInContainer()) {
      Array.from(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--duplicate`)).forEach(element =>
        element.parentNode.removeChild(element));

      // Append an extra div so that new items can be added
      if(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--blank`).length === 0){
        let blankEle = document.createElement('div');
        blankEle.classList.add(`budgie-flex-item-${this.budgieId}--blank`);
        this.budgieContainer.appendChild(blankEle);
      }
    }

    if(!this.fitsInContainer() && document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--duplicate-ending`).length === 0){
      this.appendEndingItems();

      Array.from(document.getElementsByClassName(`budgie-flex-item-${this.budgieId}--blank`)).forEach(blankEle =>
        blankEle.parentNode.removeChild(blankEle));
    }
  }

  /**
  * Will reset the budgie elements scrollProperty if it hits a wrap point.
  * @param {string} scrollDirection - The scroll direction of the given budgie instance.
  *   can be 'scrollTop' or 'scrollLeft'
  * @returns undefined
  * */
  onScroll(scrollDirection) {
    if(!this.scrollContainerSize) {
      this.scrollContainerSize = this.scrollSizeMeasurement();
    }

    if(!this.budgieElementMeasurement) {
      let budgieElement = BudgieDom.measureElementWidthAndHeight(`.budgie-flex-item-${this.budgieId}`);
      this.budgieElementMeasurement = Math.floor(this.isHorizontal() ? budgieElement.width : budgieElement.height);
    }

    if((this.parentContainer[scrollDirection] >= this.scrollContainerSize + this.budgieElementMeasurement)) {
      this.parentContainer[scrollDirection] = this.budgieElementMeasurement;
    } else if((this.parentContainer[scrollDirection] <= 0 )) {
      this.parentContainer[scrollDirection] = this.scrollContainerSize;
    }
  }

  /**
   * Sets up the budgie scroller to be ready for use
   */
  budgieSetup() {
    this.budgieContainer = BudgieDom.setupBudgieContainer(this);
    BudgieDom.setupBudgieCSS(this);
    BudgieDom.insertBudgieElements(this);
    // Only append extra items, and bind the scroll event if this is infinite scroll.
    if(this.options.infiniteScroll){
      this.appendEndingItems();
      this.prependStartingItems();
      BudgieDom.setupBudgieScrollProperties(this);
    }
  }

  /**
   * Controls the scrolling animation when budgie is set to autoscroll
   */
  budgieAnimate() {
    // Will not animate if autoScroll is off
    if(!this.options.autoScroll) { return }

    // How many times the animation should run per second
    const fps =  this.options.fps;

    // Will be either scrollTop or scrollLeft
    let scrollDirection = this.scrollProperty();

    // The current value of the scrollDirection
    let currentScroll;

    // The measurement of the budgie container
    let budgieContainerMeasurements =
      BudgieDom.measureElementWidthAndHeight(`.budgie-container-${this.budgieId}`);

    // The axis measurement based on the direction
    let viewMeasure = (this.isHorizontal()) ?
      budgieContainerMeasurements.width : budgieContainerMeasurements.height;

    // Calculate scrollspeed, this will dictate how far the budgie scroller moves with each frame
    // This must be a whole number > 0 so we round up.
    let scrollSpeed = Math.ceil(viewMeasure / this.options.secondsOnPage / fps);

    // Clear out any existing animations, which allows for use of this on redraws
    this.stopAnimate();

    // Only animate if the elements do not all fit in the container
    if(!this.fitsInContainer()){
      this.interval = setInterval(() => {
        // Get the current value of the scroll
        currentScroll = this.budgieContainer.parentElement[scrollDirection];

        // Add or subtract from the current value based on inverted or not
        this.options.inverted ? (currentScroll += scrollSpeed) : (currentScroll -= scrollSpeed);

        // Apply the new scroll value
        this.budgieContainer.parentElement[scrollDirection] = currentScroll;
      }, 1000/fps);
    } else {
      // Set the scroll property to 0 if all elements fit in the container
      // This is used when animate is called on a redraw
      this.budgieContainer.parentElement[scrollDirection] = 0;
    }
  }

  /**
   * Will toggle the inverted property of the Budgie element
   */
  changeInversion(){
    this.options.inverted = !this.options.inverted;
  }

  /**
   * Clears the interval that controls the scrolling
   * @returns {boolean}
   */
  stopAnimate() {
    if(!this.interval) return false;
    window.clearInterval(this.interval);
    return true;
  }

  /**
   * Removes the Budgie element from the DOM
   */
  removeBudgie() {
    this.stopAnimate();
    this.budgieContainer.parentElement.classList.remove(`budgie-flex-container-parent-${this.budgieId}`);
    this.budgieContainer.parentElement.removeChild(this.budgieContainer);
  }
}

// Set Budgie as a global variable for use
if( typeof global !== 'undefined')
  global.Budgie = Budgie;
