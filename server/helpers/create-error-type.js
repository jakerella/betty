'use strict';

/**
 * Use this module to create new types of errors with the correct
 * file and line number where the error object was generated.
 * 
 * To use:
    function CustomError() { require('./create-error-type').apply(this, [].slice.call(arguments)); }
    require('util').inherits(CustomError, Error);
 */
module.exports = function customErrorConstructor(msg, status) {
    Error.captureStackTrace(this, this);
    this.message = msg || this.constructor.name || 'Application Error';
    this.status = status || 500;
};