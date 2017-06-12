'use strict';

var debug = require('debug')('betty:transit:was'),
    request = require('request');

var API_KEY = process.env.TRANSIT_KEY_WAS,
    BASE_URL = 'https://api.wmata.com/NextBusService.svc/json/jPredictions',
    MINUTE_MAX = 25;


module.exports = function() {

    if (!API_KEY || !BASE_URL) {
        debug('No api key or base url provided');
        return null;
    }

    function getNextBus(stopId) {
        return new Promise(function (resolve, reject) {

            debug('Getting next bus for stop', stopId);

            if (!stopId) {
                return reject(new Error('Please provide a stop ID to check.'));
            }

            request({
                url: BASE_URL + '?StopID=' + stopId,
                headers: {
                    'api_key': API_KEY
                }
            }, function(err, res, body) {
                var data, buses;

                if (err) {
                    debug(err);
                    return reject(err);
                } else if (res.statusCode > 299) {
                    debug('Non-200 status code from transit API:', res.statusCode, body);
                    return reject(new Error('Sorry, but there was an error. Can you try again?'));
                }

                try {
                    data = JSON.parse(body);
                } catch(e) {
                    debug('Invalid JSON data from transit API');
                    return reject(new Error('Sorry, but there is a problem with your transit provider\'s information.'));
                }

                if (!data.Predictions || !data.Predictions.length) {
                    return resolve({ noData: true });
                }

                buses = data.Predictions
                    .filter(function(bus) {
                        return bus.Minutes < MINUTE_MAX;
                    })
                    .map(function(bus) {
                        return { route: bus.RouteID, time: bus.Minutes };
                    });

                if (!buses.length) {
                    return resolve({ noData: true });
                }

                resolve(buses);
            });

        });
    }


    return {
        getNextBus: getNextBus
    };

};
