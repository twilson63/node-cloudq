var flatiron = require('flatiron'),
  app = flatiron.app;

app.use(flatiron.plugins.http);

// load modules
require('web');
require('view');
require('bulk');
require('queue');

app.start(3000);