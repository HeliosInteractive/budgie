# Budgie

An infinite scrolling plugin, that tackles grid layout of the items being scrolled, and can adapt as the list of items it is scrolling changes.

## Demos

https://heliosinteractive.github.io/budgie/

## Instalation

```$xslt
npm install @helios-interactive/budgie --save
```

## Usage

> Note:
>
> Budgie element refers to the whole element, with all items contained inside of it.
>
> Budgie item refers to a single items within the Budgie Element 

Currently including the script file is the only way to use budgie. 

Budgie will be available in the global namespace once it has been included with the script tag
```
<script src="node_modules/@helios-interactive/budgie/dist/budgie.min.js" type="text/javascript"></script>
```

To create a Budgie element, you will need a list of items that you want to make up the tiles within the Budgie element. 
You will also need to have an empty div on your page that will contain the Budgie element.
You can also supply additional optional configuration as an options object
```
<script>
    new Budgie(items, '.element', options)
</script>
```

### What can it display?

Budgie accepts three types of content as Budgie items. 

* Elements
    * Any HTMLElement can be passed as an item to budgie.
* Images - as a source string
    * The following extensions wil be created as images: ['jpg', 'gif', 'png', 'bmp', 'jpeg']
* Videos - as a source string
    * The following extensions wil be created as videos: ['mp4','ogg', 'webm']
    
You can send the whole list as one of these types, or mix and match them as desired.

### How can I customize the styling?

Budgie intentionally does very little with styling so that the user can have full control of that aspect. 
All styles applied by budgie are applied as classes, so issues with specificty should be rare. 

All Budgie items will have the class of `budgie-item`. You can use this to select the items and apply a class, or add your styling to that class.

The Budgie element will have a class of `budgie-container`

### Can I have multiple Budgie containers on the same page?

Yep. Each Budgie will generate a code to keep it uniquely identified. This is stored on the Budgie object as `budgieId`

If you have multiple budgie elements, then you can use the budgieId to select the one you want. 
Budgie items will have the class `budgie-item-<budgieId>`. 
The Budgie element will have the class `budgie-container-<budgieId>`

## Configuration

Configuration options are passed on initialization as an options object.

|Option|Type|Choices|Default|Description|
|---|---|---|---|---|
|numberHigh|Integer|1...n|1|This determines the number of Budgie items that will be stacked vertically.|
|numberWide|Integer|1...n|1|This determines the number of Budgie items that will be stacked horizontally.|
|direction|String|'vertical', 'horizontal'|'vertical'|This will set which axis the Budgie element will scroll on.|
|inverted|Boolean|true, false|false|By default horizontal will scroll from left to right, and vertical will scroll from top to bottom. This will invert those directions so that horizontal will scroll from right to left, and vertical will scroll from bottom to top. **This is only used if autoScroll is true.**|
|fps|Integer|1...n|60|This determines how often Budgie animates. A higher fps will provide a smoother animation, at the cost of performance. Between 30 and 60 is usually optimal. **This is only used if autoScroll is true.**|
|secondsOnPage|Fixnum|1.0...n|1.0|This determines how long a Budgie Item stays within the Budgie element (how long the viewer can see it before it goes off screen). The lower the number, the faster it will go. This combined with the size of the Budgie Element will determine the speed of the scroll. **This is only used if autoScroll is true.**|
|infiniteScroll|Boolean|true, false|true|If this is set to true, then scrolling will wrap around allowing for infinite scrolling (scrolling down will wrap around and put you at the top, or vice versa).|
|autoScroll|Boolean|true, false|true|If autoScroll is on, then Budgie will automatically scroll through the elements using the secondsOnPage and Budgie element size to determine speed.|
|autoStart|Boolean|true, false|true|If this is true, then the Budgie element will automatically start on `new Budgie`. Otherwise it can be manually started with `Budgie.start()` **This is only used if autoScroll is true.**|


## Methods available

### The following methods are available on the Budgie object that is returned from `new Budgie`.

|Method|Arguments|Description|
|---|---|---|
|changeInversion||Will toggle the inversion to the opposite of it's current setting|
|stopAnimate||Will stop Budgie from autoscrolling|
|removeBudgie||Will remove the budgie element from the dom. It cannot be added back, and will need replaced with a `new Budgie`|

### The following array methods will update the Budgie element if executed on the array of items passed to budgie.

|Method|Description|
|---|---|
|pop|Normal Array behavior. Will pop the associated element off of Budgie|
|push|Normal Array behavior. Will push the associated element onto Budgie|
|shift|Normal Array behavior. Will shift the associated element off of Budgie|
|unshift|Normal Array behavior. Will unshift the associated element off of Budgie|
|splice|Normal Array behavior. Will splice the associated element(s) on/off of Budgie|

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
