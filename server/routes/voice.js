'use strict';

var debug = require('debug')('betty:routes:voice'),
    express = require('express'),
    router = express.Router(),
    echoMeta = require('../helpers/echo-verify')();

router.use(function(req, res, next) {
    var err = new Error('Malformed request signature detected. Request logged.');
    err.status = 400;
    
    echoMeta.validateRequest(req.headers, req.rawBody, function(e) {
        if (e) {
            console.trace(e);
            console.error('Unable to verify request signature', req.ip);
            next(err);
        } else {
            next();
        }
    });
});

router.post('/foo', function(req, res) {
    debug('Request to /foo');
    
    res.json({
        'action': 'foo',
        'message': 'Foobar'
    });
});

module.exports = router;
