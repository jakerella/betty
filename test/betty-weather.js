'use strict';

var path = require('path'),
    assert = require('assert'),
    request = require('supertest'),
    nock = require('nock'),
    server = require('../server/app.js'),
    appData = require('../config/data.json'),
    generate = require('./data/generate.js')('amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-0000000betty');

var LOCAL_CERT = 'file://' + path.resolve('test/data/echo-api.pem'),
    SIGNATURE = 'this is a test signature';
    // TEST_USER_ID = 'amzn1.account.AM3B00000000000000000000013'

function assertEchoResponseFormat(data) {
    assert.equal(data.version, '2.0');
    assert.ok(data.sessionAttributes);
    assert.ok(data.response);
    assert.equal(data.response.outputSpeech.type, 'PlainText');
    assert.equal(typeof data.response.shouldEndSession, 'boolean');
}

describe('Weather intent', function() {

    beforeEach(function() {
        nock('https://api.forecast.io')
            .get('/forecast/' + process.env.WEATHER_API_KEY + '/' + appData.location.lat + ',' + appData.location.lng)
            .reply(200, require('./data/dc.weather.json'));
    });

    afterEach(function() {
        nock.cleanAll();
    });

    it('should fail if there is no API key', function(done) {
        var _key = process.env.WEATHER_API_KEY;
        process.env.WEATHER_API_KEY = null;

        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'Weather',
                slots: { 'Date': '2016-08-11' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Unable to get weather, no API key available!');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, function() {
                process.env.WEATHER_API_KEY = _key;
                done();
            });
    });

    it('should fail if there is no date', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'Weather',
                slots: {}
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Please provide a valid day to check the weather for!');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should fail if there is an invalid date', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'Weather',
                slots: { 'Date': 'Invalid Date' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Please provide a valid day to check the weather for!');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should summarize for a day past tomorrow', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'Weather',
                slots: { 'Date': '2016-08-15T14:00:00' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.ok(res.body.response.outputSpeech.text.indexOf('Monday') > -1);
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

});