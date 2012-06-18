request = require 'request'
fs = require 'fs'
pin = require 'linchpin'

# create database and views
module.exports = (couchdb, cb) ->
  request couchdb, json: true, (e, r, b) ->
    if b.error is 'not_found'
      pin.emit 'COUCHDB:INIT:CREATEDB', couchdb 
    else
      pin.emit 'COUCHDB:INIT:VIEWS', couchdb 
  pin.on 'COUCHDB:INIT:DONE', cb

pin.on 'COUCHDB:INIT:CREATEDB', (couchdb) -> 
  request.put couchdb, json: true, (e, r, b) ->
    console.log 'Created Database: ' + couchdb
    pin.emit('COUCHDB:INIT:VIEWS', couchdb) if b.ok is true

# Views...
pin.on 'COUCHDB:INIT:VIEWS', (couchdb) ->
  views = fs.readdirSync(__dirname + '/views')
  count = views.length
  done = (view) ->
    console.log 'Created View: ' + view
    count = count - 1
    pin.emit 'COUCHDB:INIT:DONE' if count is 0

  res = (view) -> done(view)

  reload couchdb, view, res for view in views

reload = (couchdb, view, cb) -> 
  name = view.split('.')[0]
  json = fs.createReadStream(__dirname + '/views/' + view)
  json.pipe request.put(couchdb + '/_design/' + name, json: true, -> cb(name))

  