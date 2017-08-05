const secrets = require('./secrets.json');
const url = 'https://stackexchange.com/oauth';
const port = '80';
const redirect_uri = `http://localhost`;
const opn = require('opn');
const express = require('express');
const app = express();
const router = express.Router();
const https = require("https");

class SOApi {

    constructor() {
        this.authenticate();
    }

    authenticate() {
        return new Promise((resolve, reject) => {
            opn(`${url}?client_id=${secrets.client_id}&redirect_uri=${redirect_uri}`);
            router.get('/', (req, res) => {
                const code = req.query.code;
                const access_token = req.query.access_token;
                console.log(code);
                console.log(access_token);
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
                            app.close();
                            reject();
                        }
                        res.on('data', data => {
                            const json = JSON.parse(data);
                            this.access_token = json.access_token;
                            this.expires = json.expires;
                            app.close();
                            resolve();
                        });
                    });
                    request.end();
                } else if (access_token) {
                    console.log(access_token);
                }
                res.send('Authenticating... You can close this window.');   
            });

            app.use('/', router);

            app.listen(port);
        });
    }
}

module.exports = SOApi;