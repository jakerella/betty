'use strict';

module.exports = function() {
    
    function doLaunch(data, cb) {
        process.nextTick(function() {
            cb({
                response: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: 'Please tell me what you would like to know.'
                    },
                    shouldEndSession: false
                }
            });
        });
        
    }
    
    function doEndSession(data, cb) {
        process.nextTick(function() {
            cb({
                response: {
                    outputSpeech: {
                        type: 'PlainText',
                        text: 'Buh bye now.'
                    },
                    shouldEndSession: true
                }
            });
        });
    }
    
    function getNextBus(data, cb) {
        
        cb({
            response: {
                outputSpeech: {
                    type: 'PlainText',
                    text: 'The next bus is in infinity minutes.'
                },
                shouldEndSession: true
            }
        });
        
    }
    
    
    return {
        handleLaunchRequest: doLaunch,
        handleSessionEndedRequest: doEndSession,
        handleNextBus: getNextBus
    };
    
};