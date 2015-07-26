'use strict';

var debug = require('debug')('betty:service'),
    debugSave = require('debug')('betty:service:save'),
    debugBus = require('debug')('betty:service:bus'),
    debugSetup = require('debug')('betty:service:setup');

var stops = {};

var LOCATION_NOT_SUPPORTED = 'I\'m sorry, but I don\'t have any information for your location!';

module.exports = function(injection) {
    
    if (injection && injection.stops) {
        stops = injection.stops;
    }
    
    // ------------- Helper Methods -------------- //
    
    function getTransitKey(location) {
        var apiKey;
        
        location = location || 'WAS';
        apiKey = process.env['TRANSIT_KEY_' + location];
        
        if (!apiKey) {
            debugSetup('No api key found for transit in user\'s location.');
        }
        
        return apiKey;
    }
    
    
    function doSendMessage(msg, cb, endSession) {
        endSession = !!endSession;
        
        return process.nextTick(function() {
            cb(null, {
                response: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: msg
                    },
                    shouldEndSession: endSession
                }
            });
        });
    }
    
    
    // ------------- Intent Handlers -------------- //
    
    function doLaunch(data, cb) {
        process.nextTick(function() {
            debug('Launch request, asking what they want...');
            cb(null, {
                response: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: 'Please tell me what you would like to know.'
                    },
                    shouldEndSession: false
                }
            });
        });
        
    }
    
    function doEndSession(data, cb) {
        process.nextTick(function() {
            debug('End request, saying buh bye...');
            cb(null, {
                response: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: 'Buh bye now.'
                    },
                    shouldEndSession: true
                }
            });
        });
    }
    
    function cancelAction(data, cb) {
        return process.nextTick(function() {
            debug('Cancelling request...');
            cb(null, {
                response: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: 'bye bye'
                    },
                    shouldEndSession: true
                }
            });
        });
    }
    
    function doSaveStop(data, cb) {
        var stopId,
            slots = data.request.intent.slots || {},
            apiKey = getTransitKey();
        
        debugSave('Save request:', data);
        
        if (!apiKey) {
            return doSendMessage(LOCATION_NOT_SUPPORTED, cb);
        }
        
        // We must have a Name and either a StopId or Stop (name?)
        if (!slots.StopId || !slots.StopId.value ||
            !slots.Name || !slots.Name.value) {
            
            debugSave('No stop specified to save, asking about that...');
            return doSendMessage(
                'Please tell me the stop ID used by your transit system and the name you would like me to use for it.',
                cb
            );
            
        }
        
        stopId = Number(slots.StopId.value);
        
        if (!stopId) {
            debugSave('Invalid StopId value', slots.StopId.value);
            return doSendMessage('Sorry, but currently the bus stop must be a numeric ID.', cb);
        }
        
        debugSave('Saving stop:', JSON.stringify(slots));
        
        stops[slots.Name.value] = stopId;
        
        doSendMessage('Okay, I saved stop ' + stopId +  ' as ' + slots.Name.value + ' for you.', cb, true);
    }
    
    function getNextBus(data, cb) {
        var busNumber = null,
            slots = data.request.intent.slots || {},
            apiKey = getTransitKey();
        
        debugBus('Bus request:', data.request);
        
        if (!apiKey) {
            return doSendMessage(LOCATION_NOT_SUPPORTED, cb);
        }
        
        if (!slots.Stop || !slots.Stop.value) {
            debugBus('No bus stop specified, asking about that...');
            return doSendMessage('What bus stop are you asking about?', cb);
        }
        
        if (!stops[slots.Stop.value]) {
            debugBus('Bus stop not saved');
            return doSendMessage('Sorry, but I don\'t know about that bus stop, have you saved it yet?', cb, true);
        }
        
        
        busNumber = slots.Number && (Number(slots.Number.value) || slots.Number.value);
        
        debugBus('Looking for next bus', slots.Stop.value, slots[slots.Stop.value], busNumber);
        
        doSendMessage('The next 62 bus is in 5 minutes', cb, true);
    }
    
    
    // ------------- API Definition -------------- //
    
    return {
        handleLaunchRequest: doLaunch,
        handleSessionEndedRequest: doEndSession,
        handleNextBus: getNextBus,
        handleSaveStop: doSaveStop,
        handleCancel: cancelAction
    };
    
};