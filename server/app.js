'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    staticRoutes = require('./routes/static'),
    voiceRoutes = require('./routes/voice');


// ---------------- Primary Server Config --------------- //

var server = express();
server.set('port', process.env.PORT || 3000);

server.use(bodyParser.json());

server.use('/', staticRoutes);
server.use('/voice', voiceRoutes);

server.use(function(req, res, next) {
    var err = new Error('Sorry, but that is not a valid command');
    err.status = 404;
    return next(err);
});
server.use(require('./errorHandler')());


// ------------------- Main Server Startup ------------------ //

if (require.main === module) {

    server.listen(server.get('port'), function() {
        console.info('Betty is listening on port ' + server.get('port'));
    });
    
} else {
    module.exports = server;
}