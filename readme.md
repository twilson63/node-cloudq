# cloudQ 

[![Build Status](https://secure.travis-ci.org/twilson63/node-cloudq.png)](http://travis-ci.org/twilson63/node-cloudq)

A http message/job queue that is easy to queue, reserve and complete messages.

## Install and Run Locally

First, you need to install couchdb, you can download couchdb at [http://couchdb.apache.org/](http://couchdb.apache.org/)

``` sh
npm install cloudq -g
export DB_URL=http://localhost:5984/cloudq
export ADMIN_URL=http://localhost:5984/cloudq
cloudq
```

## Usage

A job message queue server, allows your applications to push jobs to a queue, then
worker applications can watch the queue and request for a job, when the worker
receives the job, it does the work, then sends a complete message back to the server.  Each job as a pre-defined schema that consists of two attributes:

* klass
* args

The klass attribute is a string represents the name of object that you wish to invoke.
The args attribute is an array of parameters that you wish to provide to that objects perform method.

### job schema

``` json
{ "job":
  {
    "klass": "Mailer",
    "args": [{"to": "foo@email.com", "subject": "hello"}]
  }
}
```

### add to queue

``` sh
curl -XPUT -d '{ "job": { "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}]}}'
http://cloudq.example.com/send_mail
```

### reserve job

``` sh
curl http://cloudq.example.com/send_mail
#>{ "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}], "id": "1"}
```

### complete

``` sh
curl -XDELETE http://cloudq.example.com/send_mail/1
#>{ "status": "success"}
```

### view

With the view api you can access any view in the couchdb database:

``` sh
curl http://token:secret@localhost:3000/view/:name
```

### bulk

With the bulk api you can send a bulk update to couchdb

``` sh
curl -XPUT http://token:secret@localhost:3000/bulk \
-d '[{"_id":"1","_rev":"1", "_deleted": true}]' \
-H 'Content-Type: application/json'
```

# Authorization

Currently authorization is done by environment varables:

TOKEN and SECRET

Theses env variables should match with basic authentication, per request:

``` sh
curl http://token:secret@localhost:3000/foo
``` 

Test Successful Authentication:

``` sh
curl -XPOST -d '{ "job": { "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}]}}' http://token:secret@cloudq.example.com/send_mail
```

---

# Deploy

## Deploy to nodejitsu

``` sh
mkdir mycloudq
cd mycloudq
npm init
# edit package.json and set "node": "~0.6.x"
npm install cloudq --save
echo 'require("cloudq")();' >> server.js
jitsu databases create couch cloudq
jitsu env set DB_URL http://xxxx263878962530.iriscouch.com:5984/cloudq
jitsu deploy
```

## Deploy to heroku
``` sh
# create an iriscouch account
mkdir mycloudq
cd mycloudq
npm init
# edit package.json and set "node": "~0.6.x"
npm install cloudq --save
echo 'require("cloudq")();' >> server.js
echo 'web: node server.js' >> Procfile
echo 'node_modules' >> .gitignore
git init
git add .
git commit -am "first commit"
heroku create --stack cedar
heroku config:add DB_URL=http://mydb.iriscouch.com/cloudq
heroku config:add ADMIN_URL=http://admin:pass@mydb.iriscouch.com/cloudq
git push heroku master
```

## Deploy to cloudfoundry

``` sh
# create an iriscouch account
mkdir mycloudq
cd mycloudq
npm init
# edit package.json and set "node": "~0.6.x"
npm install cloudq --save
echo 'require("cloudq")();' >> server.js
vmc push mycloudq --no-start
vmc env-add DB_URL=http://mydb.iriscouch.com/cloudq
vmc env-add ADMIN_URL=http://admin:pass@mydb.iriscouch.com/cloudq

```

## Tests

``` sh
mocha
```

## License

see LICENSE

## Contributing

GOALS

1. ONLY THREE CORE API METHODS

* POST /queue - PUSH a JOB on the QUEUE
* GET /queue - RESERVE a JOB
* DELETE /queue/id - MARK JOB as Completed

* view api
* bulk update api
* prioritization
* expiration job module

TODO

* tokens authorization
* create acl for queues, views, bulk updates

