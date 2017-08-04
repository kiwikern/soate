class TagEditor {

	constructor(document) {
		this.document = document;
		this.tags = Array.from(document.querySelectorAll('.post-tag'));
	}

	/**
	 * Deletes given tagToBeDeleted (either 'angular' or 'angularjs'), if question has both tags 
	 * and there are no errors prohibiting question edits (e.g. too many edits in queue).
	 */
	editTag(tagNameToBeDeleted) {
		let isDone;
		if (this.hasError()) {
			isDone = false;
		} else if (this.hasBothTags()) {
			this.deleteTag(tagNameToBeDeleted);
			this.setSummary(tagNameToBeDeleted);
			this.submit();
			isDone = true;
		} else {
			isDone = true;
		}
		return isDone; 
	}

	hasError() {
		const errorLinks = Array.from(this.document.querySelectorAll('#question a.js-error-click'));
		return errorLinks.map(a => a.innerText).includes('edit');
	}

	hasBothTags() {
		const tagNames = this.tags.map(span => span.innerText);
		return tagNames.includes('angular') && tagNames.includes('angularjs');
	}

	deleteTag(tagName) {
		const tag = this.tags.find(span => span.innerText === tagName);
		const children = Array.from(tag.childNodes);
		const deleteSpan = children.find(span => span.className === 'delete-tag');
		deleteSpan.click();
	}

	setSummary(tagNameToBeDeleted) {
		let summary;
		if (tagNameToBeDeleted === 'angular') {
			summary = 'removed angular tag, should only be used for Angular v2 or above';
		} else {
			summary = 'removed angularjs tag, should only be used for Angular 1.x';
		}
		this.document.querySelector('#edit-comment').value = summary;
	}

	submit() {
		this.document.querySelector('#submit-button').click();
	}
}

module.exports.TagEditor;