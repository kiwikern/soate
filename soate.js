const figlet = require('figlet');
const chalk = require('chalk');
const CLI = require('./cli');
const opn = require('opn');
const fs = require('fs');
const Classifier = require('./classifier');
const EditLoop = require('./edit-loop');
const secrets = require('./secrets.json');

class Soate {

    constructor() {
        this.cli = new CLI();
        this.showWelcome();
        this.startCLI();
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
        this.cli.selectMode()
            .then(result => {
                console.log('\n');
                const mode = result['mode-select'];
                if (mode === 'classification') {
                    const classifier = new Classifier();
                    classifier.startClassification(0).then(() => this.startCLI());
                } else if (mode === 'quit') {
                    return;
                } else {
                    const editLoop = new EditLoop();
                    editLoop.init(secrets.email, secrets.password)
                        .then(() => editLoop.startEditing());
                    this.cli.cancelAutoRemoval()
                        .then(() => editLoop.cancel())
                        .then(() => console.log('\n'))
                        .then(() => this.startCLI());
                }
            })
    }

}

module.exports = Soate;