# cloudq server -> (relax)

A high performance/persistent http job queue that is easy to enqueue and dequeue messages in any language or platform.

Using CouchDb as its backend, cloudq allows you to relax when managing background jobs, simply queue your job, let your workers dequeue, process
and complete.

## Install and Run Locally

``` sh
# create your couchdb instance
npm install cloudq -g
export DB_URL=http://localhost:5984/cloudq
cloudq
```

## Usage

### enqueue

``` sh
curl -XPOST -d '{ "job": { "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}]}}'
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

## Deploy to heroku
```
# create an iriscouch account
mkdir mycloudq
cd mycloudq
npm init
# edit package.json and set "node": "~0.6.x"
npm install cloudq --save
echo 'require("cloudq")(function(){ console.log("cloudq running...")});' >> server.js
echo 'web: node server.js' >> Procfile
echo 'node_modules' >> .gitignore
git init
git add .
git commit -am "first commit"
heroku create --stack cedar
heroku config:add DB_URL=http://mydb.iriscouch.com/cloudq
git push heroku master
```

## Deploy to cloudfoundry

```
# create an iriscouch account
mkdir mycloudq
cd mycloudq
npm init
# edit package.json and set "node": "~0.6.x"
npm install cloudq --save
echo 'require("cloudq")(function(){ console.log("cloudq running...")});' >> server.js
vmc push mycloudq --no-start
vmc env-add DB_URL=http://mydb.iriscouch.com/cloudq
```
