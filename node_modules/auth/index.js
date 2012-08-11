// cloudq bulk update api
// cloudq run couchdb views
var flatiron = require('flatiron'),
  request = require('request'),
  //auth = require('http-auth'),
  app = flatiron.app;

var cloudq = process.env.COUCH || 'http://localhost:5984/cloudq'
var users = ['foo:1234','bar:1234']
var usersMeta = [
  { username: "foo", password: '1234', bulk: true, views: ['expired'], queues: [] },
  { username: "bar", password: '1234', bulk: false, views: [], queues: [] }
]
  

// get all users
// load users auth array
// load users acl

app.http.before = [
  function(req, res){
    
    // validate token
    res.emit('next');
  }
]

// cloudq web site
app.router.post('/auth/new', function(){
  var self = this;
  // validate admin
  // create new token with acl
  // { username: "foo", password: '1234, bulk: true, views: ['expired'], queues: [] } - has access to every queue
  // { username: "bar", password: '1234', bulk: false, views: [], queues: [] } - has access to every view, queue, but can't bulk update

  var urlObj = url.parse(cloudq);
  urlObj.pathname = "/_users/" + this.req.body.token;
  usersdb = url.format(urlObj);
  request.put(usersdb, {json: this.req.body},function(e,r,b){
     if(e) {
       self.res.writeHead(500, 'Content-Type': 'application/json');
       self.res.end(JSON.stringify({status: 'error'}));
     } else {
       self.res.writeHead(200, 'Content-Type': 'application/json');
       self.res.end(JSON.stringify({status: 'success'}));
     }
  });
});
