'use strict';

var debug = require('debug')('betty:service'),
    debugBus = require('debug')('betty:service:bus');

module.exports = function() {
    
    function getTransitKey(location) {
        location = location || 'WAS';
        
        return process.env['TRANSIT_KEY_' + location];
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
    
    function getNextBus(data, cb) {
        var slots = data.request.slots || {},
            apiKey = getTransitKey();
        
        if (!apiKey) {
            return process.nextTick(function() {
                debugBus('No api key found for transit');
                cb(new Error('Sorry, but I wasn\'t able to retrieve your transit data!'));
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
        handleNextBus: getNextBus
    };
    
};