const inquirer = require('inquirer');

class CLI {

    selectMode() {
        const choices = ['auto tag removal', 'classification', 'quit'];
        const questions = [{
            name: 'mode-select',
            type: 'list',
            message: `What do you want to do?`,
            choices: choices,
            validate: input => choices.includes(input)
        }];
        return inquirer.prompt(questions);
    }

    checkTags() {
        const choices = ['angularjs', 'angular', 'none', 'skip', 'done'];
        const questions = [{
            name: 'question-edit',
            type: 'list',
            message: `Which tag should be removed?`,
            choices: choices,
            validate: input => choices.includes(input)
        }];
        return inquirer.prompt(questions);
    }
}

module.exports = CLI;