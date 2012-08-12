var flatiron = require('flatiron'),
  request = require('request'),
  ecstatic = require('ecstatic'),
  connect = require('connect'),
  jade = require('jade.plugin'),
  app = flatiron.app;

var cloudq = process.env.COUCH || 'http://localhost:5984/cloudq'

// var users = [];
// // load users
// request(cloudq + '/_design/users/_view/active', {json: true}, function(e,r,b){
//   users = b.rows;
// });


app.use(jade.plugin, { dir: __dirname + '/views'});

app.http.before = [
  ecstatic(__dirname + '/public', { autoIndex: false}),
  function(req, res) {
    req.originalUrl = req.url;
    res.emit('next');
  },
  connect.cookieParser(),
  connect.session({secret: 'foobar'}),
  function(req, res) {
    if(!req.session.user && /admin/.test(req.url)){
      app.redirect(res, '/login');
    } else {
      res.emit('next');
    }
  },
  function(req,res) {
    var header=req.headers['authorization']||'',        // get the header
      token=header.split(/\s+/).pop()||'',            // and the encoded auth token
      auth=new Buffer(token, 'base64').toString(),    // convert from base64
      parts=auth.split(/:/),                          // split on colon
      username=parts[0],
      password=parts[1];

    if(req.url !== '/' && process.env.TOKEN) {
      if(process.env.TOKEN === username && process.env.SECRET === password){
        res.emit('next');
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json'});
        res.end('Not Authorized.')
      }
    } else {
      res.emit('next');
    }
  }
];

// cloudq web site
app.router.get('/', function(){
  var self = this;
  request(cloudq + '/_design/queues/_view/all?group=true', {json: true}, function(e,r,b){
    var queues = {};
    for(var i = 0; i < b.rows.length; i++) {
      var key = b.rows[i].key.split('-'),
        queue = key[0],
        state = key[1];
      if(!queues[queue]) { queues[queue] = {}}
      queues[queue][state] = b.rows[i].value;
    }
    app.render(self.res, 'index', { title: 'foo', queues: queues, user: null } );    
  });
});

app.router.get('/admin', function(){
  app.render(this.res, 'admin', { user: this.req.session.user });
});

app.router.get('/login', function(){
  app.render(this.res, 'login', { user: null });
});

app.router.get('/logout', function(){
  this.req.session.user = null;
  app.redirect(this.res, '/');
});

app.router.post('/sessions', function(){
  var data = this.req.body;
  if(data.username === 'admin' && data.password === 'admin'){
    this.req.session.user = data;
    app.redirect(this.res, '/admin');
  }
});
