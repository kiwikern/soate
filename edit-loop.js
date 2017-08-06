const log = require('./logger').getLogger('EditLoop');
const fs = require('fs');
const Driver = require('./browser-driver');

class EditLoop {

    constructor() {
        log.debug('constructor()');
        this.wasCanceled = false;
        this.classifications = this.getClassifications();
        this.count = 0;
        this.classificationIndex = 0;
        this.driver = new Driver();
    }

    init(email, password) {
        log.debug('init()', {email});
        return this.driver.login(email, password).catch(() => Promise.reject());
    }

    startEditing() {
        log.debug('startEditing()');
        if (this.wasCanceled) {
            log.debug('startEditing(): was cancelled');
            return;
        }
        if (!Array.isArray(this.classifications) || this.classifications.length < 1) {
            console.log('All classified questions were edited.');
            return;
        }
        return this.startLooping();
    }

    startLooping() {
        log.debug('startLooping()', {count: this.count});
        if (this.count > 10) {
            log.debug('startLooping(): count exceeded');
            return this.setEditingTimeout();
        }
        this.count++;
        return this.performEdits(this.classifications[this.classificationIndex])
            .then(() => this.startEditing())
            .catch(() => this.setEditingTimeout());
    }

    performEdits(classification) {
        log.debug('performEdits()', { classification });
        return this.driver.editQuestion(classification.id, classification.tagToBeRemoved)
            .then(isDone => {
                if (isDone) {
                    if (isDone !== 'skip') {
                        console.log(`\nSuccessfully removed tag ${classification.tagToBeRemoved}.\n`);
                        this.removeFirstClassification(classification.id);
                    } else {
                        console.log('\nSkipped a question.\n')
                        this.classificationIndex++;
                    }
                    return Promise.resolve();
                } else {
                    log.debug('performEdits() unsuccessful');
                    return Promise.reject();
                }
            });
    }

    setEditingTimeout() {
        log.debug('setEditingTimeout()');
        console.log('\nEdit queues are full. Retrying in 1h.\n')
        this.count = 0;
        clearTimeout(this.timeout);
        if (this.wasCanceled) {
            log.debug('setEditingTimeout(): abort timeout')
            return true;
        }
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (this.wasCanceled) {
                    log.debug('setEditingTimeout(): interval is cancelling');
                    clearInterval(interval);
                    return resolve();
                }
            }, 500);
            this.timeout = setTimeout(() => {
                log.debug('setEditingTimeout(): timeout fulfilled');
                clearInterval(interval);
                this.startEditing();
                return resolve();
            }, 3600000);
        });
    }

    getClassifications() {
        log.debug('getClassifications()');
        const path = './classifications.json';
        let classifications;
        if (fs.existsSync(path)) {
            classifications = JSON.parse(fs.readFileSync(path));
        } else {
            classifications = null;
        }
        return classifications
    }

    removeFirstClassification(classificationId) {
        log.debug('removeFirstClassification()', {classificationId});
        if (this.classifications[this.classificationIndex] && this.classifications[this.classificationIndex].id === classificationId) {
            const removed = this.classifications.splice(0, 1);
            log.debug('removeFirstClassification()', {removed});
            const path = './classifications.json';
            fs.writeFileSync(path, JSON.stringify(this.classifications, null, 4));
        }
    }

    cancel() {
        log.debug('cancel()');
        this.wasCanceled = true;
        this.driver.close();
        clearTimeout(this.timeout);
    }

}


module.exports = EditLoop;