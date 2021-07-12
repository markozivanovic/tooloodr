# TooLooDR

TooLooDR is a writing concept that you can read more about on its [homepage](https://www.tooloodr.com/). This documentation covers all the aspects of the TooLooDR.js as a standalone library and TooLooDR that comes as a WordPress plugin.

TooLooDR is available under the [GPLv3 license](https://www.gnu.org/licenses/gpl-3.0.en.html).

Documentation is copyright © 2021 [Marko Zivanovic](https://markozivanovic.com/).

For the full documentation, please visit [TooLooDR documentation website](https://tooloodr.com/documentation/index.html).

## Installation

You can get the latest version of TooLooDR.js from its [homepage],(https://tooloodr.com) or download them right here:

[Download the compressed, production TooLooDR 1.0.2 - 6.7kB](https://tooloodr.com/dist/TooLooDR.min.js)<br />
[Download the uncompressed, development TooLooDR 1.0.2 - 19.3kB](https://tooloodr.com/dist/TooLooDR.js)

You will want to use the first one most of the time. Use the second one if you want to extend the library, or you run into some problems you may wish to debug.

## Integration

TooLooDR.js can be integrated with plain JavaScript. The example below shows you how to load TooLooDR.js in your project.

### Script Tag

```html
<script src="path/to/tooloodr/dist/TooLooDRJ.min.js"></script>
<script>
    var myTooLooDR = new TooLooDR("#article", {...});
</script>
```

## Usage

TooLooDR.js can be used with plain JavaScript.

### Creating a TooLooDR article

To create a TooLooDR article, we need to instantiate the TooLooDR class. To do this, we need to pass it the id of the div element in which our TooLooDR ready text resides. Here's an example.

```html
<div id="myArticle">
  <p>
    [tl1]This is the most important part of the article[tl2], followed by the less important part[/tl2].
    [tl3]Now I'm just giving some details that are for those who really want to know more.[/tl3][/tl1]
  </p>
</div>
```

```javascript
var myTooLooDR = new TooLooDR("#myArticle");
```
