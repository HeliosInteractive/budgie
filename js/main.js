'use strict';

let infinity = function(items, selector, options = {}) {
  console.log(arguments);
  window.InfinityScroller = {'selector':selector, 'options':options, 'length':items.length};

  // invert items list if this is an inverted scroll
  items = options.inverted ? items.reverse() : items;

  const defaultOptions = {
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
    'new': true
  };

  options = Object.assign(defaultOptions, options);

  // get parent container
  let parentContainer = getElements(selector)[0];
  parentContainer.className += ' infinite-flex-container-parent';

  // create scroller container
  let infiniteFlexContainer = document.createElement('div');
  infiniteFlexContainer.className += ' infinite-flex-container';
  parentContainer.appendChild(infiniteFlexContainer);
  setScrollerCSS(infiniteFlexContainer, options);

  // Trim the item array to prevent odd endings
  // TODO update this to instead duplicate the items until there is no longer an odd ending
  if(options.clipOddEnding)
    items = trimItemsArray(items, options)

  // Create elements
  items.forEach(function(item){
    infiniteFlexContainer.appendChild(itemElement(item))
  })

  // Append duplicate to allow for smooth transitions
  let elementsOnScreen = parseInt(options.numberHigh) * parseInt(options.numberWide)
  if(items.length > elementsOnScreen)
    appendFillerElements(infiniteFlexContainer, elementsOnScreen)
  
  startScroll(items.length, options)
}

function removeInfinity(){
  window.clearInterval(InfinityScroller.interval)
  getElements(InfinityScroller.selector)[0].className = getElements(InfinityScroller.selector)[0].className.replace('infinite-flex-container-parent', '')
  getElements(InfinityScroller.selector)[0].removeChild(getElements('.infinite-flex-container')[0])
}

function trimItemsArray(items, options){
  var numberAcross = (options.direction === 'horizontal') ? options.numberHigh : options.numberWide
  let remaining = (items.length % numberAcross)
  if(remaining > 0)
    return items.slice(0, items.length - remaining)
  else
    return items
}

function appendFillerElements(scrollingElement, elementsOnScreen) {
  let dupedElements;
  if(options.inverted)
    dupedElements = [].slice.call(getElements('.infinite-flex-item')).reverse().slice(0, elementsOnScreen);
  else
    dupedElements = [].slice.call(getElements('.infinite-flex-item'), 0, elementsOnScreen);

  if(options.inverted)
    dupedElements.forEach(function(element){
      scrollingElement.insertBefore( element.cloneNode(true), scrollingElement.firstChild );
    })
  else
    dupedElements.forEach(function(element){
      scrollingElement.appendChild(element.cloneNode(true))
    })
}

function measureScrollSection(itemCount, options) {
  if(options.direction === 'vertical')
    return elementMeasurement(options) * ((itemCount/options.numberWide));
  else if(options.direction === 'horizontal')
    return elementMeasurement(options) * ((itemCount/options.numberHigh));
  else
    throw new Error("Only vertical, and horizontal directions are accepted.")
}

function elementMeasurement(options) {
  if(options.direction === 'vertical')
    return parseFloat(window.getComputedStyle(getElements('.infinite-flex-item')[0]).height);
  else if(options.direction === 'horizontal')
    return parseFloat(window.getComputedStyle(getElements('.infinite-flex-item')[0]).width);
  else
    throw new Error("Only vertical, and horizontal directions are accepted.")
}

function viewPortMeasurement(options) {
  if(options.direction === 'vertical')
    return parseFloat(window.getComputedStyle(getElements('.infinite-flex-container')[0]).height);
  else if(options.direction === 'horizontal')
    return parseFloat(window.getComputedStyle(getElements('.infinite-flex-container')[0]).width);
  else
    throw new Error("Only vertical, and horizontal directions are accepted.")
}

