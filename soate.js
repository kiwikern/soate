const figlet = require('figlet');
const chalk = require('chalk');
const CLI = require('./cli');
const opn = require('opn');
const Classifier = require('./classifier');
const EditLoop = require('./edit-loop');
const CredentialsManager = require('./credentials-manager');
const log = require('./logger').getLogger('Soate');
const setLogLevel = require('./logger').setLogLevel;

class Soate {

    constructor() {
        this.cli = new CLI();
        this.showWelcome();
        this.startCLI();
        this.credentialManager = new CredentialsManager();
    }

    showWelcome() {
        console.log(
            chalk.magenta(
                figlet.textSync('SOATE')
            )
        );
        console.log(
            chalk.cyan(
                `View Stackoverflow questions that have both tags "angular" and "angularjs".
For each of them, mark one or none of the tags to be removed, then start auto removal.\n\n`)
        );
    }

    startCLI() {
        log.silly('startCLI()')
        this.cli.selectMode()
            .then(result => {
                console.log('\n');
                return result['mode-select'];
            }).then(mode => this.selectMode(mode));
    }

    selectMode(mode) {
        log.silly('selectMode()')
        switch(mode) {
            case 'classification':
                this.startClassification();
                break;
            case 'tagremoval':
                this.startAutoTagRemoval();
                break;
            case 'reset':
                this.credentialManager.resetCredentials();
                this.startCLI();
                break;
            case 'loglevel':
                  this.setLogLevel();
                  break;
            case 'quit':
            default:
                return console.log(chalk.magenta(figlet.textSync('BYE', 'Alpha')));
        }
    }

    startClassification() {
        log.silly('startClassification()');
        const classifier = new Classifier();
        classifier.startClassification()
            .then(() => this.startCLI());
    }
    
    startAutoTagRemoval() {
        log.silly('startAutoTagRemoval()');
        const credentials = this.credentialManager.getCredentials();
        Promise.resolve()
            .then(() => this.getEmail(credentials.email))
            .then(email => credentials.email = email)
            .then(() => this.getPassword(credentials.password))
            .then(password => credentials.password = password)
            .then(() => this.startEditLoop(credentials))
            .catch(() => {
                console.log(chalk.bgRed('\n\nLogin failed.\n'));
                return this.startCLI()
            });
    }

    getEmail(email) {
        log.silly('getEmail()', {email});
        if (email) {
            return email;
        } else {
            let mail;
            return this.cli.getEmail()
                .then(result => mail = result.email)
                .then(() => this.credentialManager.saveMail(mail))
                .then(() => mail);
        }
    }

    getPassword(password) {
        log.silly('getPassword()', {length: password ? password.length : 'undefined'});
        if (password) {
            return password;
        } else {
            return this.cli.getPassword()
                .then(result => {
                    const password = result.password;
                    if (result.savepassword) {
                        this.credentialManager.savePassword(password);
                    }
                    return password;
                })
        }
    }

    startEditLoop(credentials) {
        log.silly('startEditLoop()', {email: credentials.email});
        this.cli.cancelAutoRemoval()
            .then(() => editLoop.cancel())
            .then(() => console.log('\n'))
            .then(() => this.startCLI());
            
        const editLoop = new EditLoop();
        return editLoop.init(credentials.email, credentials.password)
            .then(() => editLoop.startEditing());
    }

    setLogLevel() {
        log.silly('setLoglevel()');
        this.cli.setLogLevel()
            .then(result => setLogLevel(result.loglevel))
            .then(() => console.log('\n'))
            .then(() => this.startCLI());
    }
}

module.exports = Soate;