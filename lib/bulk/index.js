// cloudq bulk update api
// cloudq run couchdb views
var flatiron = require('flatiron'),
  request = require('request'),
  app = flatiron.app;

var cloudq = process.env.COUCH || 'http://localhost:5984/cloudq'

// cloudq web site
app.router.put('/bulk', function(){
  request.put(cloudq + '/_bulk_docs', { json: this.req.body }).pipe(this.res);
});