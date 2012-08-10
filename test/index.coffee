request = require 'request'
assert = require 'assert'
nock = require('nock')

# nock("http://localhost:5984").get("/cloudq").reply 200, "{\"db_name\":\"cloudq2\",\"doc_count\":5,\"doc_del_count\":0,\"update_seq\":45,\"purge_seq\":0,\"compact_running\":false,\"disk_size\":53337,\"instance_start_time\":\"1340072087126105\",\"disk_format_version\":5,\"committed_update_seq\":45}\n",
#   server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
#   date: "Tue, 19 Jun 2012 02:25:09 GMT"
#   "content-type": "application/json"
#   "content-length": "217"
#   "cache-control": "must-revalidate"
# 
# nock("http://localhost:5984").get("/cloudq/_design/complete").reply 200
# nock("http://localhost:5984").get("/cloudq/_design/completed").reply 200
# nock("http://localhost:5984").get("/cloudq/_design/dequeue").reply 200
# nock("http://localhost:5984").get("/cloudq/_design/queued").reply 200
# nock("http://localhost:5984").get("/cloudq/_design/queues").reply 200
# 
# nock("http://localhost:5984").filteringRequestBody( -> '*').put("/cloudq/_design/complete", "*").reply 200
# nock("http://localhost:5984").filteringRequestBody( -> '*').put("/cloudq/_design/completed", "*").reply 200
# nock("http://localhost:5984").filteringRequestBody( -> '*').put("/cloudq/_design/dequeue", "*").reply 200
# nock("http://localhost:5984").filteringRequestBody( -> '*').put("/cloudq/_design/queued", "*").reply 200
# nock("http://localhost:5984").filteringRequestBody( -> '*').put("/cloudq/_design/queues", "*").reply 200
# 
# nock("http://localhost:5984").get("/cloudq/foo").reply 200, "{\"status\":\"empty\"}",
#   "content-type": "application/json"
#   connection: "keep-alive"
#   "transfer-encoding": "chunked"
# 
# nock("http://localhost:5984").filteringRequestBody( -> '*').post("/cloudq", "*").reply 201, "{\"ok\":true,\"id\":\"9166ef4c39ef55e154f22990ba050140\",\"rev\":\"1-f5708c3521e9fb431e8b34807b650559\"}\n",
#   server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
#   location: "http://localhost:5984/cloudq/9166ef4c39ef55e154f22990ba050140"
#   date: "Tue, 19 Jun 2012 02:25:09 GMT"
#   "content-type": "application/json"
#   "content-length": "95"
#   "cache-control": "must-revalidate"
# 
# nock("http://localhost:5984").get("/cloudq/_design/queued/_view/name?key=%22cloudq%22&limit=1").reply 200, "{\"total_rows\":1,\"offset\":0,\"rows\":[\r\n{\"id\":\"9166ef4c39ef55e154f22990ba050140\",\"key\":\"cloudq2\",\"value\":{\"_id\":\"9166ef4c39ef55e154f22990ba050140\",\"_rev\":\"1-f5708c3521e9fb431e8b34807b650559\",\"job\":{\"klass\":\"foo\",\"args\":[\"bar\",\"baz\"]},\"queue\":\"cloudq2\",\"queue_state\":\"queued\",\"priority\":1,\"expires_in\":\"2012-06-20T02:25:09.765Z\"}}\r\n]}\n",
#   "transfer-encoding": "chunked"
#   server: "CouchDB/1.1.0 (Erlang OTP/R14B01)"
#   etag: "\"AAX099MKENLSMY4K1EDHZPE6Y\""
#   date: "Tue, 19 Jun 2012 02:25:09 GMT"
#   "content-type": "application/json"
#   "cache-control": "must-revalidate"
# 
# nock('http://localhost:5984')
#   .put('/cloudq/_design/dequeue/_update/id/9166ef4c39ef55e154f22990ba050140')
#   .reply(201, "job reserved", { 'x-couch-update-newrev': '2-3bc68e13e4e60e4050aedfad6f95c443',
#   server: 'CouchDB/1.1.0 (Erlang OTP/R14B01)',
#   date: 'Tue, 19 Jun 2012 02:25:09 GMT',
#   'content-type': 'text/html; charset=utf-8',
#   'content-length': '12' })
# 
# nock("http://localhost:5984").get("/cloudq/foo").reply 200, "{\"klass\":\"foo\",\"args\":[\"bar\",\"baz\"],\"id\":\"9166ef4c39ef55e154f22990ba050140\"}",
#   "content-type": "application/json"
#   connection: "keep-alive"
#   "transfer-encoding": "chunked"
#   
# nock("http://localhost:5984").filteringRequestBody( -> '*').put('/cloudq/_design/complete/_update/id/foo', '*').reply 201, "job completed", 
#   'x-couch-update-newrev': '2-3bc68e13e4e60e4050aedfad6f95c443'
#   server: 'CouchDB/1.1.0 (Erlang OTP/R14B01)'
#   date: 'Tue, 19 Jun 2012 02:25:09 GMT'
#   'content-type': 'text/html; charset=utf-8'
#   'content-length': '12'

describe 'happy path', ->
  server = 'http://localhost:3000'
  queue = server + '/foo'
  id = ""

  #before (done) -> require('../lib')(done)
  before (done) ->
    require('../server')
    done()
  it 'should queue job', (done) ->
    request server + '/foo', json: true, (e,r,b) ->
      assert(b.status,'empty')
      request.post server + '/foo', { json: { job: { klass: 'foo', args: ["bar","baz"] } }}, (err, r, b) ->
        done()
    # request.post uri: queue, json: { job: { klass: 'foo', args: ["bar","baz"] } },
    #   (err, r, b) ->
    #     assert(b.ok, true)
    #done()
  # it 'should dequeue job', (done) ->
  #   request.get queue, { json: true }, (err, r, b) ->
  #       assert(b.id?, true)
  #       id = b.id
  #       done()
  # it 'should complete job', (done) ->
  #   request.del { uri: queue + '/' + id, json: true}, (err, r, b) ->
  #     assert b.status, 'complete'
  #     done()
