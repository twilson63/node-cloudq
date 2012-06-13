require(require('path').join(__dirname, 'lib'))(function(){
  var port = process.env.PORT || process.env.VMC_APP_PORT || 3000
  console.log('Cloudq listening on ' + port.toString())
});