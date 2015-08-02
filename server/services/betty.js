'use strict';

var debug = require('debug')('betty:service'),
    debugSave = require('debug')('betty:service:save'),
    debugBus = require('debug')('betty:service:bus'),
    User = require('../models/user.js');

function ServiceError() { require('../helpers/create-error-type').apply(this, [].slice.call(arguments)); }
require('util').inherits(ServiceError, Error);

module.exports = function() {
    
    // ------------- Helper Methods -------------- //
    
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
        var stopId, stopName,
            slots = data.request.intent.slots || {};
        
        debugSave('Save request:', data);
        
        User.findOrCreate(data.session.user.userId)
            .then(function(user) {
                
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
                stopName = slots.Name.value;
                
                if (!stopId) {
                    debugSave('Invalid StopId value', slots.StopId.value);
                    return doSendMessage('Sorry, but currently the bus stop must be a numeric ID.', cb);
                }
                
                debugSave('Saving stop:', JSON.stringify(slots));
                
                user.stops.push({
                    name: stopName,
                    id: stopId
                });
                
                return user.save();
            })
            .then(function() {
                doSendMessage('Okay, I saved stop ' + stopId +  ' as ' + stopName + ' for you.', cb, true);
            })
            .then(null, function(err) {
                debugSave(err.message);
                console.error(err.stack);
                doSendMessage('Sorry, but there was a problem saving this stop. Can you try again?', cb, true);
            });
        
    }
    
    function getNextBus(data, cb) {
        var transitApi, stopId,
            slots = data.request.intent.slots || {},
            busNumber = slots.Number && (Number(slots.Number.value) || slots.Number.value);
        
        debugBus('Bus request:', data.request);
        
        User.findOrCreate(data.session.user.userId)
            .then(function(user) {
                    
                transitApi = require('../helpers/transit-' + user.location.toLowerCase())();
                if (!transitApi) {
                    throw new ServiceError('I\'m sorry, but I don\'t have any information for your location!', 400);
                } else if (!transitApi.getNextBus) {
                    throw new ServiceError('I\'m sorry, but I don\'t have bus information for your location!', 400);
                }
                
                if (!slots.Stop || !slots.Stop.value) {
                    debugBus('No bus stop specified, asking about that...');
                    throw new ServiceError('What bus stop are you asking about?', 200);
                }
                
                stopId = user.getSavedStopId(slots.Stop.value);
                if (!stopId) {
                    debugBus('Bus stop not saved');
                    throw new ServiceError('Sorry, but I don\'t know about that bus stop, have you saved it yet?', 400);
                }
                
                debugBus('Looking for next bus', slots.Stop.value, slots[slots.Stop.value], busNumber);
                
                return transitApi.getNextBus(stopId, busNumber);
                
            })
            .then(function(data) {
                
                if (data.noData) {
                    if (busNumber) {
                        return doSendMessage('Sorry, but there are no ' + busNumber + ' buses scheduled to arrive soon.', cb, true);
                    } else {
                        return doSendMessage('Sorry, but there are no buses scheduled to arrive soon.', cb, true);
                    }
                }
                
                doSendMessage('The next ' + data.busNumber + ' bus will arrive in ' + data.time + '.', cb, true);
                
            })
            .then(null, function(err) {
                var msg = err.message;
                
                if (!(err instanceof ServiceError)) {
                    msg = 'Sorry, but there was a problem. Can you try again?';
                }
                
                debugBus(err);
                doSendMessage(msg, cb, err.status > 299);
            });
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