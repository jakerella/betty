'use strict';

var path = require('path'),
    assert = require('assert'),
    request = require('supertest'),
    nock = require('nock'),
    server = require('../server/app.js'),
    generate = require('./data/generate.js')('amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-0000000betty');

var LOCAL_CERT = 'file://' + path.resolve('test/data/echo-api.pem'),
    SIGNATURE = 'this is a test signature',
    // TEST_USER_ID = 'amzn1.account.AM3B00000000000000000000013',
    TEST_STOP_NAME = 'X2',
    TEST_STOP_ID = 1001113;

function assertEchoResponseFormat(data) {
    assert.ok(data.sessionAttributes);
    assert.ok(data.response);
    assert.equal(data.response.outputSpeech.type, 'PlainText');
    assert.equal(typeof data.response.shouldEndSession, 'boolean');
}

describe('NextBus intent', function() {

    it('should fail if the stop is not saved', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Route': 'wut' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Sorry, but I don\'t know about that bus route.');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should use default for a stop if not given', function(done) {

        nock('https://api.wmata.com')
            .get('/NextBusService.svc/json/jPredictions?StopID=' + TEST_STOP_ID)
            .reply(200, require('./data/wmata.nextbus.json'));

        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus'
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Here are the next 2 buses. X2 arriving in 1 minute. X1 arriving in 19 minutes');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should succeed with many upcoming buses', function(done) {

        nock('https://api.wmata.com')
            .get('/NextBusService.svc/json/jPredictions?StopID=' + TEST_STOP_ID)
            .reply(200, require('./data/wmata.nextbus-many.json'));


        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Route': TEST_STOP_NAME }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Here are the next 2 buses. X2 arriving in 1 minute. X1 arriving in 19 minutes');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should succeed with only one upcoming bus', function(done) {

        nock('https://api.wmata.com')
            .get('/NextBusService.svc/json/jPredictions?StopID=' + TEST_STOP_ID)
            .reply(200, require('./data/wmata.nextbus-one.json'));


        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Route': TEST_STOP_NAME }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Here is the next bus. X2 arriving in 5 minutes');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should succeed with zero upcoming buses', function(done) {

        nock('https://api.wmata.com')
            .get('/NextBusService.svc/json/jPredictions?StopID=' + TEST_STOP_ID)
            .reply(200, require('./data/wmata.nextbus-zero.json'));


        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Route': TEST_STOP_NAME }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Sorry, but there are no buses scheduled to arrive soon on that route.');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

});
