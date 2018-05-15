'use strict';
var sprintf = require('sprintf-js').sprintf;

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const en = require('./i18n/en-US');
const fr = require('./i18n/fr-FR');
const nl = require('./i18n/nl-NL');

let languageResources = {
    'nl': nl,
    'nl-NL': nl,
    'fr': fr,
    'fr-FR': fr,
    'en': en,
    'en-US': en
}

// See https://www.jovo.tech/framework/docs/output/i18n
const config = {
    i18n: {
        overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
        load: 'all',
        returnObjects: true,
	resources: languageResources
    },
    logging: true,
};

const app = new App(config);

// Maybe superfluous
app.setLanguageResources(languageResources);

// =================================================================================
// App Logic
// =================================================================================

app.setHandler({
    'LAUNCH': function() {
        this.toIntent('RockPaperScissorsQuestionIntent');
    },

    'Default Fallback Intent': function() {
        this.toIntent('RockPaperScissorsQuestionIntent');
    },

    'Default Welcome Intent': function() {
        this.toIntent('RockPaperScissorsQuestionIntent');
    },

    'RockPaperScissorsQuestionIntent': function() {
	this.ask(this.speechBuilder().addT('RPS_QUESTION'));
    },

    'RockPaperScissorsChoiceIntent': function(rps) {
//	console.log(this.config.i18n.resources);
	let speech = this.speechBuilder().addT('YOU_CHOSE_RPS', {rps: rps.value});
//	console.log('rps =');
//	console.log(rps);
	this.tell(speech);
    }

});

module.exports.app = app;
