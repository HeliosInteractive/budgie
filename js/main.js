'use strict';
/**
* Create an infinite scroller
* @param {array} images
* @param {string} selector - This can be a class or an id
* @param {object} options - All the optional arguments
*/

var testSelector = '.test'
var testImages = ['http://placehold.it/350x150/660090','http://placehold.it/350x150/550099','http://placehold.it/350x150/440000','http://placehold.it/350x150/3300ff','http://placehold.it/350x150/2200ee','http://placehold.it/350x150/660000','http://placehold.it/350x150/1100bb','http://placehold.it/350x150/660000','http://placehold.it/350x150/770034','http://placehold.it/350x150/880000','http://placehold.it/350x150/9900f0','http://placehold.it/350x150/0f0011','http://placehold.it/350x150/800320','http://placehold.it/350x150/0670f1','http://placehold.it/350x150/362000']

var infinity = function(images, selector, options) {
  options = options || {}

  var ele = getElement(selector)[0]

  ele.className += ' infinite-container-flex--vertical'

  setFlexItemStyle(ele, options)

  images.forEach(function(image, index){
    ele.appendChild(imageElement(image, index))
  })
}

function getElement(selector) {
  var splitSelector = selector.split(/(\.|#)/,3)
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
  var e = document.createElement('div');
  e.style.backgroundImage = 'url(' + imgPath + ')';
  e.className += ' infinite-flex-item'
  e.id = 'image' + index;
  return e;
}

function setFlexItemStyle(element, options){
  options = options || {}
  options.numberWide = options.numberWide || 2
  options.numberHigh = options.numberHigh || 2

  var eleWidth = parseInt(window.getComputedStyle(element).width);
  var eleHeight = parseInt(window.getComputedStyle(element).height);

  var numOfSheets = document.styleSheets[0].cssRules.length;

  // Width in VW
  var width = ((eleWidth / options.numberWide / eleWidth) * 100);
  // subtract 5% width to allow for flex to grow the space
  var width = width - width * 0.05
  var height = (100 / options.numberHigh);
  console.log(window.getComputedStyle(element).height)
  console.log(width)
  console.log(options)

  document.styleSheets[0].insertRule('.infinite-flex-item{width: ' + width + 'vw; height: ' + height + '%;}', numOfSheets);
}

infinity(testImages, '.main')

// To get the width of the flex-item in VW
// =width/columns/width * 100