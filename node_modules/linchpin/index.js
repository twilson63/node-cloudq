var EventEmitter2 = require('eventemitter2').EventEmitter2, _ref;

var util = require('util');

function Linchpin() {
  EventEmitter2.call(this, {
    wildcard: true,
    delimiter: '/',
    maxListeners: 0
  }); 
}

util.inherits(Linchpin, EventEmitter2);

module.exports = (_ref = global.linchpin) != null ? _ref : new Linchpin();
