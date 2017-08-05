const log = require('./logger').getLogger('EditLoop');
const TagEditor = require('./tag-editor');
const fs = require('fs');

class EditLoop {

	constructor() {
        log.debug('constructor');
        this.classifications = this.getClassifications();
        this.tagEditor = new TagEditor();
	}

	startEditing() {
        log.debug('startEditing');
        if (!Array.isArray(this.classifications) || this.classifications.length < 1) {
            console.log('No classified questions.');
            return;
        }
        this.tagEditor.init()
            .then(() => this.startLooping());
    }
    
    startLooping() {
        log.debug('startLooping');
        let count = 0;
        while(this.classifications && this.classifications.length > 0) {
            log.debug('startLooping', {count});            
            if (count >= 1) {
                this.setEditingTimeout();
                return;
            } else {
                count++;
                this.performEdits(this.classifications[0]);
            }
        }
        console.log('All classified questions were edited.');
        if (this.timeout) {
            this.timeout.clear();
        }
    }

    performEdits(classification) {
        log.debug('performEdits', {classification});
        return this.tagEditor.editTag(classification.id, classification.tagToBeRemoved)
            .then(isDone => {
                if (isDone) {
                    this.classifications.splice(0, 1);
                    this.setClassifications();
                } else {
                    this.setEditingTimeout();
                }
            });
    }

    setEditingTimeout() {
        log.debug('setEditingTimeout');
        this.timeout = setTimeout(() => this.startEditing, 60000);
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

    setClassifications() {
        log.debug('setClassifications', this.classifications);
        if (Array.isArray(this.classifications)) {
            fs.writeFileSync(path, JSON.stringify(this.classifications, null, 4));
        }
    }

}


module.exports = EditLoop;