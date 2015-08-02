'use strict';

var debug = require('debug')('betty:transit:was'),
    request = require('request'),
    Promise = require('mongoose').Promise;

var API_KEY = process.env.TRANSIT_KEY_WAS,
    BASE_URL = 'https://api.wmata.com/NextBusService.svc/json/jPredictions';

function TransitError() { require('../helpers/create-error-type').apply(this, [].slice.call(arguments)); }
require('util').inherits(TransitError, Error);

module.exports = function() {
    
    if (!API_KEY || !BASE_URL) {
        debug('No api key or base url provided');
        return null;
    }
    
    
    function getNextBus(stopId, busNumber) {
        var promise = new Promise();
        
        debug('Getting next bus for stop', stopId, busNumber);
        
        if (!stopId) {
            return promise.error(new TransitError('Please provide a stop ID to check.', 400));
        }
        
        request({
            url: BASE_URL + '?StopID=' + stopId,
            headers: {
                'api_key': API_KEY
            }
        }, function(err, res, body) {
            var i, l, data, result;
            
            if (err) {
                debug(err);
                return promise.error(err);
            } else if (res.statusCode > 299) {
                debug('Non-200 status code from transit API:', res.statusCode, body);
                return promise.error(new TransitError('Sorry, but there was an error. Can you try again?', 500));
            }
            
            try {
                data = JSON.parse(body);
            } catch(e) {
                debug('Invalid JSON data from transit API');
                return promise.error(new TransitError('Sorry, but there is a problem with your transit provider\'s information.', 500));
            }
            
            if (!data.Predictions || !data.Predictions.length) {
                return promise.fulfill({ noData: true });
            }
            
            result = data.Predictions[0];
            
            if (busNumber) {
                result = null;
                for(i=0, l=data.Predictions.length; i<l; ++i) {
                    if (data.Predictions[i].RouteID === (''+busNumber)) {
                        result = data.Predictions[i];
                        break;
                    }
                }
            }
            
            if (!result) {
                return promise.fulfill({ noData: true });
            }
            
            promise.fulfill({
                busNumber: result.RouteID,
                time:  result.Minutes + ' minutes'
            });
            
        });
        
        return promise;
    }
    
    
    return {
        getNextBus: getNextBus
    };
    
};
