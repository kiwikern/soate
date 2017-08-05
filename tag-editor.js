const SOApi = require('./so-api');
const log = require('./logger').getLogger('TagEditor');

class TagEditor {

	constructor() {
		this.api = new SOApi();
	}

	init() {
		log.debug('init started');
		return this.api.authenticate();
	}

	/**
	 * Deletes given tagToBeDeleted (either 'angular' or 'angularjs'), if question has both tags 
	 * and there are no errors prohibiting question edits (e.g. too many edits in queue).
	 */
	editTag(questionId, tagNameToBeDeleted) {
		log.debug('editTag:', {questionId, tagNameToBeDeleted})
		return this.api.getTags(questionId)
			.then(tags => {
				if (this.hasBothTags(tags)) {
					const newTags = tags.filter(tag => tag !== tagNameToBeDeleted);
					return this.api.setTags(questionId, newTags)
						.then(() => true)
						.catch(() => false);
				} else {
					return Promise.resolve(true);
				}
		});
	}

	hasBothTags(tags) {
		log.debug('hasBothTags', {tags});
		return tags.includes('angular') && tags.includes('angularjs');
	}
}


module.exports = TagEditor;