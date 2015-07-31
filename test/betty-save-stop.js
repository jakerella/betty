
var assert = require('assert'),
    request = require('supertest'),
    server = require('../server/app.js'),
    User = require('../server/models/user.js'),
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

describe('SaveStop intent', function() {
    
    afterEach(function(done) {
        // Kill any test records created during testing
        User.remove(done);
    });
    
    it('should ask for a stop id and name if not given', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({ name: 'SaveStop' }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Please tell me the stop ID used by your transit system and the name you would like me to use for it.');
                assert.equal(res.body.response.shouldEndSession, false);
            })
            .expect(200, done);
    });
    
    it('should ask for a stop id and name if only id given', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'SaveStop',
                slots: { 'StopId': 123 }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Please tell me the stop ID used by your transit system and the name you would like me to use for it.');
                assert.equal(res.body.response.shouldEndSession, false);
            })
            .expect(200, done);
    });
    
    it('should ask for a numeric stop id if not given', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'SaveStop',
                slots: { 'StopId': 'foobar', 'Name': 'foobar' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Sorry, but currently the bus stop must be a numeric ID.');
                assert.equal(res.body.response.shouldEndSession, false);
            })
            .expect(200, done);
    });
    
    it('should respond successfully with correct input', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'SaveStop',
                slots: { 'StopId': 123, 'Name': 'foobar' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Okay, I saved stop 123 as foobar for you.');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });
    
});
