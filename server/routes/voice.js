'use strict';

var debug = require('debug')('betty:routes:voice'),
    express = require('express'),
    router = express.Router(),
    echoMeta = require('../helpers/echo-meta')();

router.use(echoMeta.validateRequest);

router.post('/foo', function(req, res) {
    debug('Request to /foo');
    
    res.json({
        'action': 'foo',
        'message': 'Foobar'
    });
});

module.exports = router;
