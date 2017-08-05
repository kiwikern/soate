const selenium = require('selenium-webdriver');
const By = selenium.By;
const until = selenium.until;
const map = selenium.map;
const log = require('./logger').getLogger('BrowserDriver');

class BrowserDriver {

	constructor() {
		this.driver = new selenium.Builder()
			.forBrowser('chrome')
			.build();
	}

	login(email, password) {
		log.debug('login', { email });
		const url = 'https://stackoverflow.com/users/login';
		this.driver.get(url);
		this.driver.findElement(By.id('email')).sendKeys(email);
		this.driver.findElement(By.id('password')).sendKeys(password);
		this.driver.findElement(By.id('submit-button')).click();
		this.driver.wait(until.titleIs('Stack Overflow'));
	}

	editQuestion(questionId, tagToBeDeleted) {
		this.driver.get(`https://stackoverflow.com/questions/${questionId}`);
		this.editTag(tagToBeDeleted);
	}

	/**
	* Deletes given tagToBeDeleted (either 'angular' or 'angularjs'), if question has both tags 
	* and there are no errors prohibiting question edits (e.g. too many edits in queue).
	*/
	editTag(tagNameToBeDeleted) {
		return this.hasError()
			.then(() => this.clickOnEdit())
			.then(() => this.hasBothTags())
			.then(() => this.deleteTag(tagNameToBeDeleted))
			.then(() => this.setSummary(tagNameToBeDeleted))
			.then(() => this.submit())
			.catch(result => {
				log.debug('editTag: caught rejection', {result});
			});

	}

	hasError() {
		log.debug('hasError()');
		return this.driver.findElements(By.css('#question a.js-error-click'))
			.then(links => {
					log.debug('found links', {links});
				if (links.length === 0) {
					return Promise.resolve();
				} else {
					Promise.reject(false);
				}
			});
	}

	getTags() {
		log.debug('getTags');
		return this.driver.findElements(By.css('span.post-tag'));
	}

	hasBothTags() {
		log.debug('hasBothTags');
		return this.getTags()
			.then(tags => tags.map(span => span.getText()))
			.then(tagNames => Promise.all(tagNames))
			.then(tagNames => tagNames.includes('angular') && tagNames.includes('angularjs'))
			.then(result => {
				if (result) {
					log.debug('has both tags');
					return Promise.resolve()
				} else {
					log.debug('does not have both tags anymore.');
					return Promise.reject(true)
				}
			});
	}

	clickOnEdit() {
		log.debug('clickOnEdit');
		return this.driver.findElement(By.css('#question .suggest-edit-post')).click();
	}

	deleteTag(tagName) {
		log.debug('deleteTag');
		this.driver.findElement(By.xpath(`//*[text() = "${tagName}"]/span`)).click();
	}

	setSummary(tagNameToBeDeleted) {
		log.debug('setSummery', {tagNameToBeDeleted});
		let summary;
		if (tagNameToBeDeleted === 'angular') {
			summary = 'removed angular tag, should only be used for Angular v2 or above';
		} else {
			summary = 'removed angularjs tag, should only be used for Angular 1.x';
		}
		this.driver.findElement(By.id('edit-comment')).sendKeys(summary);
	}

	submit() {
		log.debug('submit');
		this.driver.findElement(By.id('submit-button')).click();
	}
}

module.exports = BrowserDriver;