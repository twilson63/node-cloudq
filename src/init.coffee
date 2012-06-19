# require dependencies
request = require 'request'
fs = require 'fs'
pin = require 'linchpin'

db = ''
# create request sugar methods
get = request.defaults json: true
put = request.defaults method: 'put', json: true

# create database and views
module.exports = (couchdb, cb) ->
  db = couchdb
  # handle completion of init process
  pin.on 'COUCHDB:INIT:DONE', cb
  # start init process...
  pin.emit 'COUCHDB:INIT:START'

# start init process
pin.on 'COUCHDB:INIT:START', ->
  # Does CouchDb Exists?
  get db, (e, r, b) ->
    # Not Found 
    if b.error is 'not_found'
      # Create DB
      pin.emit 'COUCHDB:INIT:CREATEDB' 
    else
      # Otherwise reload couchdb views
      pin.emit 'COUCHDB:INIT:VIEWS' 

# Create Db
pin.on 'COUCHDB:INIT:CREATEDB', -> 
  put db, (e, r, b) ->
    pin.emit 'LOG/INFO', '\nCreated Database: ' + db
    # load couchdb views
    pin.emit 'COUCHDB:INIT:VIEWS' if b.ok is true

# Load Views...
pin.on 'COUCHDB:INIT:VIEWS', ->
  views = fs.readdirSync(__dirname + '/views')
  count = views.length
  done = (view) ->
    count -= 1
    pin.emit 'LOG/INFO', 'Created View: ' + view
    pin.emit 'COUCHDB:INIT:DONE' if count is 0

  reload view, done for view in views

# Load view from json file
reload = (view, result) -> 
  name = view.split('.')[0]
  json = JSON.parse(fs.readFileSync(__dirname + '/views/' + view))
  url = "#{db}/_design/#{name}"
  get url, (e, r, b) ->
    json._rev = b._rev if b._rev?
    put url, { json }, (e, r, b) -> result(name)

  