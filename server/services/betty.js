'use strict';

var debug = require('debug')('betty:service'),
    debugBus = require('debug')('betty:service:bus'),
    debugWeather = require('debug')('betty:service:weather'),
    transitApi = require('../helpers/transit-was')(),
    weatherApi = require('fuzzy-weather')({
        apiKey: process.env.WEATHER_API_KEY,
        location: {
            lat: 38.9649734,
            lng: -77.0207249
        }
    }),
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
        slots = data.request.intent.slots || {};

    debugBus('Bus request:', data.request);

    if (slots.Route && slots.Route.value) {
        stopId = appData.Route[slots.Route.value];
    } else {
        debugBus('No bus stop specified, using default');
        stopId = appData.Route[appData.Route.default];
    }

    if (!stopId) {
        debugBus('Bus stop not saved');
        return doSendMessage('Sorry, but I don\'t know about that bus route.', cb, true);
    }

    debugBus('Looking for next bus at ', stopId);

    transitApi.getNextBus(stopId)
        .then(function(transitData) {

            if (transitData.noData) {
                return doSendMessage('Sorry, but there are no buses scheduled to arrive soon on that route.', cb, true);
            }

            var text = transitData.map(function(bus) {
                return `${bus.route} arriving in ${bus.time} minute${(bus.time === 1) ? '' : 's'}`;
            });
            /* jshint maxlen:200 */
            text = [`Here ${(transitData.length > 1) ? 'are' : 'is'} the next ${(transitData.length > 1) ? transitData.length+' ' : ''}bus${(transitData.length > 1) ? 'es' : ''}`, ...text];
            /* jshint maxlen:140 */

            doSendMessage(text.join('. '), cb, true);
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

    weatherApi(data.request.intent.slots.Date.value)
        .then(function(weather) {
            debugWeather('Weather result:', weather);

            let reqDate = data.request.intent.slots.Date && data.request.intent.slots.Date.value;
            reqDate = reqDate || (new Date(Date.now() - (3600000 * 4))).toISOString();
            let simpleDate = reqDate.split(/T/)[0];
            let today = (new Date(Date.now() - (3600000 * 4))).toISOString().split(/T/)[0];
            let tomorrow = (new Date((Date.now() - (3600000 * 4)) + 86400000)).toISOString().split(/T/)[0];

            if (simpleDate === today || simpleDate === tomorrow) {
                doSendMessage(weather.hourByHour.forecast, cb, true);
            } else {
                doSendMessage(weather.dailySummary.forecast, cb, true);
            }
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
