var flatiron = require('flatiron'),
  queue = require('queue'),
  app = flatiron.app;

app.use(flatiron.plugins.http);

//app.router.get('/', require('web'));

app.router.get('/api', require('api'));
app.router.get('/view', require('view'));
app.router.post('/bulk', require('bulk'));

app.router.get('/:queue', queue.get);
app.router.post('/:queue', queue.post);
app.router.del('/:queue/:id', queue.del);

app.start();