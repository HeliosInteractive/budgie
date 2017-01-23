'use strict';
/**
* Create an infinite scroller
* @param {array} images
* @param {string} selector - This can be a class or an id
* @param {object} options - All the optional arguments
*/

let testImages = ['http://placehold.it/350x150/660090','http://placehold.it/350x150/550099','http://placehold.it/350x150/440000','http://placehold.it/350x150/3300ff','http://placehold.it/350x150/2200ee','http://placehold.it/350x150/660000','http://placehold.it/350x150/1100bb','http://placehold.it/350x150/660000','http://placehold.it/350x150/770034','http://placehold.it/350x150/880000','http://placehold.it/350x150/9900f0','http://placehold.it/350x150/0f0011','http://placehold.it/350x150/800320','http://placehold.it/350x150/0670f1','http://placehold.it/350x150/362000']

let infinity = function(images, selector, options = {}) {
  images = options.inverted ? images.reverse() : images

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
    'userNavigation': false
  }

  options = Object.assign(defaultOptions, options)

  let ele = getElements(selector)[0]
  ele.className += ' infinite-flex-container-parent'

  let scrollerDiv = document.createElement('div');

  scrollerDiv.className += ' infinite-flex-container'

  ele.appendChild(scrollerDiv)

  setScrollerCSS(scrollerDiv, options)

  if(options.clipOddEnding)
    images = trimImagesArray(images, options)

  images.forEach(function(image, index){
    scrollerDiv.appendChild(imageElement(image, index))
  })

  let scrollerSize = measureScrollSection(images.length, options)
  let elementsOnScreen = parseInt(options.numberHigh) * parseInt(options.numberWide)

  if(images.length > elementsOnScreen)
    appendFillerElements(scrollerDiv, elementsOnScreen)
  
  startScroll(scrollerDiv, scrollerSize, options)
}

function trimImagesArray(images, options){
  var numberAcross = (options.direction === 'horizontal') ? options.numberHigh : options.numberWide
  let remaining = (images.length % numberAcross)
  if(remaining > 0)
    return images.slice(0, images.length - remaining)
  else
    return images
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

function measureScrollSection(imageCount, options) {
  if(options.direction === 'vertical')
    return elementMeasurement(options) * ((imageCount/options.numberWide));
  else if(options.direction === 'horizontal')
    return elementMeasurement(options) * ((imageCount/options.numberHigh));
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

function imageElement(imgPath, index, options){
  let e = document.createElement('div');
  e.style.backgroundImage = 'url(' + imgPath + ')';
  e.className += ' infinite-flex-item'
  e.className += ' infinite-' + index;
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

function startScroll(scrollingElement, scrollerSize, options) {
  const fps = 60;

  let currentMargin = options.inverted ? -scrollerSize : 0;
  let viewMeasure = viewPortMeasurement(options)
  let scrollSpeed = viewMeasure / options.secondsOnPage / fps

  let marginSelector = {
    'vertical':'marginTop',
    'horizontal':'marginLeft'
  }

  setInterval(function() {
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
let options = {
  'numberHigh': 3,
  'numberWide': 2,
  'clipOddEnding': true,
  'secondsOnPage': 5.0,
  'direction': 'vertical',
  'inverted': true
}
console.log(options)

infinity(testImages, '.main', options)
//
setTimeout(function () {
  infinityReplace([{'id':12, 'url':'http://placehold.it/350x150/009c0c'}, {'id':7, 'url':'http://placehold.it/350x150/009c0c'}, {'id':6, 'url':'http://placehold.it/350x150/009c0c'}, {'id':3, 'url':'http://placehold.it/350x150/009c0c'}])
}, 5000)
//
setTimeout(function () {
  infinityReplace([{'id':12, 'url':'http://placehold.it/350x150/6e009c'}, {'id':7, 'url':'http://placehold.it/350x150/6e009c'}, {'id':6, 'url':'http://placehold.it/350x150/6e009c'}, {'id':3, 'url':'http://placehold.it/350x150/6e009c'}])
}, 10000)

setTimeout(function () {
  infinityReplace([{'id':12, 'url':'http://placehold.it/350x150/FFFF00'}, {'id':7, 'url':'http://placehold.it/350x150/FFFF00'}, {'id':6, 'url':'http://placehold.it/350x150/FFFF00'}, {'id':3, 'url':'http://placehold.it/350x150/FFFF00'}])
}, 15000)
