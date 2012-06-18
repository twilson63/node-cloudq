request = require 'request'
fs = require 'fs'
pin = require 'linchpin'

db = 'http://localhost:5984/foobar'
get = request.defaults json: true
put = request.defaults method: 'put', json: true

# create database and views
module.exports = (couchdb, cb) ->
  db = couchdb
  pin.on 'COUCHDB:INIT:DONE', cb
  pin.emit 'COUCHDB:INIT:START'

pin.on 'COUCHDB:INIT:START', -> 
  console.log db
  get db, (e, r, b) ->
    if b.error is 'not_found'
      pin.emit 'COUCHDB:INIT:CREATEDB' 
    else
      pin.emit 'COUCHDB:INIT:VIEWS' 

pin.on 'COUCHDB:INIT:CREATEDB', -> 
  put db, (e, r, b) ->
    console.log 'Created Database: ' + db
    pin.emit 'COUCHDB:INIT:VIEWS' if b.ok is true

# Views...
pin.on 'COUCHDB:INIT:VIEWS', ->
  views = fs.readdirSync(__dirname + '/views')
  count = views.length
  done = (view) ->
    console.log 'Created View: ' + view
    count = count - 1
    pin.emit 'COUCHDB:INIT:DONE' if count is 0

  res = (view) -> done(view)

  reload view, res for view in views

reload = (view, res) -> 
  name = view.split('.')[0]
  json = fs.createReadStream(__dirname + '/views/' + view)
  json.pipe put("#{db}/_design/#{name}", -> res(name))

  