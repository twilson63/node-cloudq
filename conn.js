var cf = require('cf-runtime');
var conn = process.env.COUCH || 'http://localhost:5984';
var url = require('url');

module.exports = function() {
  if (cf.CloudApp.runningInCloud) {
    var config = cf.CloudApp.serviceProps['couchdb-eirenerx'];
    conn = url.format({
      host: config.host,
      auth: [config.username, config.password].join(':'),
      protocol: 'https'
    });
  }
  return conn;
};