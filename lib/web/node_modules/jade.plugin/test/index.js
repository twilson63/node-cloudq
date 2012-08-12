// simple test framework
function assertEqual(a, b) {
  if(a !== b)  {
    throw new Error('assert equal failed ' + a.toString() + ' does not equal ' + b.toString());
  };
  return true;
}

var flatiron = require('flatiron'),
  request = require('request'),
  app = flatiron.app;

app.use(flatiron.plugins.http);
app.use(require('../').plugin, { dir: __dirname, ext: '.jade'});

app.router.get('/', function(){
  app.render(this.res, 'index', { title: 'foo' });
});
app.start(3000);

request('http://localhost:3000', function(e,r,b){
  assertEqual('\n<h1>foo</h1>', b);
  process.exit(0);
});