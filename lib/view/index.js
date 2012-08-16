// cloudq run couchdb views
var flatiron = require('flatiron'),
  request = require('request'),
  app = flatiron.app;

var cloudq = process.env.COUCH || 'http://localhost:5984/cloudq'

// cloudq web site
app.router.get('/view/:name/:action', function(name, action){
  var self = this;
  request.get(cloudq + '/_design/' + name + '/_view/' + action, {json: true }, function(e,r,b) {
    self.res.json(b);
  });
});