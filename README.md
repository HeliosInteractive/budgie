# Infinity

An infinite scrolling plugin, that can adapt as the list of items it is scrolling changes.

## Instalation

```$xslt
npm install @helios-interactive/infinity --save
```

## Usage

#### Browser

```
<link rel="stylesheet" href="node_modules/@helios-interactive/infinity/dist/main.css">

<script src="node_modules/@helios-interactive/infinity/dist/infinity.min.js" type="text/javascript"></script>
<script>
    new InfiniteScroller(items, '.element', options)
</script>
```

## Methods

#### Initialization

> **items:** The list of items that you want to make up the scroller. Accepts HTML Elements, or strings of image sources
>
> **selector:** A selector ('.foo', '#bar') for the element that will contain the scroller.
>
> **options:** default values are listed
>
> ```
>    'numberHigh': 1, // How many items stacked vertically
>    'numberWide': 1, // How many items stacked horizontally
>    'direction': 'vertical', // Direction of scroll ('verical' or 'horizontal')
>    'secondsOnPage': 1.0, // How many seconds each element is visible while scrolling (only relevant for autoscroll)
>    'inverted': false, // Invert the direction of scroll along the axis given in direction
>    'autoScroll': true, // If true, then the scroller will automatically scroll and loop forever
>    'imageFit': 'cover', // if an array of images are passed, then this will determine how they fit in each element
>    'fps': 60 // frames per second (higher is smoother, lower is more performate)
> ```

#### Array manipulation

> The items array can be accessed via the items property on the scroller. See example:
>```
> var scroller = new InfiniteScroller(items, '.element', options)
> scroller.items 
> // [item1, item2]
>```
>
> You can manipulate this array with pop, push, shift, unshift, splice
>```
> var scroller = new InfiniteScroller(items, '.element', options)
> scroller.items.pop()
> // [item1]
>```
> Any manipulation done in this way will automatically update the scroller on screen.


### TODO
* V1
    * allow for passing elements or image refs
    * make fps configurable
    * ~~Add support for update through array manipulation~~
    * Allow the user to start when they want, not autostart.
    * Build as a plugin
    * Documentation for how to use and what the defaults are.
    * Namespacing of methods
* Later
    * handle screen resizes. Reset the scroller mesaurements.
    * provide guide to updating styling.
    * instead of clipping items that create an odd ending, duplicate the items until there is no longer an odd ending.

## Browser support

 - IE11
 - Edge11
 - Chrome 49
 - Opera 42
 - Safari 9.2
 - Firefox 50
 - Sorry, no Netscape Navigator or Lynx support :/

For more support add:
 - [classList pollyfill](https://github.com/eligrey/classList.js)
 - Flexbox pollyfill
 - forEach pollyfill