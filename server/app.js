'use strict';

var debug = require('debug')('betty:app'),
    express = require('express'),
    bodyParser = require('body-parser'),
    staticRoutes = require('./routes/static'),
    voiceRoutes = require('./routes/voice');


// ---------------- Primary Server Config --------------- //

debug('Creating express application and configuring');
var server = express();
server.set('port', process.env.PORT || 3000);

server.use(bodyParser.json({
    verify: function(req, res, buf) {
        req.rawBody = buf.toString();
    }
}));


debug('Setting up app routes');

server.use('/', staticRoutes);
server.use('/voice', voiceRoutes);


debug('Setting up error handling');

server.use(function(req, res, next) {
    var err = new Error('Sorry, but that is not a valid command');
    err.status = 404;
    return next(err);
});
server.use(require('./helpers/errorHandler')());


// ------------------- Main Server Startup ------------------ //

if (require.main === module) {
    debug('Starting express application...');
    
    server.listen(server.get('port'), function() {
        console.info('Betty is listening on port ' + server.get('port'));
        global.bettyStartTime = (new Date()).getTime();
    });
    
} else {
    module.exports = server;
    debug('App required for tests');
}