# Linchpin

Event Driven Application Architecture Module

This module creates a global instance of an EventEmitter that can be
required by any module that would like to communicate with any other
module in the application.  This module provides the ability to create
loosely coupled modules or event application architecture.

Event Application Architecture is the process of creating self contained
modules that only communicate to other modules via messaging.  This
significantly reduces the rigid coupling that causes applications to
become hard to test and manage.



## Basic Usage

>module1.js

``` javascript
var pin = require('linchpin');

pin.on('foo', function() { console.log('you called foo.'); });
```

>module2.js

``` javascript
var pin = require('linchpin');

pin.emit('foo');
```

>main.js

``` javascript
require('module1');
require('module2');
```

>exec

``` sh
node main.js
#> You Called Foo
```

## Wildcard Support

``` javascript
var pin = require('linchpin');
pin.on('foo/*', function () { console.log('you called foo xxx'); });
pin.on('foo/bar/*', function () { console.log('you called foo bar xxx'); });
pin.on('foo/bar/baz', function () { console.log('you called foo bar baz'); });

pin.emit('foo/bar/baz');

```

## Install

``` sh
npm install linchpin
```

## Tests

``` sh
npm test
```

## License

SEE LICENSE

## How to contribute

* Check out Open Issues
* Post an Issue for a Feature
* Submit a Pull Request (Please Include Test Case)

## Credits

* Ryan Dahl creator of nodejs and the whole nodejs team.
* Addy Osman for his presentations
[videos](http://addyosmani.com/scalable-javascript-videos/)

