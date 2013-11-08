var nano = require('nano')('http://ec2-54-219-14-205.us-west-1.compute.amazonaws.com:5984');
var db = nano.use('eirenerx-staging');
var _ = require('underscore');

_.times(100, function() {
  db.view('queued', 'name', {key: 'co_patient', limit: 1000}, function(e,b) {
    var docs = _(b.rows).chain().pluck('value').map(function(doc) {
      doc._deleted = true;
      return doc;
    }).value();
    //console.dir(docs);
    db.bulk({docs: docs}, function(e,b,h) {
      console.dir(h);
    });
  });  
});
