'use strict';

var debug = require('debug')('echo:verify'),
    fs = require('fs'),
    path = require('path'),
    url = require('url'),
    https = (process.env.NODE_ENV === 'development') ? require('http') : require('https'),
    pem = require('pem'),
    crypto = require('crypto'),
    bluebird = require('bluebird');

var MAX_REQUEST_AGE = (process.env.NODE_ENV === 'development') ? (99999999) : (150 * 1000);

// --------------- Public methods ----------------- //

module.exports = function validateRequest(headers, rawBody, cb) {

    verifySignature(headers, rawBody)
        .then(cb)
        .catch(cb);
};


// --------------- Internal Workings --------------- //

var readFile = bluebird.promisify(fs.readFile),
    readCertInfo = bluebird.promisify(pem.readCertificateInfo),
    getPublicKey = bluebird.promisify(pem.getPublicKey);


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

            if (process.env.NODE_ENV !== 'development') {
                if (!certParts.validity ||
                    certParts.validity.start > nowGMT ||
                    certParts.validity.end < nowGMT) {
                    return reject(new Error('Echo certificate is no longer valid'));
                }
            }

            if (!certParts.san ||
                !/(\'|\")echo\-api\.amazon\.com(\'|\")/.test(JSON.stringify(certParts.san))) {
                return reject(new Error('Echo domain not present in certificate SAN'));
            }

            if (!certParts.issuer || !certParts.issuer.organization) {
                return reject(new Error('Echo request certificate has no issuing organization'));
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


function getCertData(sigUrl) { return new Promise(function (resolve, reject) {
    var filename = sigUrl.match(/^file\:(.+)/i);

    if (process.env.NODE_ENV === 'development' && filename) {

        readFile(filename[1])
            .then(function(certData) {
                debug('Retrieved cert data via file', filename[1]);
                resolve(certData.toString());
            })
            .catch(reject);

    } else {

        https.get(sigUrl, function(res) {
            var certData = '';
            res.on('data', function(data) { certData += data; });
            res.on('end', function() {
                debug('Retrieved cert data via HTTP call to', sigUrl);
                resolve(certData);
            });

        }).on('error', reject);
    }

}); }


function verifySignature(headers, rawBody) { return new Promise(function (resolve, reject) {
    var body, sigUrl, sigParsed, nowGMT, reqTimestamp, certData;

    try {
        body = JSON.parse(rawBody);
    } catch(e) {
        return reject(new Error('Echo request body is not valid JSON'));
    }

    if (!process.env.ECHO_APP_ID) {
        return reject(new Error('Echo application ID environment variable is not set.'));
    }
    if (!body.session || !body.session.application ||
        body.session.application.applicationId !== process.env.ECHO_APP_ID) {
        return reject(new Error('Echo request application ID does not match'));
    }

    if (!headers.signaturecertchainurl || !headers.signature) {
        return reject(new Error('Missing Echo signature headers on request'));
    }

    sigUrl = path.normalize(headers.signaturecertchainurl);
    sigUrl = sigUrl.replace(/^http(s?):\/([^\/])/, 'http$1://$2');

    debug('Cert data URL', sigUrl);

    sigParsed = url.parse(sigUrl);

    if (process.env.NODE_ENV !== 'development' &&
        (!/^https\:?$/.test(sigParsed.protocol) ||
        sigParsed.hostname.toLowerCase() !== 's3.amazonaws.com' ||
        !/^\/echo\.api\//i.test(sigParsed.path) ||
        (sigParsed.port && sigParsed.port !== 443))) {
        return reject(new Error('Invalid Echo signature URL (' + headers.signaturecertchainurl + ')'));
    }

    nowGMT = convertToGMT(new Date()).getTime();
    reqTimestamp = convertToGMT(new Date(body.request && body.request.timestamp));
    reqTimestamp = (reqTimestamp && reqTimestamp.getTime()) || 0;

    if (!reqTimestamp || (nowGMT - reqTimestamp) > MAX_REQUEST_AGE) {
        return reject(new Error('Stale Echo request sent (ts:' + reqTimestamp + ', diff:' + (nowGMT - reqTimestamp) + ')'));
    }

    debug('Verifying signature from URL:', sigUrl);

    getCertData(sigUrl)
        .then(function(cert) {
            certData = cert;
            return verifyCertificate(certData);
        })
        .then(function() {
            var verifier = crypto.createVerify('SHA1');

            verifier.update(rawBody);

            if (process.env.NODE_ENV === 'development' ||
                verifier.verify(certData, headers.signature, 'base64')) {

                debug('Echo request verified using', sigUrl);
                resolve();

            } else {
                reject(new Error('Unable to verify request body with signature.'));
            }

        })
        .catch(reject);

}); }
