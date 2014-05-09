var http = require('http');
var Primus = require('primus');
var nock = require('nock');
var assert = require('assert');
var format = require('util').format;

var ip = 'localhost';
var port = 5000;


process.env.TOKEN = 'A6JXsEdzD_y4_UqtAAAA';
process.env.SECRET = 'A6JXsEdzD_y4_UqtAAAA';
process.env.COUCH = 'http://localhost:5984';

// launch cloudq server
require('../app').listen(port);

// couchdb
// PUBLISH
nock(process.env.COUCH + '/cloudq')
  .post('/cloudq')
  .reply(201, {ok: true});

// CONSUME
nock(process.env.COUCH)
 .get('/cloudq/_design/queue/_view/next?startkey=%5B%22foo%22%2C1%5D&endkey=%5B%22foo%22%2C100%5D&limit=1')
 .reply(200, {rows: [{id: 1, key: ["foo", 1], value: { klass: "foo", args: ["bar"]}}]});

nock(process.env.COUCH)
 .put('/cloudq/_design/dequeue/_update/id/1')
 .reply(201, 'success');

// COMPLETE
 nock(process.env.COUCH)
 .put('/cloudq/_design/complete/_update/id/d23bf9199f0b7b171d2be391cf01d954')
 .reply(200, 'success');


describe('Cloudq#Websockets', function () {
  this.timeout(0);

   var primus;

  before(function (done) {
    var url = format('http://%s:%s@%s:%d', process.env.TOKEN, process.env.SECRET, ip, port);
    var Socket = Primus.createSocket({parser: 'JSON', pathname: '/cloudq'});
    primus = new Socket(url);

    primus.on('data', function (data) {
      assert(data.ok || data.status);
    });

    primus.on('open', function () {
      assert.ok(true);
      done();
    });

    primus.on('error', function (err) {
      assert.ifError(err);
      done();
    });
  });


  it('should publish a job successfully and return ok', function (done) {
    var publish = {
      queue:'foo',
      op:'PUBLISH',
      job: {
        job: {
          klass: 'Mailer',
          args: [{
            to: 'hello@world.com',
            subject: 'hello world'
          }]
        }
      }
    };

    primus.write(publish);
    setTimeout(done, 100);
  });


  it('should consume a job successfully and return ok', function (done) {
    var consume = {
      queue:'foo',
      op:'CONSUME'
    };

    primus.write(consume);
    setTimeout(done, 500);
  });


  it('should close a job successfully and return ok', function (done) {
    var complete = {
      op:'COMPLETE',
      id: 'd23bf9199f0b7b171d2be391cf01d954'
    };

    primus.write(complete);
    setTimeout(done, 100);
  });
});
