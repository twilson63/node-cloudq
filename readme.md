# cloudq

![CloudQ](http://cloudq.s3.amazonaws.com/cloudq.png)

A high performance/persistent http job queue that is easy to enqueue and dequeue messages in any language or platform.

### enqueue

``` sh
curl -XPOST -d '{ "job": { "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}]}}' http://cloudq.example.com/send_mail
```

### dequeue

``` sh
curl http://cloudq.example.com/send_mail
#>{ "job": { "klass": "Mailer", "args": [{"to": "foo@email.com", "subject": "hello"}]}}
```



