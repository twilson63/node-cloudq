var flatiron = require('flatiron'),
  initViews = require('./lib/init'),
  app = flatiron.app;

app.use(flatiron.plugins.http);

// load modules
require('./lib/web');
require('./lib/view');
require('./lib/bulk');
require('./lib/queue');

var cloudq = process.env.COUCH || 'http://localhost:5984/cloudq'
var port = process.env.PORT || process.env.VMC_APP_PORT || 3000
// init views
if(process.env.NODE_ENV === 'production') {
  initViews(cloudq, function(){ 
    console.log('CLOUDQ: Reloaded Views...' + (new Date()).toString());
    app.start(port); 
  });
} else { app.start(port); }
