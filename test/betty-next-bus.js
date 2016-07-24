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
    TEST_STOP_NAME = 'north',
    TEST_STOP_ID = 1002716;

function assertEchoResponseFormat(data) {
    assert.equal(data.version, '2.0');
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
                slots: { 'Stop': 'wut' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Sorry, but I don\'t know about that bus stop, have you saved it yet?');
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
                assert.equal(res.body.response.outputSpeech.text, 'The next 62 bus will arrive in 5 minutes.');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should succeed with just a stop name', function(done) {

        nock('https://api.wmata.com')
            .get('/NextBusService.svc/json/jPredictions?StopID=' + TEST_STOP_ID)
            .reply(200, require('./data/wmata.nextbus.json'));


        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Stop': TEST_STOP_NAME }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'The next 62 bus will arrive in 5 minutes.');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should succeed with a stop name and bus number', function(done) {

        nock('https://api.wmata.com')
            .get('/NextBusService.svc/json/jPredictions?StopID=' + TEST_STOP_ID)
            .reply(200, require('./data/wmata.nextbus.json'));

        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Stop': TEST_STOP_NAME, 'Number': 63 }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'The next 63 bus will arrive in 13 minutes.');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

    it('should find no data with bad bus number', function(done) {

        nock('https://api.wmata.com')
            .get('/NextBusService.svc/json/jPredictions?StopID=' + TEST_STOP_ID)
            .reply(200, require('./data/wmata.nextbus.json'));

        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Stop': TEST_STOP_NAME, 'Number': 99 }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Sorry, but there are no 99 buses scheduled to arrive soon.');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });

});
