'use strict';

var debug = require('debug')('betty:service'),
    debugBus = require('debug')('betty:service:bus'),
    transitApi = require('../helpers/transit-was')(),
    appData = require('../../config/data.json');

module.exports = {
    handleLaunchRequest: handleLaunchRequest,
    handleSessionEndedRequest: handleSessionEndedRequest,
    handleNextBus: handleNextBus
};


// ------------- Intent Handlers -------------- //

function handleLaunchRequest(data, cb) {
    process.nextTick(function() {
        debug('Launch request, asking what they want...');
        cb(null, {
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: 'What\'s the haps, paps?'
                },
                shouldEndSession: false
            }
        });
    });

}

function handleSessionEndedRequest(data, cb) {
    process.nextTick(function() {
        debug('End request, saying buh bye...');
        cb(null, {
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: 'Okay I love you buh bye.'
                },
                shouldEndSession: true
            }
        });
    });
}

function handleNextBus(data, cb) {
    var stopId,
        slots = data.request.intent.slots || {},
        busNumber = slots.Number && (Number(slots.Number.value) || slots.Number.value);

    debugBus('Bus request:', data.request);

    if (!slots.Stop || !slots.Stop.value) {
        debugBus('No bus stop specified, asking about that...');
        return doSendMessage('What bus stop are you asking about?', cb, false);
    }

    stopId = appData.stops[slots.Stop.value];
    if (!stopId) {
        console.log(slots.Stop.value, appData.stops);
        debugBus('Bus stop not saved');
        return doSendMessage('Sorry, but I don\'t know about that bus stop, have you saved it yet?', cb, true);
    }

    debugBus('Looking for next bus', slots.Stop.value, slots[slots.Stop.value], busNumber);

    transitApi.getNextBus(stopId, busNumber)
        .then(function(transitData) {

            if (transitData.noData) {
                if (busNumber) {
                    return doSendMessage('Sorry, but there are no ' + busNumber + ' buses scheduled to arrive soon.', cb, true);
                } else {
                    return doSendMessage('Sorry, but there are no buses scheduled to arrive soon.', cb, true);
                }
            }

            doSendMessage('The next ' + transitData.busNumber + ' bus will arrive in ' + transitData.time + '.', cb, true);

        })
        .catch(function(err) {
            if (!(err instanceof Error)) {
                err = new Error(err || 'Sorry, but there was a problem. Can you try again?');
                err.status = 500;
            }

            debugBus(err);
            doSendMessage(err.message, cb, err.status > 399);
        });
}


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
