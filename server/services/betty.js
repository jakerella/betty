'use strict';

var debug = require('debug')('betty:service'),
    debugBus = require('debug')('betty:service:bus'),
    debugWeather = require('debug')('betty:service:weather'),
    transitApi = require('../helpers/transit-was')(),
    weatherApi = require('../helpers/weather')(),
    appData = require('../../config/data.json');

module.exports = {
    handleLaunchRequest: handleLaunchRequest,
    handleSessionEndedRequest: handleSessionEndedRequest,
    handleNextBus: handleNextBus,
    handleWeather: handleWeather
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

    if (slots.Stop && slots.Stop.value) {
        stopId = appData.stops[slots.Stop.value];
    } else {
        debugBus('No bus stop specified, using default');
        stopId = appData.stops[appData.stops.default];
    }

    if (!stopId) {
        debugBus('Bus stop not saved');
        return doSendMessage('Sorry, but I don\'t know about that bus stop, have you saved it yet?', cb, true);
    }

    debugBus('Looking for next bus', stopId, busNumber);

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


function handleWeather(data, cb) {

    debugWeather('Weather request:', data.request);

    weatherApi
        .checkDate(data.request.intent.slots.Date.value)
        .then(function(weather) {
            debugWeather('Weather result:', weather);
            doSendMessage(weather.text, cb, true);
        })
        .catch(function(err) {
            if (!(err instanceof Error)) {
                err = new Error(err || 'Sorry, but there was a problem. Can you try again?');
                err.status = 500;
            }

            debugWeather(err);
            doSendMessage(err.message, cb, true);
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
