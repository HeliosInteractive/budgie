'use strict';
/**
* Create an infinite scroller
* @param {array} images
* @param {string} selector - This can be a class or an id
* @param {object} options - All the optional arguments
*/

let testImages = ['http://placehold.it/350x150/660090','http://placehold.it/350x150/550099','http://placehold.it/350x150/440000','http://placehold.it/350x150/3300ff','http://placehold.it/350x150/2200ee','http://placehold.it/350x150/660000','http://placehold.it/350x150/1100bb','http://placehold.it/350x150/660000','http://placehold.it/350x150/770034','http://placehold.it/350x150/880000','http://placehold.it/350x150/9900f0','http://placehold.it/350x150/0f0011','http://placehold.it/350x150/800320','http://placehold.it/350x150/0670f1','http://placehold.it/350x150/362000']

let infinity = function(images, selector, options = {}) {
  const defaultOptions = {
    'numberHigh': 1,
    'numberWide': 1,
    'clipOddEnding': false,
    'noScrollIfNoOverflow': true,
    'direction': 'vertical',
    'inverted': false,
    'secondsOnPage': 1.0
  }

  options = Object.assign(defaultOptions, options)

  let ele = getElements(selector)[0]
  let scrollerDiv = document.createElement('div');

  scrollerDiv.className += ' infinite-container-flex'

  ele.appendChild(scrollerDiv)

  setFlexItemStyle(scrollerDiv, options)

  console.log(images.length)

  if(options.clipOddEnding)
    console.log(trimImagesArray(images, options).length)
    images = trimImagesArray(images, options)

  console.log(images.length)

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
  let dupedElements = [].slice.call(getElements('.infinite-flex-item'), 0, elementsOnScreen);

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
    return parseFloat(window.getComputedStyle(getElements('.infinite-container-flex')[0]).height);
  else if(options.direction === 'horizontal')
    return parseFloat(window.getComputedStyle(getElements('.infinite-container-flex')[0]).width);
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

function imageElement(imgPath, index, options){
  let e = document.createElement('div');
  e.style.backgroundImage = 'url(' + imgPath + ')';
  e.className += ' infinite-flex-item'
  e.id = 'infinite-' + index;
  return e;
}

function setFlexItemStyle(element, options){
  let eleWidth = parseInt(window.getComputedStyle(element).width);
  // let eleHeight = parseInt(window.getComputedStyle(element).height);

  let numOfSheets = document.styleSheets[0].cssRules.length;

  // Width in %
  let width = ((eleWidth / options.numberWide / eleWidth) * 100);
  // subtract 5% width to allow for flex to grow the space
  // let width = width * 0.95
  let height = (100 / options.numberHigh);

  document.styleSheets[0].insertRule('.infinite-flex-item{width: ' + width + '%; height: ' + height + '%;}', numOfSheets);
}

function startScroll(scrollingElement, scrollerSize, options) {
  let topMargin = 0;
  let viewMeasure = viewPortMeasurement(options)
  const fps = 30;
  let scrollSpeed = viewMeasure / options.secondsOnPage / fps

  setInterval(function() {
    scrollingElement.style.marginTop = (topMargin -= scrollSpeed) + 'px';
    if(topMargin <= -scrollerSize)
      topMargin = 0
      scrollingElement.style.marginTop = topMargin + 'px';

  }, 1000/fps)
}

infinity(testImages, '.main', {
  'numberHigh': 3,
  'numberWide': 3,
  'clipOddEnding': true,
  'secondsOnPage': 5.0

})

// To get the width of the flex-item in VW
// =width/columns/width * 100