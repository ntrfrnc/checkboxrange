CheckboxRange
=============


Project Overview
----------------

jQuery plugin to select range of checkboxes by simply connect two checkboxes by drag&drop, touch two checkboxes (multitouch support) or click when holding shift key.  

**Version:** 0.4.0-alpha  
**Dependencies:** jQuery ≥ 1.7  
**Support:** Latest Mozilla Firefox, Google Chrome and IE9+.   

[SEE DEMO](https://pawlos.dev/checkboxrange)

Usage:
----------------

Here's an example of basic usage:

	$('.container').checkboxrange();


Options:
----------------

Option                | Values                              | Description
-----------------     | ----------------------------------- | -----------
`path:`               | `'any'⎮'vertical'⎮'horizontal'`     | // Choose aspect of checkboxes; default: `'any'`
`noStyle:`            | `false ⎮ true`                      | // Disable checkboxrange style mask for checkbox; default: `false`
`onTouchLabels:`      | `true ⎮ false`                      | // Show labels of touched checkbox above finger (for better UX); default: `true`
`onTouchLabelsLimit:` | `25`                                | // Maximum lenght of labels (number of characters) showed on touch; default: `25`
`lineOffsetTop:`      | `10`                                | // Top offset of bounding line origin in px; default: `10`
`lineOffsetLeft:`     | `10`                                | // Left offset of bounding line origin in px; default: `10`
`fireChangeEvent:`    | `false ⎮ true`                      | // Simulate change event when change checkbox state; default: `false`
`onSelectEnd:`        | `function () {}`                    | // Callback apllied after checkbboxes selection


License
----------------

CheckboxRange is released under the terms of the MIT license. See LICENSE file for details.


Credits
----------------

CheckboxRange is developed by Rafael Pawlos, [pawlos.dev](https://pawlos.dev)
