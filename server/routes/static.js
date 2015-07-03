'use strict';

var debug = require('debug')('betty:routes:static'),
    express = require('express'),
    router = express.Router();

function getUptime() {
    var sec = Math.round(((new Date()).getTime() - global.bettyStartTime) / 1000);
    
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
        'purpose': 'Deliver public transit information via Amazon Echo',
        'uptime': getUptime()
    });
});

module.exports = router;
