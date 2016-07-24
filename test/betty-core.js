'use strict';

var path = require('path'),
    assert = require('assert'),
    request = require('supertest'),
    server = require('../server/app.js'),
    generate = require('./data/generate.js')('amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-0000000betty');

var LOCAL_CERT = 'file://' + path.resolve('test/data/echo-api.pem'),
    SIGNATURE = 'foobar';

function assertEchoResponseFormat(data) {
    assert.equal(data.version, '2.0');
    assert.ok(data.sessionAttributes);
    assert.ok(data.response);
    assert.equal(data.response.outputSpeech.type, 'PlainText');
    assert.equal(typeof data.response.shouldEndSession, 'boolean');
}

describe('launch and end betty', function(){
    it('should launch with question', function(done) {
        request(server)
            .post('/voice/betty')
            .send(generate.getLaunchRequest())
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.ok(res.body.response.outputSpeech.text.length > 1);
                assert.equal(res.body.response.shouldEndSession, false);
            })
            .expect(200, done);
    });

    it('should end with buh bye', function(done) {
        request(server)
            .post('/voice/betty')
            .send(generate.getEndRequest())
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.ok(res.body.response.outputSpeech.text.length > 1);
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });
});
