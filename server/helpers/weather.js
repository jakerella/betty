'use strict';

var debug = require('debug')('betty:weather'),
    request = require('request'),
    appData = require('../../config/data.json');

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = 'https://api.forecast.io/forecast/' + API_KEY + '/' + appData.location.lat + ',' + appData.location.lng;

module.exports = function() {

    return {
        getWeatherForDate: getWeatherForDate
    };

    /* *************** PUBLIC API ******************** */

    function getWeatherForDate(requestedDate) {
        return new Promise(function (resolve, reject) {
            debug('Getting weather for %s', requestedDate);

            var now = new Date();

            if (!API_KEY) {
                return reject(new Error('Unable to get weather, no API key available!'));
            }

            var d = new Date(requestedDate);
            if (!d.getTime()) {
                return reject(new Error('Please provide a valid day to check the weather for!'));
            }
            var simpleDate = d.toISOString().split('T')[0];

            request({
                url: BASE_URL,
                headers: {
                    'Accept-Encoding': 'gzip'
                }
            }, function(err, res, body) {
                debug('Retrieved weather data');

                var data;
                var text = 'We got some weather.';
                var type = 'summary';

                if (err) {
                    debug(err);
                    return reject(err);
                } else if (res.statusCode > 299) {
                    debug('Non-200 status code from weather API:', res.statusCode, body);
                    return reject(new Error('Sorry, but there was a problem getting weather data.'));
                }

                try {
                    data = JSON.parse(body);
                } catch(e) {
                    debug('Invalid JSON data from weather API');
                    return reject(new Error('Sorry, but there was a problem retrieving weather data.'));
                }

                if ( now.toISOString().split('T')[0] === simpleDate ) {
                    // for today, use hourly summary
                    debug('getting hourly summary');
                    text = getHourlySummary(d, data);
                    type = 'hour-by-hour';

                } else if ( (new Date(now.getTime() + 86400000)).toISOString().split('T')[0] === simpleDate) {
                    // for tomorrow, just do day sections (morning, mid-day, afternoon, evening)
                    debug('getting section summary');
                    text = getDaySections(d, data);
                    type = 'day-section';

                } else {
                    // for any other day just give the day summary
                    debug('getting daily summary');
                    type = 'day-summary';
                    data.daily.data.forEach(function(dailyData) {
                        if ((new Date(dailyData.time * 1000)).toISOString().split('T')[0] === simpleDate) {
                            text = getDaySummary(d, dailyData);
                        }
                    });
                }

                resolve({
                    text: text,
                    type: type,
                    date: d
                });
            });
        });
    }

    /* *************** PRIVATE API HELPERS ******************** */

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

    function getHourlySummary() {
        return 'Gonna have some weather today!';
    }

    function getDaySections() {
        return 'Gonna have some weather then!';
    }


    /* *************** DAILY SUMMARY ******************** */

    function getDaySummary(date, data) {
        var day = getDayOfWeek(date);
        var critical = getCriticalDailyCondition(data, day);
        var text = [ critical.headline ];

        var conditions = {
            'precipitation': getDailyPrecipText(data),
            'temperature': getDailyTemperatureText(data),
            'humidity': getDailyHumidityText(data),
            'wind': getDailyWindText(data)
        };

        if (conditions[critical.topic]) {
            text.push( conditions[critical.topic] );
            conditions[critical.topic] = null; // nullify it so we don't include it twice
        }

        shuffle(Object.keys(conditions)).forEach(function(topic) {
            if (conditions[topic]) {
                text.push( conditions[topic] );
            }
        });

        return text.join('. ');
    }

    function getCriticalDailyCondition(data, day) {
        var condition = {};

        if (data.precipProbability > 0.7 && data.precipIntensityMax > 0.05) {
            condition.topic = 'precipitation';
            if (data.precipType === 'rain') {
                condition.headline = 'Don\'t forget your umbrella ' + day;
            } else {
                condition.headline = 'Brace yourself for the snow on ' + day;
            }
        } else if (data.temperatureMax > 92) {
            condition.topic = 'temperature';
            if (data.dewPoint > 72 || data.humidity > 0.75) {
                condition.headline = 'It\'s going to be nasty ' + day;
            } else {
                condition.headline = 'Prepare for a scorcher ' + day;
            }
        } else if (data.temperatureMax < 35) {
            condition.topic = 'temperature';
            if (data.windSpeed > 15) {
                condition.headline = 'Prepare for bitter cold wind in your face ' + day;
            } else {
                condition.headline = 'Bitterly cold temperatures are in store for ' + day;
            }
        } else if (data.dewPoint > 72 && data.humidity > 0.75) {
            condition.topic = 'humidity';
            condition.headline = 'The humidity is going to be brutal ' + day;
        } else if (data.cloudCover > 0.85) {
            condition.topic = 'clouds';
            condition.headline = day + ' will be very cloudy';
        } else if (data.cloudCover < 0.1) {
            condition.topic = 'clouds';
            if (data.windSpeed > 15) {
                condition.headline = 'Lots of sun and breezy conditions are in store for ' + day;
            } else {
                condition.headline = day + ' will bring lots of sunshine';
            }
        } else if (data.windSpeed > 20) {
            condition.topic = 'wind';
            condition.headline = 'It\'s going to be gusty ' + day;
        } else {
            condition.topic = null;
            condition.headline = 'Looks like an average day on ' + day;
        }

        return condition;
    }

    function getDailyPrecipText(data) {
        if (data.precipProbability < 15) {
            return null;
        }
        var peak = new Date(data.precipIntensityMaxTime * 1000);
        peak = peak.getHours() + (peak.getTimezoneOffset() / 60);
        peak = (peak > 12) ? ((peak - 12) + ' pm') : (peak + 'am');

        return 'You should expect ' + getPrecipIntensityText(data.precipIntensityMax, data.precipType) + '. ' +
            'There is a ' + (data.precipProbability * 100) + ' percent chance ' +
            ' peaking at around ' + peak;
    }

    function getDailyTemperatureText(data) {
        var text;
        var min = Math.round(data.temperatureMin);
        var max = Math.round(data.temperatureMax);
        var appMax = Math.round(data.apparentTemperatureMax);

        if (max > 90) {
             text = 'It will reach ' + max + 'today';
             if (appMax > (max + 5)) {
                 text += ', but it might feel more like ' + appMax;
             }
             text += '. Lows will be near ' + min;

        } else if (max > 70) {
            text = 'The high will be ' + max + ' and the low around ' + min;

        } else if (max > 40) {
            text = 'Temperatures will only get up to ' + max + ' with lows near ' + min;

        } else {
            text = 'It might only hit ' + max;
            if (appMax < (max - 5)) {
                text += ', but it might only feel like ' + appMax;
            }
            text += '. The low is expected to be ' + min;
        }

        return text;
    }

    function getDailyHumidityText(data) {
        var text;

        if (data.dewPoint > 72 && data.humidity > 0.75) {
            text = 'The relative humidity will be near ' + (data.humidity * 100) +
                ' percent with the dew point at ' + Math.round(data.dewPoint);
        } else if (data.humidity < 0.4) {
            text = 'It\'s going to be very dry, grab that lotion. The humidity will only be ' + data.humidity;
        }

        return text;
    }

    function getDailyWindText(data) {
        var text;

        if (data.windSpeed > 30) {
            text = 'The wind could be fierce today, reaching speeds near ' + Math.round(data.windSpeed) + ' miles per hour';
        } else if (data.windSpeed > 20) {
            text = 'There may be some breezy moments with wind speeds peaking around ' + Math.round(data.windSpeed) + ' miles per hour';
        } else if (data.windSpeed > 10) {
            text = 'There should be a light breeze in the air';
        }

        return text;
    }

    /* *************** OTHER HELPERS ******************** */

    function getPrecipIntensityText(intensity, type) {
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

    function shuffle(a) {
        var j, x, i;
        for (i = a.length; i; i--) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
        return a;
    }

};
