'use strict';

var debug = require('debug')('betty:routes:voice'),
    express = require('express'),
    router = express.Router();

router.get('/foo', function(req, res) {
    res.json({
        'action': 'foo',
        'message': 'Foobar'
    });
});

module.exports = router;
