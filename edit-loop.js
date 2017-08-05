const log = require('./logger').getLogger('EditLoop');
const fs = require('fs');
const Driver = require('./browser-driver');

class EditLoop {

    constructor() {
        log.debug('constructor');
        this.classifications = this.getClassifications();
        this.driver = new Driver();
    }

    init(email, password) {
        log.debug('init');
        return this.driver.login(email, password);
    }

    startEditing() {
        log.debug('startEditing');
        if (!Array.isArray(this.classifications) || this.classifications.length < 1) {
            console.log('No classified questions.');
            return;
        }
        this.startLooping();
    }

    startLooping() {
        log.debug('startLooping');
        let count = 0;
        let promise = Promise.resolve();
        while (this.classifications && this.classifications.length > count) {
            log.debug('startLooping', { count });
            count++;
            promise = promise
                .then(() => this.performEdits(this.classifications[0]))
                .catch(() => this.setEditingTimeout());
            if (count > 5) {
                return promise.then(() => this.setEditingTimeout());
            }
            }
        console.log('All classified questions were edited.');
    }

    performEdits(classification) {
        log.debug('performEdits', { classification });
        return this.driver.editQuestion(classification.id, classification.tagToBeRemoved)
            .then(isDone => {
                if (isDone) {
                    this.removeFirstClassification();
                    return Promise.resolve();
                } else {
                    return Promise.reject();
                }
            });
    }

    setEditingTimeout() {
        log.debug('setEditingTimeout');
        return new Promise(resolve => {
            this.timeout = setTimeout(() => {
                log.debug('timeout fulfilled');
                this.startEditing();
                return resolve();
            }, 3600000);
        });
    }

    getClassifications() {
        log.debug('getClassifications');
        const path = './classifications.json';
        let classifications;
        if (fs.existsSync(path)) {
            classifications = JSON.parse(fs.readFileSync(path));
        } else {
            classifications = null;
        }
        return classifications
    }

    removeFirstClassification() {
        const removed = this.classifications.splice(0, 1);
        log.debug('removeFirstClassification', {removed});
        if (Array.isArray(this.classifications)) {
            const path = './classifications.json';
            fs.writeFileSync(path, JSON.stringify(this.classifications, null, 4));
        }
    }

}


module.exports = EditLoop;