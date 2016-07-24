'use strict';

let debug = require('debug')('betty:app'),
    express = require('express'),
    bodyParser = require('body-parser'),
    staticRoutes = require('./routes/static'),
    voiceRoutes = require('./routes/voice'),
    errorHandler = require('./routes/errorHandler')();


// ---------------- Primary Server Config --------------- //

debug('Creating express application and configuring');
let server = express();
server.set('port', process.env.PORT || 3000);

server.use(bodyParser.json({
    verify: function(req, res, buf) {
        req.rawBody = buf.toString();
    }
}));

debug('Setting up app routes');

server.use('/', staticRoutes);
server.use('/voice', voiceRoutes);


// ---------------- Error Handling ----------------- //

server.use(function(req, res, next) {
    let err = new Error('Sorry, but that is not a valid command');
    err.status = 404;
    return next(err);
});
server.use(errorHandler);


// ------------------- Shutdown cleanup ------------------ //

process.on('uncaughtException', function(err) {
    console.error('Uncaught exception:', err.message);
    console.error(err.stack);
    process.exit(err.status || 187);
});
process.on('SIGINT', function() {
    console.log('Exiting application from SIGINT', arguments);
    process.exit(188);
});
process.on('SIGTERM', function() {
    console.log('Exiting application from SIGTERM', arguments);
    process.exit(189);
});
process.on('exit', function(code) {
    if (code !== 0) {
        console.error('Closing connection with code:', code);
    }
});


// ------------------- Main Server Startup ------------------ //

if (require.main === module) {
    debug('Starting express application...');

    server.listen(server.get('port'), function() {
        console.info('Betty is listening on port ' + server.get('port'));
        global.bettyStartTime = (new Date()).getTime();
    });

} else {
    module.exports = server;
    global.bettyStartTime = (new Date()).getTime();
    debug('App required for tests');
}
