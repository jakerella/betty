
var assert = require('assert'),
    request = require('supertest'),
    server = require('../server/app.js'),
    generate = require('./data/generate.js')('amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-0000000betty');

var LOCAL_CERT = 'file:///home/jordan/projects/betty/test/data/echo-api.pem',
    SIGNATURE = 'foobar';

function assertEchoResponseFormat(data) {
    assert.equal(data.version, '1.0');
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
                assert.equal(res.body.response.outputSpeech.text, 'Please tell me what you would like to know.');
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
                assert.equal(res.body.response.outputSpeech.text, 'Buh bye now.');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });
});

describe('NextBus intent with no slots', function() {
    
    it('should ask for a stop number', function(done) {
        request(server)
            .post('/voice/betty')
            .send(generate.getIntentRequest({ name: 'NextBus' }))
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'What bus stop are you asking about?');
                assert.equal(res.body.response.shouldEndSession, false);
            })
            .expect(200, done);
    });
    
    
});

