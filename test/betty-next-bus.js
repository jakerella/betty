
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

describe('NextBus intent', function() {
    
    it('should ask for a stop if not given', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({ name: 'NextBus' }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'What bus stop are you asking about?');
                assert.equal(res.body.response.shouldEndSession, false);
            })
            .expect(200, done);
    });
    
    it('should fail if the stop is not saved', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Stop': 'foobar' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert.equal(res.body.response.outputSpeech.text, 'Sorry, but I don\'t know about that bus stop, have you saved it yet?');
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });
    
    it('should succeed with just a stop name', function(done) {
        var agent = request(server);
        
        agent.post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'SaveStop',
                slots: { 'StopId': 123, 'Name': 'foobar' }
            }))
            .end(function() {
                agent.post('/voice/betty')
                    .set('SignatureCertChainUrl', LOCAL_CERT)
                    .set('Signature', SIGNATURE)
                    .send(generate.getIntentRequest({
                        name: 'NextBus',
                        slots: { 'Stop': 'foobar' }
                    }))
                    .expect(function(res) {
                        assertEchoResponseFormat(res.body);
                        assert.equal(res.body.response.outputSpeech.text, 'The next 62 bus is in 5 minutes');
                        assert.equal(res.body.response.shouldEndSession, true);
                    })
                    .expect(200, done);
            });
    });

    it('should succeed with a stop name and bus number', function(done) {
        request(server)
            .post('/voice/betty')
            .set('SignatureCertChainUrl', LOCAL_CERT)
            .set('Signature', SIGNATURE)
            .send(generate.getIntentRequest({
                name: 'NextBus',
                slots: { 'Stop': 'foobar', 'Number': '62' }
            }))
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assertEchoResponseFormat(res.body);
                assert(/The next 62 bus is in \d+ minutes?/.test(res.body.response.outputSpeech.text));
                assert.equal(res.body.response.shouldEndSession, true);
            })
            .expect(200, done);
    });
    
});