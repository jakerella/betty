
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
                if (!res.body.name || res.body.name !== 'betty') {
                    throw new Error('Application name is incorrect');
                }
                if (!res.body.purpose ||
                    res.body.purpose !== 'Deliver public transit information via Amazon Echo') {
                    throw new Error('Application purpose is incorrect');
                }
            })
            .expect(200, done);
    });
});
