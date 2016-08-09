'use strict';

var debug = require('debug')('betty:weather'),
    bluebird = require('bluebird'),
    request = bluebird.promisify(require('request')),
    appData = require('../../config/data.json');

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const LEADING_WORDS = [
    'Expect {headline} {day}',
    'Prepare for {headline} {day}',
    '{headline} is in store for us {day}'
];

const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.forecast.io/forecast/' + API_KEY + '/' + appData.location.lat + ',' + appData.location.lng;

module.exports = function() {

    return {
        checkDate: getWeather
    };

    function getWeather(requestedDate) {
        debug('Getting weather for %s', requestedDate);

        var now = new Date();

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
        }).then(function(data) {
            var text = 'We got some weather.';
            var type = 'summary';
            var simpleDate = d.toISOString().split('T')[0];

            if ( now.toISOString().split('T')[0] === simpleDate ) {
                // for today, use hourly summary
                text = getHourlySummary(d, data);
                type = 'hour-by-hour';

            } else if ( (new Date(now.getTime() + 86400000)).toISOString().split('T')[0] ===  simpleDate) {
                // for tomorrow, just do day sections (morning, mid-day, afternoon, evening)
                text = getDaySections(d, data);
                type = 'day-section';

            } else {
                // for any other day just give the day summary
                text = getDaySummary(d, data);
                type = 'day-summary';
            }

            return {
                text: text,
                type: type,
                date: d
            };
        });
    }

    /*
    data.hourly.data[0] - 48
    {
        "time":1470751200,
        "summary":"Partly Cloudy",
        "icon":"partly-cloudy-day",
        "precipIntensity":0.0047,
        "precipProbability":0.17,
        "precipType":"rain",
        "temperature":77.87,
        "apparentTemperature":77.87,
        "dewPoint":66.94,
        "humidity":0.69,
        "windSpeed":5.79,
        "windBearing":97,
        "visibility":10,
        "cloudCover":0.48,
        "pressure":1021.9,
        "ozone":295.99
    }
     */

    function getHourlySummary(date, data) {
        return date + data;
    }

    function getDaySections(date, data) {
        return date + data;
    }

    /*
    data.daily.data[0] - 7
    {
        "time":1470801600,
        "summary":"Light rain starting in the afternoon.",
        "icon":"rain",
        "sunriseTime":1470824326,
        "sunsetTime":1470874240,
        "moonPhase":0.25,
        "precipIntensity":0.0037,
        "precipIntensityMax":0.0158,
        "precipIntensityMaxTime":1470862800,
        "precipProbability":0.47,
        "precipType":"rain",
        "temperatureMin":74.62,
        "temperatureMinTime":1470819600,
        "temperatureMax":91.26,
        "temperatureMaxTime":1470859200,
        "apparentTemperatureMin":74.62,
        "apparentTemperatureMinTime":1470819600,
        "apparentTemperatureMax":99.53,
        "apparentTemperatureMaxTime":1470859200,
        "dewPoint":73.52,
        "humidity":0.77,
        "windSpeed":8.16,
        "windBearing":169,
        "visibility":10,
        "cloudCover":0.7,
        "pressure":1020.36,
        "ozone":286.23
    }
     */

    function getDaySummary(date, data) {
        var day = getDayOfWeek(date);
        var text = 'Weather.';

        if (data.precipProbability > 0.7 && data.precipIntensityMax > 0.05) {
            text = getRandomLeadingWords('rain', day);
        } else if (data.temperatureMax > 90) {
            text = getRandomLeadingWords('a scorcher', day);
        } else if (data.temperatureMax < 35) {
            text = getRandomLeadingWords('bitter cold', day);
        } else if (data.dewPoint > 70) {
            text = getRandomLeadingWords('nasty humidity', day);
        } else if (data.cloudCover > 0.85) {
            text = getRandomLeadingWords('solid clouds', day);
        } else if (data.cloudCover < 0.1) {
            text = getRandomLeadingWords('sunny skies', day);
        } else {
            text = day + ' looks to be normal for this time of year. ' +
                'You can expect a ' + (data.precipProbability * 100) + ' percent chance of ' +
                getPrecipText(data.precipIntensityMax, data.precipType);
        }

        return text;
    }

    function getPrecipText(intensity, type) {
        var intensityText = 'no';
        if (intensity > 0.7) {
            intensityText = 'extremely heavy';
        } else if (intensity > 0.2) {
            intensityText = 'heavy';
        } else if (intensity > 0.07) {
            intensityText = 'moderate';
        } else if (intensity > 0.01) {
            intensityText = 'light';
        } else if (intensity > 0) {
            if (type === 'snow') {
                intensityText = 'a light dusting of';
            } else if (type === 'rain') {
                intensityText = 'drizzling';
            } else {
                intensityText = 'very light';
            }
        }
        return intensityText + ' ' + type;
    }

    function getDayOfWeek(date) {
        var day = 'that day';
        if ( (date.getTime() - Date.now()) < (1000*60*60*24*6) ) {
            day = DAYS_OF_WEEK[date.getDay()];
        }
        return day;
    }

    function getRandomLeadingWords(headline, day) {
        var text = LEADING_WORDS[ Math.floor(Math.random() * LEADING_WORDS.length) ];
        return text.replace('{headline}', headline).replace('{day}', day);
    }

};
