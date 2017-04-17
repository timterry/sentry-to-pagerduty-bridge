'use strict';
var https = require('https');

var PAGERDUTY_API_KEY = 'xxxxx';
var API_KEY = 'xxxxxx'

function convertToPagerdutyEvent(sentryData, pagerdutyServiceKey){
    var pagerdutyData = {};
    pagerdutyData.client = 'Sentry'
    pagerdutyData.client_url = sentryData.url;
    pagerdutyData.event_action = 'trigger';
    pagerdutyData.routing_key = pagerdutyServiceKey;
    
    var payload = {};
    var metadata = sentryData.event.metadata;
    payload.summary = sentryData.project_name + ' - ' + metadata.type + ': '+metadata.value;
    payload.source = sentryData.event.extra.HOSTNAME;
    payload.severity = 'warning';
    var epocDate = sentryData.event.received * 1000;
    var d = new Date(epocDate);
    payload.timestamp = d.toISOString();
    payload.component = 'Application';
    payload.group = sentryData.project_name;
    payload.class = 'Unexpected Exception';
    
    var customDetails = {};
    var tags = sentryData.event.tags;
    var pagerdutyTags = {};
    for(var i = 0; i < tags.length; i++){
      var key = tags[i][0];
      var value = tags[i][1];
      pagerdutyTags[key] = value;
    }
    customDetails.tags = pagerdutyTags;
    customDetails.variables = sentryData.event.extra;
    
    var stacktraces = sentryData.event['sentry.interfaces.Exception'].values;
    var stStr = '';
    for(var k = (stacktraces.length-1); k >= 0; k--){
      var stacktrace = stacktraces[k];
      if(k < stacktraces.length-1){
        stStr += '\nCaused by\n';
      }
      stStr += stacktrace.module + stacktrace.type + ': ' + stacktrace.value + '\n';
      var frames = stacktrace.stacktrace.frames;
      for(var j = (frames.length-1); j >= 0; j--){
        var frame = frames[j];  
        stStr += frame.module+'.'+frame.function+' ('+frame.filename+':'+frame.lineno+')\n' 
      }
      
    }
    customDetails.stacktrace = stStr;
    payload.custom_details = customDetails;
    
    pagerdutyData.payload = payload;
    return pagerdutyData;
}

function sendPagerdutyEvent(pagerdutyData){
    var success = true;
    var pagerdutyJson = JSON.stringify(pagerdutyData);
    console.log(pagerdutyJson);
    var options = {
      hostname: 'events.pagerduty.com',
      port: 443,
      path: '/v2/enqueue',
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token token=' + PAGERDUTY_API_KEY
      }
    };
    console.log('Sending to pagerduty...');
    var req = https.request(options, function(res) {
      if(res.statusCode != 202){
          success = false;
          console.log('Error with pagerduty request');
      }
      console.log('Status: ' + res.statusCode);
      console.log('Headers: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      res.on('data', function (body) {
        console.log('Body: ' + body);
      });
    });
    req.on('error', function(e) {
      console.log('problem with pagerduty request: ' + e.message);
    });
    // write data to request body
    req.write(pagerdutyJson);
    req.end();
    return success;
}

function validate (param){
    return (param !== undefined && param !== null && param !== "");
}
 
exports.handler = function(event, context, callback) {
    var responseCode = 400;
    var responseBody = {
        message: "ERROR",
    };
    console.log("request: " + JSON.stringify(event));
    if (event.queryStringParameters !== null && event.queryStringParameters !== undefined) {
        
        var apiKey = event.queryStringParameters.apiKey;
        var pagerdutyServiceKey = event.queryStringParameters.pagerdutyServiceKey;
        
        if(validate(apiKey) && validate(pagerdutyServiceKey) && validate(event.body) && apiKey == API_KEY){
            var sentryData = JSON.parse(event.body);
            var pagerdutyData = convertToPagerdutyEvent(sentryData, pagerdutyServiceKey);
            var success = sendPagerdutyEvent(pagerdutyData);
            if(success){
                responseCode = 200;   
            }
        }
        else{
            console.log('Params are not valid');
        }
    }
 
    if(responseCode == 200){
        responseBody = {
            message: "OK",
        };
    }
    var response = {
        statusCode: responseCode,
        body: JSON.stringify(responseBody)
    };
    console.log("response: " + JSON.stringify(response))
    callback(null, response);
};