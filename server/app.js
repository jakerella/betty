'use strict';

var debug = require('debug')('betty:app'),
    express = require('express'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
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


// ------------------- Shutdown cleanup ------------------ //

function cleanup() {
    debug('Performing app cleanup');
    mongoose.disconnect(function(err) {
        if (err) {
            console.error('Unable to close connection to Mongo:', err.message);
            console.error(err.stack);
        }
    });
}

process.on('uncaughtException', function(err) {
    console.error('Uncaught exception:', err.message);
    console.error(err.stack);
    cleanup();
    process.exit(err.code || 3);
});
process.on('SIGINT', function() {
    console.log('Exiting application from SIGINT', arguments);
    cleanup();
    process.exit(1);
});
process.on('SIGTERM', function() {
    console.log('Exiting application from SIGTERM', arguments);
    cleanup();
    process.exit(1);
});
process.on('exit', function(code) {
    if (code !== 0) {
        console.error('Closing connection with code:', code);
    }
    cleanup();
});



// ------------------- Main Server Startup ------------------ //

// Connect to mongo
if ( !process.env.BETTY_DB_URL ) {
    throw new Error('No MongoDB connection URL was provided.');
}
debug('Mongo connection URL', process.env.BETTY_DB_URL);
mongoose.connect(process.env.BETTY_DB_URL, {
    server: { keepAlive: 1 }
}, function(err) {
    if (err) {
        console.error('Unable to open connection to Mongo.');
        throw err;
    }
});


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