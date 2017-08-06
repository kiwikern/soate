const selenium = require('selenium-webdriver');
const By = selenium.By;
const until = selenium.until;
const log = require('./logger').getLogger('BrowserDriver');

class BrowserDriver {

	constructor() {
		log.debug('constructor()');
		this.driver = new selenium.Builder()
			.forBrowser('chrome')
			.build();
	}

	login(email, password) {
		log.debug('login()', { email });
		const url = 'https://stackoverflow.com/users/login';
		this.driver.get(url);
		return this.driver.findElement(By.css('body')).getText()
			.then(text => text.includes('You are already logged in') ? Promise.reject() : Promise.resolve())
			.then(() => this.performLogin(email, password));
	}

	performLogin(email, password) {
		log.debug('performLogin()', { email });
		this.driver.findElement(By.id('email')).sendKeys(email);
		this.driver.findElement(By.id('password')).sendKeys(password);
		this.driver.findElement(By.id('submit-button')).click()
		return this.driver.wait(until.elementLocated(By.css('.my-profile')));
	}

	/**
	* Deletes given tagToBeDeleted (either 'angular' or 'angularjs'), if question has both tags 
	* and there are no errors prohibiting question edits (e.g. too many edits in queue).
	*/
	editQuestion(questionId, tagToBeDeleted) {
		log.debug('editQuestion()', {questionId, tagToBeDeleted});
		this.driver.get(`https://stackoverflow.com/questions/${questionId}`);
		return this.driver.get(`https://stackoverflow.com/posts/${questionId}/edit`)
			.then(() => this.hasError())
			.then(() => this.hasBothTags())
			.then(() => this.deleteTag(tagToBeDeleted))
			.then(() => this.setSummary(tagToBeDeleted))
			.then(() => this.submit())
			.then(() => true)
			.catch(result => {
				log.debug('editTag: caught rejection', {result});
				return result;
			});
	}

	hasError() {
		log.debug('hasError()');
		return this.driver.findElement(By.css('body'))
			.then(body => body.getText())
			.then(text => {
				if (text.includes(`There is a pending suggested edit in the queue`)) {
					return Promise.reject('skip');
				} else if (text.includes(`You have too many pending edits.`)) {
					return Promise.reject(false);
				}
				else return Promise.resolve();
			})
	}

	getTags() {
		log.debug('getTags');
		const tags = this.driver.findElements(By.css('span.post-tag'));
		tags.then(t => log.debug(`found ${t.length} tags`));
		return tags;
	}

	hasBothTags() {
		log.debug('hasBothTags');
		return this.getTags()
			.then(tags => tags.map(span => span.getText()))
			.then(tagNames => Promise.all(tagNames))
			.then(tagNames => {
				log.debug('found tags', tagNames);
				if (tagNames.length === 0) {
					log.debug('no tags found');
					return Promise.reject(false);
				}
				return tagNames.includes('angular') && tagNames.includes('angularjs')
			})
			.then(result => {
				if (result) {
					log.debug('has both tags');
					return Promise.resolve();
				} else {
					log.debug('does not have both tags anymore.');
					return Promise.reject(true);
				}
			});
	}

	deleteTag(tagName) {
		log.debug('deleteTag');
		return this.driver.findElement(By.xpath(`//*[text() = "${tagName}"]/span`)).click();
	}

	setSummary(tagNameToBeDeleted) {
		log.debug('setSummery', {tagNameToBeDeleted});
		let summary;
		if (tagNameToBeDeleted === 'angular') {
			summary = 'removed angular tag, should only be used for Angular v2 or above';
		} else {
			summary = 'removed angularjs tag, should only be used for Angular 1.x';
		}
		return this.driver.findElement(By.id('edit-comment')).sendKeys(summary);
	}

	submit() {
		log.debug('submit');
		return this.driver.findElement(By.id('submit-button')).click();
	}

	close() {
		log.debug('close()')
		this.driver.close();
	}
}

module.exports = BrowserDriver;