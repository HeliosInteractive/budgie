'use strict';

const imageExtensions = ['jpg', 'gif', 'png'];
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
    budgie.parentContainer.classList.add(`budgie-flex-container-parent`);
    budgie.parentContainer.classList.add(`budgie-flex-container-parent-${budgie.budgieId}`);

    let budgieFlexContainer = document.createElement('div');
    budgieFlexContainer.classList.add('budgie-flex-container');
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

    // If there are already cssRules declared, then set the correct number of sheets to allow for addition
    if(document.styleSheets[0].cssRules) {
      numOfSheets = document.styleSheets[0].cssRules.length;
    }

    // Take the larger of the two as the number across
    const numberAcross = budgie.options.numberHigh >= budgie.options.numberWide ?
      budgie.options.numberHigh : budgie.options.numberWide;

    // Width in %
    const width = ((eleWidth / budgie.options.numberWide / eleWidth) * 100);
    // Height in %
    const height = (100 / budgie.options.numberHigh);

    // Set the width and height of a single budgie element
    document.styleSheets[0].insertRule(
      `.budgie-flex-item-${budgie.budgieId}{width: ${width}%; height: ${height}%;}`, numOfSheets
    );

    // Create CSS rules for all possible configurations of filler elements
    for(let i = numberAcross - 1; i >= 0; i--){
      document.styleSheets[0].insertRule(
        `.budgie-flex-item-${budgie.budgieId}--filler-${i}
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
    document.styleSheets[0].insertRule(
      `.budgie-container-${budgie.budgieId}{flex-direction: ${direction};}`,
      numOfSheets
    );

    // Set the overflow properties based on the budgie direction
    document.styleSheets[0].insertRule(
      `.budgie-flex-container-parent-${budgie.budgieId}
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

    // Get a single budgie element's measure
    let budgieElement = BudgieDom.measureElementWidthAndHeight(`.budgie-flex-item-${budgie.budgieId}`);

    // Use width or height based on budgie direction
    let budgieElementMeasure = budgie.isHorizontal() ? budgieElement.width : budgieElement.height;

    // Set the scroll position to the top of the non-duped elements
    budgie.parentContainer[scrollProperty] = budgieElementMeasure;

    // Bind an event listener to the scroll event
    budgie.parentContainer.addEventListener("scroll", function(){budgie.onScroll(scrollProperty)});
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
      blankEle.classList.add(`budgie-flex-item-${budgie.budgieId}--blank`);
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
    filler.classList.add(`budgie-flex-item-${budgie.budgieId}--filler`);
    filler.classList.add(`budgie-flex-item-${budgie.budgieId}--filler-${budgie.numberLeftWithOddEnding()}`);
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

    element.classList.add('budgie-flex-item');
    element.classList.add(`budgie-flex-item-${budgie.budgieId}`);
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
});