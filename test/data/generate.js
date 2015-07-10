
module.exports = function(appId) {
    
    var VERSION = '1.0',
        DEFAULT_SESSION = 'amzn1.echo-api.session.0000000-0000-0000-0000-00000000042',
        DEFAULT_USER = 'amzn1.account.AM3B00000000000000000000013';
    
    appId = appId || 'amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-000000000000';
    
    
    function getSession(isNew, sessionId, userId) {
        sessionId = sessionId || DEFAULT_SESSION;
        userId = userId || DEFAULT_USER;
        
        return {
            'new': isNew,
            'sessionId': sessionId,
            'application': {
                'applicationId': appId
            },
            'attributes': {},
            'user': {
                'userId': userId
            }
        };
    }
    
    function getTimestamp() {
        return (new Date()).toISOString();
    }
    
    
    function getLaunchRequest(options) {
        options = options || {};
        
        return {
            'version': VERSION,
            'session': getSession(true, options.sessionId, options.userId),
            'request': {
                'type': 'LaunchRequest',
                'requestId': 'amzn1.echo-api.request.0000000-0000-0000-0000-00000000007',
                'timestamp': getTimestamp()
            }
        };
    }
    
    function getIntentRequest(options) {
        var name, slots = {};
        
        options = options || {};
        
        if (options.slots) {
            for (name in options.slots) {
                if (options.slots.hasOwnProperty(name)) {
                    slots[name] = {
                        name: name,
                        value: options.slots[name]
                    };
                }
            }
        }
        
        return {
            'version': VERSION,
            'session': getSession(true, options.sessionId, options.userId),
            'request': {
                'type': 'IntentRequest',
                'requestId': 'amzn1.echo-api.request.0000000-0000-0000-0000-00000000008',
                'timestamp': getTimestamp(),
                'intent': {
                    'name': options.name,
                    'slots': slots
                }
            }
        };
    }
    
    function getEndRequest(options) {
        options = options || {};
        
        options.sessionId = options.sessionId || DEFAULT_SESSION;
        
        return {
            'version': VERSION,
            'session': getSession(true, options.sessionId, options.userId),
            'request': {
                'type': 'SessionEndedRequest',
                'requestId': 'amzn1.echo-api.request.0000000-0000-0000-0000-00000000009',
                'timestamp': getTimestamp(),
                'reason': 'USER_INITIATED'
            }
        };
    }
    
    
    return {
        getLaunchRequest: getLaunchRequest,
        getIntentRequest: getIntentRequest,
        getEndRequest: getEndRequest
    };
    
};
