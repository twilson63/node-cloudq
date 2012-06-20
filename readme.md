# cloudq server -> (relax)

[![Build Status](https://secure.travis-ci.org/twilson63/node-cloudq.png)](http://travis-ci.org/twilson63/node-cloudq)

A high performance/persistent http job queue that is easy to enqueue and dequeue messages in any language or platform.

Using CouchDb as its backend, cloudq allows you to relax when managing background jobs, simply queue your job, let your workers dequeue, process
and complete.

## Install and Run Locally

``` sh
# create your couchdb instance
npm install cloudq -g
export DB_URL=http://localhost:5984/cloudq
export ADMIN_URL=http://admin:pass@localhost:5984/cloudq
cloudq
```

## Usage

### job schema

``` json
{ "job":
  {
    "klass": "Mailer",
    "args": [{"to": "foo@email.com", "subject": "hello"}]
  }
}
```

### enqueue

``` sh
curl -XPUT -d '{ "job": { "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}]}}'
http://cloudq.example.com/send_mail
```

### dequeue

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

1. Create admin user in couchdb
2. Grant admin access to your couchdb documents
3. Your cloudq clients will need to auth with couchdb admin

Example:

``` sh
curl -XPOST -d '{ "job": { "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}]}}' http://admin:pass@cloudq.example.com/send_mail
```

---

# How to deploy to the cloud

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

1. ONLY THREE API METHODS

* POST - PUSH a JOB on the QUEUE
* GET - DEQUEUE a JOB
* DELETE - MARK JOB as Completed

2. Extendability should be external

* UI is in another repo cloudq-web

FEATURES to add

* Prioritize jobs (Jobs should be dequeued based on priority)
* Expiration of Jobs (Jobs should be purges after xx hours)

pull requests are welcome

