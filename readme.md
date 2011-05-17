# node-cloudq Server

This is a cloudq server written in CoffeeScript and runs on NodeJs.

See [cloudq_protocol](http://github.com/twilson63/cloudq_protocol) for details.

## Technology Stack

* NodeJs
* CoffeeScript
* Meryl
* MongoSkin
* MongoDb

## Under Heavy Development

## Install

Currently, there is no installation instructions, but you should be able
to clone and run locally using:
    # run mongodb server
    cake bundle

    coffee app.coffee
    
## Test

    npm install jasmine-node
    jasmine-node specs --coffee
    
    
## Build Certificates

``` 
openssl genrsa -out  privatekey.pem 1024
openssl req -new -key privatekey.pem -out certrequest.csr
openssl x509 -req -in certrequest.csr -signkey privatekey.pem -out certificate.pem
```

