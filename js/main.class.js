window.Infinite = {
  Scrollers: []
}

'use strict';

class InfiniteScroller {
  constructor(items, selector, options = {}) {
    this.selector = selector;
    this.options = Object.assign(this.defaultOptions(), options);
    this.items = new InfiniteArray(items);

    this.items.infiniteCollectionPosition = Infinite.Scrollers.length;
    Infinite.Scrollers.push(this)
  }

  defaultOptions(){
    return Object.freeze({
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
      'new': true,
      'imageFit': 'cover'
    });
  }
  //////////////
  // Public methods for using the scroller
  //////////////
  // start the infinite scroll
  start() {

  }

  // switch infinite scroller direction
  changeInverstion(){

  }


  //////////////
  // 'Private' methods for scroller setup
  //////////////

}

class InfiniteArray extends Array {
  constructor() {
    super(...arguments)
  }

  push(){

  }
  pop(){
    console.log(this.infinite)
    super.pop()
  }
  splice(){}
}