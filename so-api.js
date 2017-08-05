const secrets = require('./secrets.json');
const url = 'https://stackexchange.com/oauth';
const apiUrl = 'https://api.stackexchange.com/2.2/questions';
const port = '80';
const redirect_uri = `http://localhost`;
const opn = require('opn');
const express = require('express');
const router = express.Router();
const https = require('https');
const request = require('request');
const log = require('./logger').getLogger('SOApi');

class SOApi {

    constructor() {
        this.app = express();
    }

    getTags(questionId) {
        log.debug('getTags', {questionId});
        const options = {
            uri: `${apiUrl}/${questionId}?site=stackoverflow&key=${secrets.key}&access_token=${this.access_token}`,
            method: 'GET',
            gzip: true
        };
        return new Promise((resolve, reject) => {
            request(options, (err, res, body) => {
                if (err) {
                    console.error('getTags:', err);
                    return reject();
                }
                try {
                    return resolve(JSON.parse(body).items[0].tags);
                } catch(error) {
                    log.error('getTags: could not parse body', body);
                    return reject(error);
                }
                });
            });
    }

    setTags(questionId, tags) {
        log.debug('setTags', {questionId, tags})
        const options = {
            url: `${apiUrl}/${questionId}/edit`,
            formData: {
                site: 'stackoverflow',
                key: secrets.key,
                access_token: this.access_token,
                tags: tags

            }
        };
        log.error('setTags uri', options.uri)
        return new Promise((resolve, reject) => {
            request.post(options, (err, res, body) => {
                    if (!err) {
                        // TODO: Handle response if edit not allowed.
                        resolve();
                    } else {
                        log.debug('could not edit question', error)
                        reject(error);
                    }
                });
            
            return reject();
            });
    }

    authenticate() {
        log.debug('authenticate');
        return new Promise((resolve, reject) => {
            opn(`${url}?client_id=${secrets.client_id}&redirect_uri=${redirect_uri}&scope=write_access`);
            router.get('/', (req, res) => {
                const code = req.query.code;
                if (code) {
                    const options = {
                        host: 'stackexchange.com',
                        path: `/oauth/access_token/json?` +
                        `code=${code}&redirect_uri=${redirect_uri}` +
                        `&client_id=${secrets.client_id}&client_secret=${secrets.client_secret}`,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    };
                    const request = https.request(options, res => {
                        res.setEncoding('utf8');
                        if(res.statusCode === 400) {
                            console.log('Got error, auth did not work.');
                            this.server.close();
                            log.error('authenticatoin failed')
                            reject();
                        }
                        res.on('data', data => {
                            const json = JSON.parse(data);
                            this.access_token = json.access_token;
                            this.expires = json.expires;
                            this.server.close();
                            log.debug('authenticate finish', {access_token: this.access_token});
                            resolve();
                        });
                    });
                    request.end();
                } else if (access_token) {
                    console.log(access_token);
                }
                res.send('Authenticating... You can close this window.');   
            });

            this.app.use('/', router);

            this.server = this.app.listen(port);
        });
    }
}

module.exports = SOApi;