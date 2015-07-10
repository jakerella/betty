
module.exports = function() {
    
    function getLaunchRequest() {
        return {
            "version": "1.0",
            "session": {
                "new": true,
                "sessionId": "amzn1.echo-api.session.0000000-0000-0000-0000-00000000042",
                "application": {
                    "applicationId": "amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-000000d00ebe"
                },
                "attributes": {},
                "user": {
                    "userId": "amzn1.account.AM3B00000000000000000000013"
                }
            },
            "request": {
                "type": "LaunchRequest",
                "requestId": "amzn1.echo-api.request.0000000-0000-0000-0000-00000000007",
                "timestamp": "2015-07-01T12:34:56Z"
            }
        };
    }
    
    function getIntentRequest() {
        return {
            "version": "1.0",
            "session": {
                "new": false,
                "sessionId": "amzn1.echo-api.session.0000000-0000-0000-0000-00000000042",
                "application": {
                    "applicationId": "amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-000000d00ebe"
                },
                "attributes": {},
                "user": {
                    "userId": "amzn1.account.AM3B00000000000000000000013"
                }
            },
            "request": {
                "type": "IntentRequest",
                "requestId": "amzn1.echo-api.request.0000000-0000-0000-0000-00000000008",
                "timestamp": "2015-07-01T12:35:01Z",
                "intent": {
                    "name": "NextBusIntent",
                    "slots": {
                        "Stop": {
                            "name": "Stop",
                            "value": "fifth and quintana"
                        }
                    }
                }
            }
        };
    }
    
    function getEndRequest() {
        return {
            "version": "1.0",
            "session": {
                "new": false,
                "sessionId": "amzn1.echo-api.session.0000000-0000-0000-0000-00000000042",
                "application": {
                    "applicationId": "amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-000000d00ebe"
                },
                "attributes": {},
                "user": {
                    "userId": "amzn1.account.AM3B00000000000000000000013"
                }
            },
            "request": {
                "type": "SessionEndedRequest",
                "requestId": "amzn1.echo-api.request.0000000-0000-0000-0000-00000000009",
                "timestamp": "2015-07-01T12:35:03Z",
                "reason": "USER_INITIATED"
            }
        };
    }
    
    
    return {
        getLaunchRequest: getLaunchRequest,
        getIntentRequest: getIntentRequest,
        getEndRequest: getEndRequest
    };
    
};
