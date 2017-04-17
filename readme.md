# Sentry to Pagerduty Bridge

Whats the point in this then? The built in Pagerduty integration for Sentry
gives limited information in the Pagerduty event. This makes it painful when reviewing issues
via the Pagerduty mobile app. It mainly includes a one line summary and a link to Sentry.

The files in this repo allow you to use AWS API Gateway and a lambda function to send events
from Sentry to Pagerduty in a more useful (and easily customisable) format. The example includes
the full stack trace, tags and any user variables sent with the event.

It uses the Sentry webhook integration to send data to AWS API Gateway, then the uses the
Pagerduty v2 API to send data from the lambda function.

Before use you'll need to modify the lamdba function and swagger definition, as I've redacted
all the details specific to my environment such as keys and account numbers (denoted with 'xxxxx').
You'll be able to import the swagger definition to AWS API gateway and upload the the javascript
as a lamdba function.

You'll need to use the Sentry webhook integration to send data to the gateway url with two params:
```
https://xxxxx.execute-api.eu-west-1.amazonaws.com/dev/new-event?apiKey=xxxx&pagerdutyServiceKey=xxxxx
```
The 'apiKey' is a noddy way to authenticate the sentry request and must match that specified in
the lambda code. Sentry does not support an authorisation header to use any of the AWS API
gateway authentication features.
The 'pagerdutyServiceKey' determines which Pagerduty service the generated event will belong to. It's
passed to the Pagerduty api as the 'routing_key'.

The lambda function must be updated with your Pagerduty API key.

## Testing
I've included a sample Sentry event json that can be used with Postman to test that the API
Gateway is working. The sample data was created using the Java Sentry Raven logback appender version
7.6.

## Some dragons
The Sentry webhook documentation is sparse, and I'm guessing that the structure of the generated
event differs depending what was used to create it. In my case I used Sentry with Logback version 7.6,
but I guess the format will change for the newer version 8 API. Its probably different for Sentry
events generated with other technologies.