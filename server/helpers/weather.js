'use strict';

var debug = require('debug')('betty:weather'),
    bluebird = require('bluebird'),
    request = bluebird.promisify(require('request')),
    appData = require('../../config/data.json');

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.forecast.io/forecast/' + API_KEY + '/' + appData.location.lat + ',' + appData.location.lng;

module.exports = function() {

    return {
        checkDate: getWeather
    };

    function getWeather(requestedDate) {
        debug('Getting weather for %s', requestedDate);

        if (!API_KEY) {
            return new Promise(function(resolve, reject) {
                reject(new Error('Unable to get weather, no API key available!'));
            });
        }

        var d = new Date(requestedDate);
        if (!d.getTime()) {
            return new Promise(function(resolve, reject) {
                reject(new Error('Please provide a valid day to check the weather for!'));
            });
        }

        return request({
            url: BASE_URL,
            headers: {
                'Accept-Encoding': 'gzip'
            }
        }).then(function() {

/*
data.daily.data[0]
data.hourly.data[0]

apparentTemperatureMax:64.99
apparentTemperatureMaxTime:1470697200
apparentTemperatureMin:54.75
apparentTemperatureMinTime:1470661200
cloudCover:0.4
dewPoint:53.08
humidity:0.81
icon:"partly-cloudy-day"
moonPhase:0.19
ozone:297.87
precipIntensity:0
precipIntensityMax:0
precipProbability:0
pressure:1010.58
summary:"Mostly cloudy throughout the day."
sunriseTime:1470662454
sunsetTime:1470712335
temperatureMax:64.99
temperatureMaxTime:1470697200
temperatureMin:54.75
temperatureMinTime:1470661200
time:1470639600
visibility:8.2
windBearing:263
windSpeed:7.56
 */

            return {
                text: 'The weather will be pleasant on ' + getDayOfWeek(d)
            };
        });
    }

    function getDayOfWeek(date) {
        var day = 'that day';
        if ( (date.getTime() - Date.now()) < (1000*60*60*24*6) ) {
            day = DAYS_OF_WEEK[date.getDay()];
        }
        return day;
    }

};
