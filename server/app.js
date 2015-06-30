'use strict';

var path = require('path'),
    express = require('express'),
    staticPages = require('./routes/static'),
    voice = require('./routes/voice');


// ---------------- Primary Server Config --------------- //

var server = express();
server.set('port', process.argv[2] || 8989);

server.use('/', staticPages);
server.use('/api', voice);

server.use(function(req, res, next) {
    var err = new Error('Sorry, but that is not a valid command');
    err.status = 404;
    return next(err);
});
server.use(require('./errorHandler')());


// ------------------- Main Server Startup ------------------ //

server.listen(server.get('port'), function() {
    console.info('Betty is listening on port ' + server.get('port'));
});
