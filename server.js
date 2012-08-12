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
// init views
if(process.env.NODE_ENV === 'production') {
  initViews(cloudq, function(){ 
    console.log('reloaded views');
    app.start(3000); 
  });
} else { app.start(3000); }
