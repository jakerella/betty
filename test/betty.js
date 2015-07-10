
var assert = require('assert'),
    request = require('supertest'),
    server = require('../server/app.js'),
    generate = require('./data/generate.js')('amzn1.echo-sdk-ams.app.000000-d0ed-0000-ad00-0000000betty');

describe('launch betty', function(){
    it('should respond with question', function(done) {
        request(server)
            .post('/voice/betty')
            .send(generate.getLaunchRequest())
            .set('SignatureCertChainUrl', 'http://localhost:3000/echo-api.pem')
            .set('Signature', 'foobar')
            .expect('Content-Type', /json/)
            .expect(function(res) {
                assert.equal(res.body.version, '1.0');
                assert.equal(res.body.response.outputSpeech.text, 'Please tell me what you would like to know.');
                assert.equal(res.body.response.shouldEndSession, false);
            })
            .expect(200, done);
    });
});
