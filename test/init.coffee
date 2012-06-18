request = require 'request'
assert = require 'assert'
init = require('../lib/init')

describe 'init database and views', ->
  db = 'http://localhost:5984/cloudq_test_init'
  relax = request.defaults method: 'get', json: true
  dbIsValid = (b, done) ->
    assert b.db_name, 'cloudq_test_init'
    done()
  viewIsValid = (b, done) ->
    assert b.rows, []
    done()
  updateIsValid = (b, done) ->
    assert b._rev?, true
    done()

  before (done) -> 
    request.del db, -> init db, done
  it 'should create database', (done) ->
    relax db, (e, r, b) -> dbIsValid b, done
  it 'should create view queued', (done) ->
    relax db + '/_design/queued/_view/name', (e,r,b) -> viewIsValid b, done
  it 'should create view completed', (done) ->
    relax db + '/_design/completed/_view/all', (e,r,b) -> viewIsValid b, done
  it 'should create view queues', (done) ->
    relax db + '/_design/queues/_view/all', (e,r,b) -> viewIsValid b, done
  it 'should create update dequeue', (done) ->
    relax db + '/_design/dequeue', (e,r,b) -> updateIsValid b, done
  it 'should create update complete', (done) ->
    relax db + '/_design/complete', (e,r,b) -> updateIsValid b, done

  after (done) -> request.del db, done
  