const fs = require('fs');
const log = require('./logger').getLogger('CredentialsManager');

class CredentialsManager {

    constructor() {
        log.silly('constructor()');
        this.path = './secrets.json';
    }

    getCredentials() {
        log.silly('getCredentials()');
        const secrets = this.getSecrets();
        const email = secrets.email;
        const password = secrets.password;
        return {email, password};
    }

    saveMail(email) {
        log.silly('saveMail()', {email});
        const secrets = this.getSecrets();
        secrets.email = email;
        fs.writeFileSync(this.path, JSON.stringify(secrets, null, 4));
    }

    savePassword(password) {
        log.silly('savePassword()', {passwordlength: password.length});
        const secrets = this.getSecrets();
        secrets.password = password;
        fs.writeFileSync(this.path, JSON.stringify(secrets, null, 4));
    }

    resetCredentials() {
        log.silly('resetCredentials()');
        const secrets = this.getSecrets();
        delete secrets.email;
        delete secrets.password;
        fs.writeFileSync(this.path, JSON.stringify(secrets, null, 4));
        console.log('\nYour credentials were deleted.\n');
    }

    getSecrets() {
        log.silly('getSecrets()');
        if (fs.existsSync(this.path)) {
            return JSON.parse(fs.readFileSync(this.path));
        } else {
            return {};
        }
    }
}

module.exports = CredentialsManager;