function getElements(selector) {
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

function infinityReplace(elementArray) {
  elementArray.forEach(function(e){
    [].map.call(getElements('.infinite-' + e.id), function(element){ element.style.backgroundImage = 'url(' + e.url + ')'})
  })
}

function infinityAdd(elementArray) {

}

function infinityRemove(elementArray) {
  // need to recalculate sizes at this point.
  elementArray.forEach(function(e){
    let elements = getElements('.infinite-' + e.id)

    if (elements.length < 1)
      return;

    for(let i = elements.length; i > 0; i--) {
      elements[(i-1)].parentNode.removeChild(elements[(i-1)]);
    }
  })
}

function itemElement(element, options){
  let e = document.createElement('div');
  e.style.backgroundImage = 'url(' + element.url + ')';
  e.className += ' infinite-flex-item'
  e.className += ' infinite-' + element.id;
  return e;
}

function setScrollerCSS(element, options){
  let eleWidth = parseInt(window.getComputedStyle(element).width);
  // let eleHeight = parseInt(window.getComputedStyle(element).height);

  let numOfSheets = document.styleSheets[0].cssRules.length;

  // Width in %
  let width = ((eleWidth / options.numberWide / eleWidth) * 100);
  let height = (100 / options.numberHigh);

  document.styleSheets[0].insertRule('.infinite-flex-item{width: ' + width + '%; height: ' + height + '%;}', numOfSheets);

  let direction = options.direction === 'horizontal' ? 'column' : 'row'
  document.styleSheets[0].insertRule('.infinite-flex-container{flex-direction: ' + direction + ';}', numOfSheets);

  document.styleSheets[0].insertRule('.infinite-flex-container-parent{overflow: hidden;}', numOfSheets);
}

// Switches the inverted flag to change the direction
function changeInversion(){
  InfinityScroller.options.inverted = !InfinityScroller.options.inverted
  InfinityScroller.options.new = false
  startScroll(InfinityScroller.length, InfinityScroller.options)
}

function startScroll(length, options) {
  const fps = 60;
  const marginSelector = {
    'vertical':'marginTop',
    'horizontal':'marginLeft'
  }

  let scrollerSize = measureScrollSection(length, options)
  let scrollingElement = getElements('.infinite-flex-container')[0]
  let currentMargin;

  if(options.new)
    currentMargin = options.inverted ? -scrollerSize : 0;
  else
    currentMargin = parseFloat(scrollingElement.style[marginSelector[options.direction]])

  let viewMeasure = viewPortMeasurement(options)
  let scrollSpeed = viewMeasure / options.secondsOnPage / fps

  // always clear interval to ensure that only one scroller is running
  window.clearInterval(InfinityScroller.interval)
  InfinityScroller.interval = setInterval(function() {
    let marginChange = options.inverted ? (currentMargin += scrollSpeed) : (currentMargin -= scrollSpeed)
    scrollingElement.style[marginSelector[options.direction]] = marginChange + 'px';
    if((!options.inverted && currentMargin <= -scrollerSize) || (options.inverted && currentMargin >= 0))
      currentMargin = options.inverted ? -scrollerSize : 0;
      scrollingElement.style[marginSelector[options.direction]] = currentMargin + 'px';
  }, 1000/fps)
}

//////////////
// TESTING
//////////////
let testItems = [
  {'id':1, 'url':'http://placehold.it/350x150/660090'},
  {'id':2, 'url':'http://placehold.it/350x150/400090'},
  {'id':3, 'url':'http://placehold.it/350x150/550099'},
  {'id':4, 'url':'http://placehold.it/350x150/3300ff'},
  {'id':5, 'url':'http://placehold.it/350x150/2200ee'},
  {'id':6, 'url':'http://placehold.it/350x150/1100bb'},
  {'id':7, 'url':'http://placehold.it/350x150/660000'},
  {'id':8, 'url':'http://placehold.it/350x150/770034'},
  {'id':9, 'url':'http://placehold.it/350x150/880000'},
  {'id':10, 'url':'http://placehold.it/350x150/119c0c'},
  {'id':11, 'url':'http://placehold.it/350x150/9900f0'},
  {'id':12, 'url':'http://placehold.it/350x150/0f0011'},
  {'id':13, 'url':'http://placehold.it/350x150/800320'},
  {'id':14, 'url':'http://placehold.it/350x150/0670f1'},
  {'id':15, 'url':'http://placehold.it/350x150/362000'}
]


let options = {
  'numberHigh': 3,
  'numberWide': 3,
  'clipOddEnding': true,
  'secondsOnPage': 5.0,
  'direction': 'vertical',
  'inverted': true
}

infinity(testItems, '.main', options)
//
setTimeout(function () {
  infinityReplace([{'id':12, 'url':'http://placehold.it/350x150/00bcd4'}, {'id':7, 'url':'http://placehold.it/350x150/00bcd4'}, {'id':6, 'url':'http://placehold.it/350x150/00bcd4'}, {'id':3, 'url':'http://placehold.it/350x150/00bcd4'}])
}, 5000)
//
setTimeout(function () {
  infinityReplace([{'id':12, 'url':'http://placehold.it/350x150/6e009c'}, {'id':7, 'url':'http://placehold.it/350x150/6e009c'}, {'id':6, 'url':'http://placehold.it/350x150/6e009c'}, {'id':3, 'url':'http://placehold.it/350x150/6e009c'}])
}, 10000)

setTimeout(function () {
  infinityReplace([{'id':12, 'url':'http://placehold.it/350x150/FFFF00'}, {'id':7, 'url':'http://placehold.it/350x150/FFFF00'}, {'id':6, 'url':'http://placehold.it/350x150/FFFF00'}, {'id':3, 'url':'http://placehold.it/350x150/FFFF00'}])
}, 15000)

