const CLI = require('./cli');
const opn = require('opn');
const fs = require('fs');

class Classifier {

    constructor() {
        this.cli = new CLI();
        this.threads = JSON.parse(fs.readFileSync('./so-questions.json'));
    }
    
    startClassification(index) {
        console.log('\nOpening Stackoverflow question in your browser...\n');
        opn('https://stackoverflow.com/questions/' + this.threads[index]);
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

    classifiy(id, tagToBeRemoved) {
        const path = './classifications.json';
        let classifications;
        if (fs.existsSync(path)) {
            classifications = JSON.parse(fs.readFileSync(path));
        } else {
            classifications = [];
        }
        classifications.push({id, tagToBeRemoved});
        fs.writeFileSync(path, JSON.stringify(classifications, null, 4));
    }

    removeThread(index) {
        this.threads.splice(index, 1);
        fs.writeFileSync('./so-questions.json', JSON.stringify(this.threads, null, 4));
    }

}

module.exports = Classifier;