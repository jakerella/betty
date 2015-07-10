'use strict';

var debug = require('debug')('betty:echo:meta'),
    path = require('path'),
    url = require('url'),
    https = (process.env.NODE_ENV === 'development') ? require('http') : require('https'),
    Promise = require('bluebird'),
    pem = require('pem'),
    crypto = require('crypto');

var MAX_REQUEST_AGE = (process.env.NODE_ENV === 'development') ? (9999999) : (150 * 1000);

var readCertInfo = Promise.promisify(pem.readCertificateInfo),
    getPublicKey = Promise.promisify(pem.getPublicKey);


function VerifyError() {
    return require('./create-error-type').call(this, arguments);
}


function verifySignature(req) { return new Promise(function (resolve, reject) {
    var sigUrl, sigParsed, nowGMT, reqTimestamp;
    
    if (!req.headers.signaturecertchainurl || !req.headers.signature) {
        return reject(new VerifyError('Missing Echo signature headers on request'));
    }
    
    sigUrl = path.normalize(req.headers.signaturecertchainurl);
    sigUrl = sigUrl.replace(/^http(s?):\/([^\/])/, 'http$1://$2');
    
    debug('Cert data URL', sigUrl);
    
    sigParsed = url.parse(sigUrl);
    
    if (process.env.NODE_ENV !== 'development' &&
        (!/^https\:?$/.test(sigParsed.protocol) ||
        sigParsed.hostname.toLowerCase() !== 's3.amazonaws.com' ||
        !/^\/echo\.api\//i.test(sigParsed.path) ||
        (sigParsed.port && sigParsed.port !== 443))) {
        return reject(new VerifyError('Invalid Echo signature URL (' + req.headers.signaturecertchainurl + ')'));
    }
    
    nowGMT = convertToGMT(new Date()).getTime();
    reqTimestamp = convertToGMT(new Date(req.body.request && req.body.request.timestamp));
    reqTimestamp = (reqTimestamp && reqTimestamp.getTime()) || 0;
    
    if (!reqTimestamp || (nowGMT - reqTimestamp) > MAX_REQUEST_AGE) {
        return reject(new VerifyError('Stale Echo request sent (ts:' + reqTimestamp + ', diff:' + (nowGMT - reqTimestamp) + ')'));
    }
    
    debug('Verifying signature from URL:', sigUrl);
    
    https.get(sigUrl, function(res) {
        var certData = '';
        
        res.on('data', function(data) { certData += data; });
        
        res.on('end', function() {
            debug('Retrieved cert data');
            
            verifyCertificate(certData)
                .then(function(certParts) {
                    var verifier = crypto.createVerify('SHA1');
                    
                    verifier.update(req.rawBody);
                    
                    if (process.env.NODE_ENV === 'development' ||
                        verifier.verify(certData, req.headers.signature, 'base64')) {
                        resolve({
                            signatureUrl: sigUrl
                        });
                    } else {
                        reject(new VerifyError('Unable to verify request body with signature.'));
                    }
                    
                })
                .catch(reject);
            
        });

    }).on('error', reject);
     
}); }

function convertToGMT(d) {
    if (!d || !d.getTime()) {
        return null;
    }
    return new Date(d.getTime() + (d.getTimezoneOffset() * 60 * 1000));
}

function verifyCertificate(certData) { return new Promise(function (resolve, reject) {
    
    var csr;
    
    readCertInfo(certData)
        .then(function(certParts) {
            var nowGMT = convertToGMT(new Date()).getTime();
            
            debug(certParts);
            
            if (!certParts.validity ||
                certParts.validity.start > nowGMT ||
                certParts.validity.end < nowGMT) {
                return reject(new VerifyError('Echo certificate is no longer valid'));
            }
            
            if (!certParts.san ||
                !/(\'|\")echo\-api\.amazon\.com(\'|\")/.test(JSON.stringify(certParts.san))) {
                return reject(new VerifyError('Echo domain not present in certificate SAN'));
            }
            
            if (!certParts.issuer || !certParts.issuer.organization) {
                return reject(new VerifyError('Echo request certificate has no issuing organization'));
            }
            
            csr = certParts;
            
            return getPublicKey(certData);
        })
        .then(function(data) {
            debug('Retrieved public key from certificate chain');
            csr.pubKey = data.publicKey;
            resolve(csr);
        })
        .catch(reject);

}); }


// --------------- Public methods ----------------- //

function validateRequest(req, res, next) {
    var err = new VerifyError('Malformed request signature detected. Request logged.');
    err.status = 400;
    
    verifySignature(req)
        .then(function(data) {
            debug('Echo request verified using', data.signatureUrl);
            
            next();
        })
        .catch(function(e) {
            console.trace(e);
            console.error('Unable to verify request signature', req.ip);
            next(err);
        });
}


module.exports = function() {
    
    return {
        validateRequest: validateRequest
    };
    
};

