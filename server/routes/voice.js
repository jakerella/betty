'use strict';

let debug = require('debug')('betty:routes:voice'),
    router = require('express').Router(),
    echoVerify = require('../helpers/echo-verify'),
    betty = require('../services/betty');

const VERSION = '2.0',
    DEFAULT_RESPONSE = {
        outputSpeech: {
            type: 'PlainText',
            text: 'Sorry, but I couldn\'t understand your request. Can you try again?'
        },
        shouldEndSession: true
    };

/**
 * Echo request verification middleware
 */
router.use(function(req, res, next) {
    let err = new Error('Malformed request signature detected. Request logged.');
    err.status = 400;

    echoVerify(req.headers, req.rawBody, function(e) {
        if (e) {
            console.trace(e);
            console.error('Unable to verify request signature', req.ip);
            next(err);
        } else {
            next();
        }
    });
});


/**
 * Main route for Echo requests
 */
router.post('/betty', function(req, res, next) {
    debug('Request to /betty (' + req.body.request.type + ')');

    fireProperHandler(req.body, betty)
        .then(function(data) {
            data = data || {};

            res.json({
                version: VERSION,
                sessionAttributes: data.sessionAttributes || {},
                response: data.response || DEFAULT_RESPONSE
            });

        })
        .catch(next);
});


function fireProperHandler(body, mod) {
    return new Promise(function (resolve, reject) {
        if (body.request.type === 'IntentRequest' &&
            typeof(mod['handle' + body.request.intent.name]) === 'function') {

            // for Intents we parse on the name and call the proper method
            mod['handle' + body.request.intent.name](body, function(err, data) {
                if (err) { return reject(err); }
                resolve(data);
            });

        } else if (typeof(mod['handle' + body.request.type]) === 'function') {

            // Any other request type is handled generically
            mod['handle' + body.request.type](body, function(err, data) {
                if (err) { return reject(err); }
                resolve(data);
            });

        } else {
            let err = new Error('Sorry, but that request type is not implemented');
            err.status = 501;
            reject(err);
        }

    });
}

module.exports = router;
