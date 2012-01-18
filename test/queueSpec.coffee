queue = require '../lib/queue'
nock = require 'nock'

# currently requires couch to locally be running....
describe 'queue', ->
  nock("localhost").get("/cloudq/_design/jobs").reply 200, "{\"_id\":\"_design/jobs\",\"_rev\":\"15-21853316faa612dbee01653c27adc5ac\",\"updates\":{\"dequeue\":\"function (doc, req) {\\n            var message;\\n            doc.queue_state = req.query.state;\\n            message = \\\"set queue_state to \\\" + doc.queue_state;\\n            return [doc, message];\\n          }\"},\"views\":{\"queued\":{\"map\":\"function (doc) {\\n              if (doc.queue_state === 'queued') emit(doc.queue, doc);\\n              return true;\\n            }\"},\"reserved\":{\"map\":\"function (doc) {\\n              if (doc.queue_state === 'reserved') emit(doc.queue, doc);\\n              return true;\\n            }\"},\"groups\":{\"map\":\"function (doc) {\\n              emit(\\\"\\\" + doc.queue + \\\"-\\\" + doc.queue_state, 1);\\n              return true;\\n            }\",\"reduce\":\"function (keys, values) {\\n              return sum(values);\\n            }\"}}}\n",
    server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
    etag: "\"15-21853316faa612dbee01653c27adc5ac\""
    date: "Wed, 18 Jan 2012 03:07:43 GMT"
    "content-type": "application/json"
    "content-length": "851"
    "cache-control": "must-revalidate"

  nock("localhost").post("/cloudq", "{\"klass\":\"foo\",\"args\":[],\"queue\":\"foo\",\"queue_state\":\"queued\",\"inserted_at\":\"2012-01-18T03:07:43.688Z\"}").reply 201, "{\"ok\":true,\"id\":\"eb0b481e370a4688831d9bf97f0a78b9\",\"rev\":\"1-d0ca16f1dddb17ef609b31a8c8649b55\"}\n",
    server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
    location: "http://localhost:5984/cloudq/eb0b481e370a4688831d9bf97f0a78b9"
    date: "Wed, 18 Jan 2012 03:07:43 GMT"
    "content-type": "application/json"
    "content-length": "95"
    "cache-control": "must-revalidate"

  nock("localhost").put("/cloudq/_design/jobs", "{\"_id\":\"_design/jobs\",\"_rev\":\"16-454990bd9abc6de6301f93f58b07dfa9\",\"updates\":{\"dequeue\":\"function(doc, req) { doc.queue_state = req.query.state; return [doc, \\\"queue state changed\\\"]; }\"},\"views\":{\"queued\":{\"map\":\"function(doc) { if(doc.queue_state === \\\"queued\\\") { emit(doc.queue, doc); } return true; }\"},\"reserved\":{\"map\":\"function(doc) { if(doc.queue_state === \\\"reserved\\\") { emit(doc.queue, doc); } return true; }\"},\"groups\":{\"map\":\"function(doc) { emit(doc.queue + '-' + doc.queue_state, 1); return true; }\",\"reduce\":\"function(keys, values) { return sum(values); }\"}},\"language\":\"javascript\"}").reply 201, "{\"ok\":true,\"id\":\"_design/jobs\",\"rev\":\"17-557d5af97b88732519c8c04cc66dcc20\"}\n",
    server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
    location: "http://localhost:5984/cloudq/_design/jobs"
    etag: "\"17-557d5af97b88732519c8c04cc66dcc20\""
    date: "Wed, 18 Jan 2012 04:58:49 GMT"
    "content-type": "application/json"
    "content-length": "76"
    "cache-control": "must-revalidate"

  nock("localhost").get("/cloudq/_design/jobs/_view/queued?key=%22foo%22&limit=1").reply 200, "{\"total_rows\":157,\"offset\":0,\"rows\":[\r\n{\"id\":\"eb0b481e370a4688831d9bf97f0340e8\",\"key\":\"foo\",\"value\":{\"_id\":\"eb0b481e370a4688831d9bf97f0340e8\",\"_rev\":\"1-d0e229ff0701f1a96d84a2cded7bf4e0\",\"klass\":\"foo\",\"args\":[],\"queue\":\"foo\",\"queue_state\":\"queued\",\"inserted_at\":\"2012-01-17T02:42:24.074Z\"}}\r\n]}\n",
    "transfer-encoding": "chunked"
    server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
    etag: "\"BT620NQOWSZAZNG4U0UMBHCAH\""
    date: "Wed, 18 Jan 2012 04:58:50 GMT"
    "content-type": "application/json"
    "cache-control": "must-revalidate"

  nock("localhost").put("/cloudq/_design/jobs/_update/dequeue/eb0b481e370a4688831d9bf97f0340e8?state=reserved").reply 201, "queue state changed",
    "x-couch-update-newrev": "2-37ee98ac9bb4c0b6009bb8e5b5001a08"
    server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
    date: "Wed, 18 Jan 2012 04:58:50 GMT"
    "content-type": "text/html; charset=utf-8"
    "content-length": "19"

  nock("localhost").get("/cloudq/_design/jobs/_view/reserved?key=%22bar11%22").reply 200, "{\"total_rows\":1,\"offset\":0,\"rows\":[\r\n{\"id\":\"eb0b481e370a4688831d9bf97f024896\",\"key\":\"bar11\",\"value\":{\"_id\":\"eb0b481e370a4688831d9bf97f024896\",\"_rev\":\"4-1ef4d19ada2570aceea6df0cf15fc602\",\"klass\":\"foo\",\"args\":[],\"queue\":\"bar11\",\"queue_state\":\"reserved\",\"inserted_at\":\"2012-01-17T02:40:08.428Z\"}}]}"

  nock("localhost").get("/cloudq/_design/jobs/_view/groups?group=true").reply 200, "{\"rows\":[\r\n{\"key\":\"foo-queued\",\"value\":12},\r\n{\"key\":\"foo-reserved\",\"value\":36},\r\n{\"key\":\"foobar-queued\",\"value\":4},\r\n{\"key\":\"foobar-reserved\",\"value\":5},\r\n{\"key\":\"test-queued\",\"value\":4},\r\n{\"key\":\"test2-queued\",\"value\":132},\r\n{\"key\":\"test2-reserved\",\"value\":2},\r\n{\"key\":\"undefined-undefined\",\"value\":2}\r\n]}\n",
    "transfer-encoding": "chunked"
    server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
    etag: "\"BUBZEVGGS2IOCF1JHKK591VT6\""
    date: "Wed, 18 Jan 2012 05:25:02 GMT"
    "content-type": "application/json"
    "cache-control": "must-revalidate"

  queue.init()

  it 'should queue job', (done) ->
    queue.queueJob 'foo', klass: 'foo', args: [], (err, resp) -> 
      resp.should.equal true
      done()
  it 'should reserve job', (done) ->
    queue.reserveJob 'foo', (err, resp) ->
      resp.klass.should.equal 'foo'
      done()
  # it 'should return empty if no jobs', (done) ->
  #   queue.reserveJob 'nojob', (err, resp) ->
  #     done()
  it 'should remove all reserved jobs', (done) ->
    queue.removeAll 'bar11', (err, resp) ->
      resp.ok.should.equal true
      done()
  it 'should group jobs', (done) ->
    queue.groupJobs (err, resp) ->
      resp.rows.length.should.equal 8
      done()
    