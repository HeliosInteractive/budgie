'use strict';

let styleBlock = document.createElement('style');

styleBlock.innerHTML = `
.budgie-container {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center; }

.budgie-item :first-child {
  max-height: 100%;
  max-width: 100%; }

.budgie-container-parent {
  overflow: -moz-scrollbars-none; }
  .budgie-container-parent::-webkit-scrollbar {
    display: none; }
`;

document.head.appendChild(styleBlock);;'use strict';

const imageExtensions = ['jpg', 'gif', 'png', 'bmp', 'jpeg'];
const videoExtensions = ['mp4','ogg', 'webm'];
/**
 * BudgieDomSetup
 * This class handles tasks that involve interacting with the DOM at setup
 */
const BudgieDom = Object.create({
  /**
   * Creates the container inside the passed in element that allows for scrolling
   * @param budgie
   * @returns {Element} returns the budgie container
   */
  setupBudgieContainer : (budgie) => {
    budgie.parentContainer.classList.add(`budgie-container-parent`);
    budgie.parentContainer.classList.add(`budgie-container-parent-${budgie.budgieId}`);

    let budgieFlexContainer = document.createElement('div');
    budgieFlexContainer.classList.add('budgie-container');
    budgieFlexContainer.classList.add(`budgie-container-${budgie.budgieId}`);
    budgie.parentContainer.appendChild(budgieFlexContainer);

    return budgieFlexContainer;
  },

  /**
   * Create CSS classes for budgie items
   * @param budgie
   */
  setupBudgieCSS : (budgie) => {
    // Width of budgie container
    const eleWidth = parseInt(window.getComputedStyle(budgie.budgieContainer).width);

    let numOfSheets = 0;
    // select last sheet, which is the one we append. Needed for CORS compliance
    let sheetIndex = document.styleSheets.length - 1;

    // If there are already cssRules declared, then set the correct number of sheets to allow for addition
    if(document.styleSheets[sheetIndex].cssRules) {
      numOfSheets = document.styleSheets[sheetIndex].cssRules.length;
    }

    // Take the larger of the two as the number across
    const numberAcross = budgie.options.numberHigh >= budgie.options.numberWide ?
      budgie.options.numberHigh : budgie.options.numberWide;

    // Width in %
    const width = ((eleWidth / budgie.options.numberWide / eleWidth) * 100);
    // Height in %
    const height = (100 / budgie.options.numberHigh);

    // Set the width and height of a single budgie element
    document.styleSheets[sheetIndex].insertRule(
      `.budgie-item-${budgie.budgieId}{width: ${width}%; height: ${height}%;}`, numOfSheets
    );

    // Create CSS rules for all possible configurations of filler elements
    for(let i = numberAcross - 1; i >= 0; i--){
      document.styleSheets[sheetIndex].insertRule(
        `.budgie-item-${budgie.budgieId}--filler-${i}
        {
          width: ${width*(budgie.options.numberWide - i)/2}%;
          height: ${height*(budgie.options.numberHigh - i)/2}%; flex-grow: 1;
        }`,
        numOfSheets
      );
    }

    // Get the flex direction based on the budgie direction
    let direction = budgie.options.direction === 'horizontal' ? 'column' : 'row';
    // Set flex direction
    document.styleSheets[sheetIndex].insertRule(
      `.budgie-container-${budgie.budgieId}{flex-direction: ${direction};}`,
      numOfSheets
    );

    // Set the overflow properties based on the budgie direction
    document.styleSheets[sheetIndex].insertRule(
      `.budgie-container-parent-${budgie.budgieId}
      {
        overflow-x: ${budgie.options.direction === 'horizontal' ? 'scroll' : 'hidden'};
        overflow-y: ${budgie.options.direction === 'vertical' ? 'scroll' : 'hidden'}
      }`,
      numOfSheets
    );
  },

  /**
   * Sets the scroll properties based on the direction of budgie, and element size
   * @param budgie
   */
  setupBudgieScrollProperties : (budgie) => {
    // Get the scroll property (scrollTop or scrollLeft)
    let scrollProperty = budgie.scrollProperty();

    // Get the containers measurement
    let budgieContainer = BudgieDom.measureElementWidthAndHeight(`.budgie-container-${budgie.budgieId}`)

    // Derive the measurements of an individual element
    let budgieElementMeasure;
    if(budgie.isHorizontal()) {
      budgieElementMeasure = budgieContainer.width / budgie.options.numberWide;
    } else {
      budgieElementMeasure = budgieContainer.height / budgie.options.numberHigh;
    }

    // Set the scroll position to the top of the non-duped elements
    budgie.parentContainer[scrollProperty] = budgieElementMeasure;

    // Bind an event listener to the scroll event
    budgie.parentContainer.addEventListener("scroll", () => {budgie.onScroll(scrollProperty)});
  },

  /**
   * Binds events so that mouse drag will allow for scrolling
   * @param budgie
   */
  setupBudgieMouseDrag : (budgie) => {
    // Get the scroll property (scrollTop or scrollLeft)
    let scrollProperty = budgie.scrollProperty();

    // Bind events to handle scrolling with a mouse
    budgie.parentContainer.addEventListener("mousedown", () => {budgie.mouseDown = true});
    budgie.parentContainer.addEventListener("mouseup", () => {budgie.mouseDown = false});
    budgie.parentContainer.addEventListener("mouseout", () => {budgie.mouseDown = false});
    budgie.parentContainer.addEventListener("mousemove", (event) => { budgie.onMouseMove(event, scrollProperty) });
  },

  /**
   * Inserts the budgie elements. This should only be used during first setup
   * @param budgie
   */
  insertBudgieElements : (budgie) => {
    budgie.items.forEach((item, id) => {
      // Add a filler item before the odd ending elements
      // so that odd ending lists will have a centered ending
      if(budgie.hasOddEnding() && (budgie.items.length - budgie.numberLeftWithOddEnding() === id)){
        budgie.budgieContainer.appendChild(BudgieDom.createBudgieFillerElement(budgie));
      }

      // Add the item
      budgie.budgieContainer.appendChild(BudgieDom.createBudgieElement(budgie, item, id));

      // Add a filler item after the odd ending elements
      // so that odd ending lists will have a centered ending
      if(budgie.hasOddEnding() > 0 && (budgie.items.length === id + 1)){
        budgie.budgieContainer.appendChild(BudgieDom.createBudgieFillerElement(budgie));
      }
    });

    // If all the elements fit without scrolling, then add an extra div to allow for updates later
    if(budgie.fitsInContainer()){
      let blankEle = document.createElement('div');
      blankEle.classList.add(`budgie-item-${budgie.budgieId}--blank`);
      budgie.budgieContainer.appendChild(blankEle);
    }
  },

  /**
   * Creates a filler element with the class based on the number of left over budgie elements
   * @param budgie
   * @returns {Element}
   */
  createBudgieFillerElement : (budgie) => {
    let filler = document.createElement('div');
    filler.classList.add(`budgie-item-${budgie.budgieId}--filler`);
    filler.classList.add(`budgie-item-${budgie.budgieId}--filler-${budgie.numberLeftWithOddEnding()}`);
    return filler;
  },

  /**
   * Creates a budgie element, and returns that element for use.
   * @param budgie
   * @param item
   * @param itemIndex
   * @returns {Element}
   */
  createBudgieElement : (budgie, item, itemIndex) => {
    let element = document.createElement('div');

    element.classList.add('budgie-item');
    element.classList.add(`budgie-item-${budgie.budgieId}`);
    element.classList.add(`budgie-${budgie.budgieId}-${itemIndex}`);

    const innerDiv = BudgieDom.convertItemToElement(item)

    element.innerHTML = innerDiv.outerHTML;

    return element;
  },

  /**
   * Will convert an item to a element so that it can be used in a budgie element
   * @param item
   * @returns {*}
   */
  convertItemToElement : (item) => {
    // If the item is a dom element, then return it
    if(typeof item === 'object' ) return item;

    if(typeof item !== 'string') throw new Error('Only DOM Elements and strings are accepted as budgie items')

    let extension = item.match(/\.{1}\w*$/)
    if(extension) {
      extension = extension[0].substr(1)
    }

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
  },

  /**
   * Returns the height and width measurements of the first element matching the given selector
   * @param selector
   * @returns {{}}
   */
  measureElementWidthAndHeight : (selector) => {
    let measure = {};
    const elementComputedStyle = window.getComputedStyle(document.querySelector(selector));
    measure.height = parseFloat(elementComputedStyle.height);
    measure.width = parseFloat(elementComputedStyle.width);
    return measure;
  },
});;'use strict';

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
    // create the previousItems array, used when updated via setItems
    this.previousItems = [];
    // boolean saying whether there is a mouse currently clicking the budgie element
    this.mouseDown = false;

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
        return BudgieDom.measureElementWidthAndHeight(`.budgie-item-${this.budgieId}`).height * (Math.ceil(this.items.length/this.options.numberWide));
        break;
      case 'horizontal':
        return BudgieDom.measureElementWidthAndHeight(`.budgie-item-${this.budgieId}`).width * (Math.ceil(this.items.length/this.options.numberHigh));
        break;
    }
  }

  /**
   * Updates the items array, and also updates the budgie instance
   * This method will attempt to not alter any budgie items that do not need altering
   * It will instead remove no longer needed items, and add new items
   * @param items
   */
  setItems(items){
    const currentFiller = this.numberLeftWithOddEnding()
    /**
     * Will return the indexes (from the old array) of items that were removed
     * @param oldArray
     * @param newArray
     */
    const removedIndexes = (oldArray, newArray) => {
      let rawArray = oldArray.map((oldItem, index) => {
        if(!newArray.some(newItem => newItem === oldItem)){
          return index;
        }
      })

      return rawArray.filter( index => (index || index === 0) );
    }


    /**
     * Will return the indexes (from the new array) of items that were added
     * @param oldArray
     * @param newArray
     */
    const addedIndexes = (oldArray, newArray) => {
      let rawArray = newArray.map((newItem, index) => {
        if(!oldArray.some(oldItem => oldItem === newItem)){
          return index;
        }
      })

      return rawArray.filter( index => (index || index === 0) );
    }


    this.previousItems = this.items.slice();
    this.items = items.slice();

    let indexesToRemove = removedIndexes(this.previousItems, this.items);
    let indexesToAdd = addedIndexes(this.previousItems, this.items);

    // console.log('add:', indexesToAdd, 'remove:', indexesToRemove)

    if(indexesToRemove.length > 0) {
      indexesToRemove.forEach(index => {
        this.removeLastItem(index);
      })
    }

    if(indexesToAdd.length > 0) {
      indexesToAdd.forEach(index => {
        this.addItemAtIndex(index);
      })
    }

    // When adding we have to update the index every time
    const realElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}:not(.budgie-item-${this.budgieId}--duplicate)`));
    realElements.forEach((element, index) => {
      let className = Array.from(element.classList).filter(_className => _className.match(new RegExp(`budgie-${this.budgieId}-\\d`)));
      if(className !== `budgie-${this.budgieId}-${index}`) {
        element.classList.remove(className);
        element.classList.add(`budgie-${this.budgieId}-${index}`);
      }
    })

    // remove duplicate elements
    const dupedElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}.budgie-item-${this.budgieId}--duplicate`));
    dupedElements.forEach(element => {
      element.parentNode.removeChild(element);
    })

    // remove filler elements
    const fillerElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}--filler`));
    fillerElements.forEach(element => {
      element.parentNode.removeChild(element);
    })

    // Insert duplicated elements anew, if this is an infinite scroll
    if(this.options.infiniteScroll) {
      this.prependStartingItems();
      this.appendEndingItems();
    }

    // Add filler items to the end if needed
    if(this.numberLeftWithOddEnding() > 0) {
      realElements[realElements.length - this.numberLeftWithOddEnding()]
        .insertAdjacentElement('beforebegin', BudgieDom.createBudgieFillerElement(this))

      realElements[realElements.length - 1]
        .insertAdjacentElement('afterend', BudgieDom.createBudgieFillerElement(this))
    }

    this.clearMeasurements();
    this.budgieAnimate();
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
    let elementCount = document.querySelectorAll(`.budgie-item-${this.budgieId}:not(.budgie-item-${this.budgieId}--duplicate)`).length
    if(this.items.length > elementCount){
      for(let i = elementCount; i < this.items.length; i++){
        this.addLastItem(i, i - 1);
      }
      this.updateBeginningAndEndingItems('add');
    } else if (this.items.length < elementCount) {
      for(let i = elementCount; i > this.items.length; i--){
        this.removeLastItem(i-1);
      }
      this.updateBeginningAndEndingItems('remove');
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
    const realElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}:not(.budgie-item-${this.budgieId}--duplicate)`));

    // If the number of elements is greater than the number that fit in the given area
    if(!this.fitsInContainer()){
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
            ele.classList.add(`budgie-item-${this.budgieId}--duplicate`);
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
            ele.classList.add(`budgie-item-${this.budgieId}--duplicate`);
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
    const realElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}:not(.budgie-item-${this.budgieId}--duplicate)`));

    // If the number of elements is greater than the number that fit in the given area
    if(!this.fitsInContainer()){
      // Appends duplicate items equal to the number of elementsOnScreen
      realElements.slice(
        0,
        elementsOnScreen
      )
        .forEach((element) => {
          let ele = element.cloneNode(true);
          ele.classList.add(`budgie-item-${this.budgieId}--duplicate`);
          ele.classList.add(`budgie-item-${this.budgieId}--duplicate-ending`);
          this.budgieContainer.insertAdjacentElement('beforeend', ele);
        });
    }
  }

  addItemAtIndex(index){
    // Get the element before where we want to add if the index is >0
    let realElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}:not(.budgie-item-${this.budgieId}--duplicate)`));
    const newElement = BudgieDom.createBudgieElement(this, this.items[index], index);

    // This allows for items to be added even if budgie is instantiated as empty
    if(realElements.length === 0) {
      realElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}--blank`));
    }

    if(index > 0) {
      realElements[index-1].insertAdjacentElement('afterend', newElement)
    } else {
      realElements[index].insertAdjacentElement('beforebegin', newElement)
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
      elements = document.getElementsByClassName(`budgie-item-${this.budgieId}--blank`)
    }

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

        let newElement = BudgieDom.createBudgieElement(this, item, index);
        // update the element if it does not currently match
        if (element.innerHTML !== newElement.innerHTML) {
          element.innerHTML = newElement.innerHTML;
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

    let realElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}:not(.budgie-item-${this.budgieId}--duplicate)`));

    // Trim the number of elements across one row to get rid of the bottom dupes
    let dupedElements = Array.from(document.querySelectorAll(`.budgie-item-${this.budgieId}.budgie-item-${this.budgieId}--duplicate`));
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
      ele.classList.add(`budgie-item-${this.budgieId}--duplicate`);
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

    if(redraw){
      Array.from(document.getElementsByClassName(`budgie-item-${this.budgieId}--filler`)).forEach(element =>
        element.parentNode.removeChild(element));
    }

    if(this.hasOddEnding()){
      if(document.getElementsByClassName(`budgie-item-${this.budgieId}--filler`).length === 0) {
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
        Array.from(document.getElementsByClassName(`budgie-item-${this.budgieId}--filler`)).forEach((element) => {
          element.classList.remove(`budgie-item-${this.budgieId}--filler-${this.numberLeftWithOddEnding() + operator}`);
          element.classList.add(`budgie-item-${this.budgieId}--filler-${this.numberLeftWithOddEnding()}`);
        });
      }
    } else {
      Array.from(document.getElementsByClassName(`budgie-item-${this.budgieId}--filler`)).forEach(element =>
        element.parentNode.removeChild(element));
    }

    // If all elements fit in the container and scrolling is not needed
    if(this.fitsInContainer()) {
      Array.from(document.getElementsByClassName(`budgie-item-${this.budgieId}--duplicate`)).forEach(element =>
        element.parentNode.removeChild(element));

      // Append an extra div so that new items can be added
      if(document.getElementsByClassName(`budgie-item-${this.budgieId}--blank`).length === 0){
        let blankEle = document.createElement('div');
        blankEle.classList.add(`budgie-item-${this.budgieId}--blank`);
        this.budgieContainer.appendChild(blankEle);
      }
    }

    if(!this.fitsInContainer() && document.getElementsByClassName(`budgie-item-${this.budgieId}--duplicate-ending`).length === 0){
      this.appendEndingItems();

      Array.from(document.getElementsByClassName(`budgie-item-${this.budgieId}--blank`)).forEach(blankEle =>
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
      let budgieElement = BudgieDom.measureElementWidthAndHeight(`.budgie-item-${this.budgieId}`);
      this.budgieElementMeasurement = Math.floor(this.isHorizontal() ? budgieElement.width : budgieElement.height);
    }

    // console.log('scroll at: ' + this.parentContainer[scrollDirection], 'container size: ' + this.scrollContainerSize, 'element size: ' + this.budgieElementMeasurement)

    if((this.parentContainer[scrollDirection] >= this.scrollContainerSize + this.budgieElementMeasurement)) {
      this.parentContainer[scrollDirection] = this.budgieElementMeasurement;
    } else if((this.parentContainer[scrollDirection] <= 0 )) {
      this.parentContainer[scrollDirection] = this.scrollContainerSize;
    }
  }

  onMouseMove(event, scrollDirection) {
    // If the mouse is not down, then we don't care, bail early
    if(!this.mouseDown) { return }

    this.parentContainer[scrollDirection] -= this.isHorizontal() ? event.movementX : event.movementY;
    console.log("mouse moved", event)
  }

  /**
   * Sets up the budgie scroller to be ready for use
   */
  budgieSetup() {
    this.budgieContainer = BudgieDom.setupBudgieContainer(this);
    BudgieDom.setupBudgieCSS(this);
    BudgieDom.insertBudgieElements(this);
    BudgieDom.setupBudgieMouseDrag(this);
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
      // This effectively kick starts the scrolling. It's unclear why exactly it is needed,
      // though it is related to scroll properties
      this.budgieContainer.parentElement[scrollDirection] += 1
      this.budgieContainer.parentElement[scrollDirection] -= 1

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
    this.budgieContainer.parentElement.classList.remove(`budgie-container-parent-${this.budgieId}`);
    this.budgieContainer.parentElement.removeChild(this.budgieContainer);
  }
}

// Set Budgie as a global variable for use
if( typeof global !== 'undefined')
  global.Budgie = Budgie;
