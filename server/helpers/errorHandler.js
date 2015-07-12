'use strict';

module.exports = function() {

    // We need to have this exact function signature, so disable the jshint
    // warning about `next` being unused
    /*jshint unused:false*/
    return function handleErrors(err, req, res, next) {
        var status = err.status || 500,
            msg = err.message || 'Oops, there was a problem processing your request. Can you try again?';
        
        if (status > 499) {
            console.error('Server Error:', err.stack);
            if (process.env.NODE_ENV === 'production') {
                msg = 'There was a problem processing your request. You can try again if you like.';
            }
        }
        
        res
            .status(status)
            .json({
                message: msg,
                status: status
            });
    };
    /*jshint unused:true*/

};
