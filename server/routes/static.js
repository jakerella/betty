'use strict';

var express = require('express'),
    router = express.Router();

router.get('/', function(req, res) {
    res.json({
        'name': 'betty',
        'purpose': 'Deliver public transit information via Amazon Echo'
    });
});

module.exports = router;
