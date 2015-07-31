'use strict';

var debug = require('debug')('betty:user'),
    mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    echoId: { type: String, required: true, unique: true },
    createTme: { type: Date, default: Date.now },
    location: { type: String, default: 'WAS' },
    stops: [{ name: String, id: String }]
});

/**
 * Find a User by their Echo userId or create the record if
 * it doesn't exist.
 * 
 * @param  {[type]} echoId The Amazon Echo user ID to look for
 * @return {Promise}  The promise to listen on for this action
 */
UserSchema.statics.findOrCreate = function (echoId) {
    var promise,
        User = this;
    
    debug('Looking for user:', echoId);
    
    return User.find({ echoId: echoId })
        .then(function(records) {
            if (records && records.length) {
                promise = new mongoose.Promise();
                promise.complete(records[0]);
                return promise;
            }
            
            debug('Creating new user:', echoId);
            return User.create({ echoId: echoId });
        });
};


UserSchema.methods.getSavedStopId = function (stopName) {
    var stopId = null;
    
    if (this.stops && this.stops.length) {
        this.stops.forEach(function(stop) {
            if (stop.name === stopName) {
                stopId = stop.id;
            }
        });
    }
    
    return stopId;
};


module.exports = mongoose.model('user', UserSchema);
