# cloudQ 

[![Build Status](https://secure.travis-ci.org/twilson63/node-cloudq.png)](http://travis-ci.org/twilson63/node-cloudq)

A http message/job queue that is easy to publish, consume and complete messages.

## Install from source

``` sh
git clone https://github.com/twilson63/node-cloudq.git
npm install .

# configure env vars
export COUCH=http://localhost:5984
export DB=cloudq
export TOKEN=foo
export SECRET=bar
export PORT=8000
export NEWRELIC_KEY=xkkk
export APP_NAME=cloudq 

npm run-script setup
npm start
```

## Install and Run Locally

First, you need to install couchdb, you can download couchdb at [http://couchdb.apache.org/](http://couchdb.apache.org/)

``` sh
npm install cloudq -g
export COUCH=http://localhost:5984
export DB=cloudq
export TOKEN=foo
export SECRET=bar
export PORT=8000
export NEWRELIC_KEY=xkkk
export APP_NAME=cloudq 

# run server

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
  },
  "priority": 100
}
```

### publish 

publishes the job to the queue named `send_mail`

``` sh
curl -XPUT -d '{ "job": { "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}]}}'
http://cloudq.example.com/send_mail
```

### consume 

consumes the next highest job in the queue

``` sh
curl http://cloudq.example.com/send_mail
#>{ "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}], "id": "1"}
```

### complete

``` sh
curl -XDELETE http://cloudq.example.com/send_mail/1
#>{ "status": "success"}
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

# Logging

CloudQ uses bunyan as the logger and returns a stream of json, but if you want to put it into a more common format, then you can use the `bunyan` command to pipe the json into a readable format.

```
npm install bunyan -g
cloudq | bunyan

```
Produces:

```
2013-11-05T22:01:23.911Z]  INFO: cloudq/4187 on thing-4.local:
    0: {
      "ok": true,
      "id": "_design/dequeue",
      "rev": "17-d66392bf5441a2cae9bf4c52700cfeff"
    }
    --
```

for a shorter format

```
cloudq | bunyan -o short`
```

# NewRelic

CloudQ is NewRelic Ready, simply supply an ENV Var for your New Relic key and you should be good to go.

```
NEWRELIC_KEY=XXXX cloudq | bunyan
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
echo 'require("cloudq/server");' >> server.js
jitsu databases create couch cloudq
jitsu env set COUCH http://xxxx263878962530.iriscouch.com:5984
jitsu env set DB cloudq
jitsu env set TOKEN foo
jitsu env set SECRET bar

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
echo 'web: ./node_modules/cloudq/bin/cloudq' >> Procfile
echo 'node_modules' >> .gitignore
git init
git add .
git commit -am "first commit"
heroku create
heroku config:add COUCH=http://mydb.iriscouch.com
heroku config:add DB=cloudq
heroku config:add TOKEN=foo
heroku config:add SECRET=bar

git push heroku master
```

## Tests

``` sh
npm test
```

## License

see LICENSE

## Contributing

### GOALS

1. ONLY THREE CORE API METHODS

* POST /queue - PUBLISH a JOB on the QUEUE
* GET /queue - CONSUME a JOB
* DELETE /queue/id - Mark JOB as Completed

### TODO

* tokens authorization
* create acl for queues, views, bulk updates

pull requests welcome
