const inquirer = require('inquirer');

class CLI {

    selectMode() {
        const choices = [
            {value:'classification', name:'Classify questions whether tag removal is neccessary.', short:'classify questions'},
            {value:'tagremoval', name:'Automatically remove tags from the questions you have classified.', short:'remove tags'}, 
            {value:'reset', name:'Reset your Stackoverflow credentials.', short:'reset credentials'}, 
            {value:'loglevel', name:'Set loglevel.', short:'set loglevel'}, 
            {value:'quit', name:'Quit soate.', short:'quit'}
        ];
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

    cancelAutoRemoval() {
        const questions = [{
            name: 'cancel-autoremoval',
            type: 'confirm',
            message: `Auto tag removal in progress. Do you want to cancel?`
        }];
        return inquirer.prompt(questions);
    }

    getEmail() {
        const questions = [{
            name: 'email',
            type: 'input',
            validate: email => email && email.length > 4 && email.includes('@'),
            message: `What is your Stackoverflow mail address?`
        }];
        return inquirer.prompt(questions);
    }

    getPassword() {
        const questions = [{
            name: 'password',
            type: 'password',
            validate: password => password && password.length > 6,
            message: `What is your Stackoverflow password?`
        },
        {
            name: 'savepassword',
            type: 'confirm',
            default: false,
            message: 'Do you want to store (caution, cleartext!) your password locally?'
        }
    ];
        return inquirer.prompt(questions);
    }

    setLogLevel() {
        const questions = [{
            name: 'loglevel',
            type: 'list',
            choices: ['silly', 'debug', 'warn'],
            message: `What log level do you want to enable?`
        }];
        return inquirer.prompt(questions);
    }
}

module.exports = CLI;