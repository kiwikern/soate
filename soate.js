const figlet = require('figlet');
const chalk = require('chalk');
const CLI = require('./cli');
const opn = require('opn');
const fs = require('fs');

class Soate {

    constructor(threads) {
        this.cli = new CLI();
        this.showWelcome();
        this.startCLI();
        this.threads = threads;
    }

    showWelcome() {
        console.log(
            chalk.magenta(
                figlet.textSync('SOATE')
            )
        );
        console.log(
            chalk.cyan(
`View Stackoverflow questions that have both tags "angular" and "angularjs.
For each of them, mark one or none of the tags to be removed, then start auto removal.\n\n`)
        );
    }

    startCLI() {
        this.cli.selectMode()
            .then(result => {
                console.log('\n');
                const mode = result['mode-select'];
                if (mode === 'classification') {
                    this.startClassification(0).then(() => this.startCLI());
                } else if (mode === 'quit') {
                    return;
                } else {
                    console.log('Start auto stuff');
                }
            })
    }

    startClassification(index) {
        console.log('\nOpening Stackoverflow question in your browser...\n');
        opn(this.threads[index]);
        return this.cli.checkTags().then(result => {
            const selection = result['question-edit'];
            switch (selection) {
                case 'done':
                    console.log('Classification is done.\n')
                    return;
                case 'skip':
                    return this.startClassification(index + 1);
                case 'angular':
                case 'angularjs':
                    this.classifiy(this.threads[index], selection);
                    this.removeThread(index);
                    return this.startClassification(index);
                case 'none':
                    this.removeThread(index);
                    return this.startClassification(index);
            }
        });
    }

    classifiy(url, tagToBeRemoved) {
        const path = './classifications.json';
        let classifications;
        if (fs.existsSync(path)) {
            classifications = JSON.parse(fs.readFileSync(path));
        } else {
            classifications = [];
        }
        classifications.push({url, tagToBeRemoved});
        fs.writeFileSync(path, JSON.stringify(classifications, null, 4));
    }

    removeThread(index) {
        this.threads.splice(index, 1);
        fs.writeFileSync('./so-questions.json', JSON.stringify(this.threads, null, 4));
    }

}

module.exports = Soate;