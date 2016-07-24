'use strict';

var assert = require('assert'),
    request = require('supertest'),
    server = require('../server/app.js');

describe('GET root', function(){
    it('should respond with json status', function(done) {
        request(server)
            .get('/')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assert.equal(res.body.name, 'betty');
                assert.equal(res.body.purpose, 'Do my bidding via Amazon Echo (Alexa)');
                assert.ok(/^[0-9\.]+\s(seconds|minutes|hours)$/.test(res.body.uptime));
            })
            .expect(200, done);
    });
});
