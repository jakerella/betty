'use strict';

/**
 * Use this module to create new types of errors with the correct
 * file and line number where the error object was generated.
 * 
 * To use:
 function CustomError() {
    return require('./create-error-type').call(this, arguments);
 }
 */

module.exports = function createErrorType(args) {
    var err = Error.call(this, args[0]);
    
    if (!err.lineNumber) {
        var lineGetter = new Error(),
            pieces = lineGetter.stack
                .split(/\n/)[3]
                .match(/\s*at (?:([^\(]+) \()?([^\:]+)\:(\d+)\:(\d+)/);
        
        if (pieces) {
            err.method = pieces[1];
            err.file = pieces[2];
            err.lineNumber = pieces[3];
            err.colNumber = pieces[4];
        }
    }
    
    return err;
};