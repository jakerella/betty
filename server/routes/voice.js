'use strict';

var express = require('express'),
    router = express.Router();

router.get('/foo', function(req, res) {
    res.json({
        'action': 'foo',
        'message': 'Foobar'
    });
});

module.exports = router;
