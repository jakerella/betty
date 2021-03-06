'use strict';

var debug = require('debug')('betty:routes:static'),
    path = require('path'),
    router = require('express').Router();

function getUptime() {
    var now = (new Date()).getTime(),
        sec = Math.round((now - global.bettyStartTime) / 1000);

    if (sec < 60) {
        return Math.round(sec) + ' seconds';
    } else if (sec < 86400) {
        return (sec / 60).toFixed(2) + ' minutes';
    } else {
        return (sec / 3600).toFixed(2) + ' hours';
    }
}

router.get('/', function(req, res) {
    debug('Root route hit, sending uptime info');

    res.json({
        'name': 'betty',
        'purpose': 'Do my bidding via Amazon Echo (Alexa)',
        'uptime': getUptime()
    });
});

if (process.env.NODE_ENV === 'development') {
    router.get('/echo-api.pem', function(req, res) {
        res.sendFile(path.join(__dirname, '..', '..', 'test', 'data', 'echo-api.pem'));
    });
}

module.exports = router;
