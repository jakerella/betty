'use strict';

var debug = require('debug')('betty:service'),
    debugBus = require('debug')('betty:service:bus'),
    debugSetup = require('debug')('betty:service:setup');

module.exports = function() {
    
    function getTransitKey(location) {
        var apiKey;
        
        location = location || 'WAS';
        apiKey = process.env['TRANSIT_KEY_' + location];
        
        if (!apiKey) {
            debugSetup('No api key found for transit in user\'s location.');
        }
        
        return apiKey;
    }
    
    function getLocationNotSupported() {
        return {
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: 'I\'m sorry, but I don\'t have any information for your location!'
                },
                shouldEndSession: true
            }
        };
    }
    
    function getSetupInstructions() {
        
    }
    
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
    
    function doSaveStop(data, cb) {
        var slots = data.intent.slots || {},
            apiKey = getTransitKey();
        
        debugSetup('Save request:', data);
        debugSetup('Slots:', slots, slots.StopId, slots.Name);
        
        
        if (!apiKey) {
            return process.nextTick(function() {
                cb(null, getLocationNotSupported());
            });
        }
        
        if (!slots.StopId || !slots.Name) {
            return process.nextTick(function() {
                debug('No stop specified to save, asking about that...');
                cb(null, {
                    response: {
                        outputSpeech: {
                            type: 'PlainText',
                            text: 'Please tell me the stop ID used by your transit system and the name you would like me to use for it.'
                        },
                        shouldEndSession: false
                    }
                });
            });
        }
        
        return process.nextTick(function() {
            cb(null, {
                response: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: 'Okay, I have saved that stop for you'
                    },
                    shouldEndSession: true
                }
            });
        });
        
    }
    
    function getNextBus(data, cb) {
        var slots = data.request.slots || {},
            apiKey = getTransitKey();
        
        debugBus('Bus request:', data.request);
        
        if (!apiKey) {
            return process.nextTick(function() {
                cb(null, getLocationNotSupported());
            });
        }
        
        
        if (!slots.Stop) {
            return process.nextTick(function() {
                debug('No bus stop specified, asking about that...');
                cb(null, {
                    response: {
                        outputSpeech: {
                            type: 'PlainText',
                            text: 'What bus stop are you asking about?'
                        },
                        shouldEndSession: false
                    }
                });
            });
        }
        
        
    }
    
    
    return {
        handleLaunchRequest: doLaunch,
        handleSessionEndedRequest: doEndSession,
        handleNextBus: getNextBus,
        handleSaveStop: doSaveStop
    };
    
};