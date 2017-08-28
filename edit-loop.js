const log = require('./logger').getLogger('EditLoop');
const fs = require('fs');
const Driver = require('./browser-driver');

class EditLoop {

    constructor() {
        log.silly('constructor()');
        this.wasCanceled = false;
        this.classifications = this.getClassifications();
        this.count = 0;
        this.classificationIndex = 0;
        this.driver = new Driver();
    }

    init(email, password) {
        log.silly('init()', {email});
        return this.driver.login(email, password).catch(() => Promise.reject());
    }

    startEditing() {
        log.silly('startEditing()');
        if (this.wasCanceled) {
            log.debug('startEditing(): was cancelled');
            return;
        }
        if (!Array.isArray(this.classifications) || this.classifications.length <= this.classificationIndex) {
            console.log('All classified questions were edited.');
            return;
        }
        return this.startLooping();
    }

    startLooping() {
        log.silly('startLooping()', {count: this.count});
        if (this.count > 40) {
            log.debug('startLooping(): count exceeded');
            return this.queueFullTimeout();
        }
        this.count++;
        return this.performEdits(this.classifications[this.classificationIndex])
            .then(() => this.startEditing())
            .catch(reason => {
                if (reason === 'retry') {
                    return this.nextQuestionTimeout();
                } else {
                    return this.queueFullTimeout();
                }
            } 
        );
    }

    performEdits(classification) {
        log.silly('performEdits()', {classification});
        return this.driver.editQuestion(classification.id, classification.tagToBeRemoved)
            .then(isDone => {
                if (isDone) {
                    log.debug('performEdits()', {isDone});
                    if (isDone === 'success') {
                        console.log(`\nSuccessfully removed tag ${classification.tagToBeRemoved}.\n`);
                        this.removeFirstClassification(classification.id);
                    } else if (isDone === 'not_both_tags') {
                        console.log(`\nDoes not have both tags: ${classification.id}.\n`);
                        this.removeFirstClassification(classification.id);
                    } else if (isDone === 'edit_restriction') {
                        console.log(`Found edit restriction. Retry in 30 seconds.`);
                        return Promise.reject('retry')
                    } else {
                        console.log(`\nSkipped question ${classification.id}. Will retry next time.\n`);
                        this.incrementSkipCount(classification.id);
                        this.classificationIndex++;
                    }
                    return Promise.resolve();
                } else {
                    log.debug('performEdits() unsuccessful');
                    return Promise.reject();
                }
            });
    }

    nextQuestionTimeout() {
        log.silly('nextQuestionTimeout()');
        this.setEditingTimeout(30000);
    }

    queueFullTimeout() {
        log.silly('queueFullTimeout()');
        console.log('\nEdit queues are full. Retrying in 1h.\n');
        this.count = 0;
        return this.setEditingTimeout(3600000);
    }

    setEditingTimeout(timeout = 1000) {
        log.silly('setEditingTimeout()', {timeout});
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
            }, timeout);
        });
    }

    getClassifications() {
        log.silly('getClassifications()');
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
        log.silly('removeFirstClassification()', {classificationId});
        if (this.classifications[this.classificationIndex] && this.classifications[this.classificationIndex].id === classificationId) {
            const removed = this.classifications.splice(this.classificationIndex, 1);
            log.debug('removeFirstClassification()', {removed});
            const path = './classifications.json';
            fs.writeFileSync(path, JSON.stringify(this.classifications, null, 4));
        }
    }

    incrementSkipCount(classificationId) {
        log.silly('incrementSkipCount()', {classificationId});
        if (this.classifications[this.classificationIndex] && this.classifications[this.classificationIndex].id === classificationId) {
            const newSkipCount = (this.classifications[this.classificationIndex].skipCount || 0) + 1;
            this.classifications[this.classificationIndex].skipCount = newSkipCount;
            log.debug('setSkipCount:', {newSkipCount});
            const path = './classifications.json';
            fs.writeFileSync(path, JSON.stringify(this.classifications, null, 4));
        }
    }

    cancel() {
        log.silly('cancel()');
        this.wasCanceled = true;
        this.driver.close();
        clearTimeout(this.timeout);
    }

}


module.exports = EditLoop;