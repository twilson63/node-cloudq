var pin = require('linchpin');
require(require('path').join(__dirname, 'lib'))(function(){
  var port = process.env.PORT || process.env.VMC_APP_PORT || 3000;
  pin.emit('LOG/INFO', 'Cloudq listening on ' + port.toString());
});