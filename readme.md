# Sentry to Pagerduty Bridge

Whats the point in this then? The built in Pagerduty integration for Sentry
gives limited information in the Pagerduty event. This makes it painful when reviewing issues
via the Pagerduty mobile app. It mainly includes a one line summary and a link to Sentry.

The files in this repo allow you to use AWS API Gateway and a lambda function to send events
from Sentry to Pagerduty in a more useful (and easily customisable) format.

It uses the Sentry webhook integration to send data to AWS API Gateway, then the uses the
Pagerduty v2 API to send data from the lambda function.

Before use you'll need to modify the lamdba function and swagger definition, as i've redacted
all the details specific to my environment such as keys and account numbers (denoted with 'xxxxx').
You'll be able to import the swagger definition to AWS API gateway and upload the the javascript
as a lamdba function.

You'll need to use the Sentry webhook integration to send data to the gateway url with two params:
```
https://xxxxx.execute-api.eu-west-1.amazonaws.com/dev/new-event?apiKey=xxxx&pagerdutyServiceKey=xxxxx
```
The 'apiKey' is a noddy why to authenticate the sentry request and must match that specified in
the lambda code. Sentry does not support any kind of authorisation header to use any of the AWS API
gateway authentication features.
The 'pagerdutyServiceKey' determines which Pagerduty service the generated event will belong to. Its
passed to the Pagerduty api as the 'routing_key'.

The lambda function must be updated with your Pagerduty API key.