'use strict';
var sprintf = require('sprintf-js').sprintf;
var jp = require('jsonpath');
var whoWon = require('./utils').whoWon;

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const prompts_en = require('./i18n/en-US');
const prompts_fr = require('./i18n/fr-FR');
const prompts_nl = require('./i18n/nl-NL');

let i18n_prompts = {
    'nl': prompts_nl,
    'nl-NL': prompts_nl,
    'fr': prompts_fr,
    'fr-FR': prompts_fr,
    'en': prompts_en,
    'en-US': prompts_en
}

const models_en = require('../models/en-US');
const models_fr = require('../models/fr-FR');
const models_nl = require('../models/nl-NL');

let i18n_models = {
    'nl': models_nl,
    'nl-NL': models_nl,
    'fr': models_fr,
    'fr-FR': models_fr,
    'en': models_en,
    'en-US': models_en    
}

// See https://www.jovo.tech/framework/docs/output/i18n
const config = {
    i18n: {
        overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
        load: 'all',
        returnObjects: true,
	resources: i18n_prompts,
	models: i18n_models // for my own use here
    },
    logging: true,
};

const app = new App(config);

app.setLanguageResources(i18n_prompts);

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
	console.log("this = ");
	console.log(this);
//	console.log("this.config.i18n.resources = ");
//	console.log(this.config.i18n.resources);
	console.log("this.config.i18n.models = ");
	console.log(this.config.i18n.models);
	var speech = this.speechBuilder().addT('YOU_CHOSE_RPS', {rps: rps.value});
	console.log('rps =');
	console.log(rps);
//	console.log('model = i18n_models');
//	console.log();

	// Get the user generic ID of the RPS chosen by the user from the i18N_models
	var langCode = this.requestObj.queryResult.languageCode;
	console.log("langCode = " + langCode);
	console.log("this.config.i18n.models[langCode] = ");
	console.log(this.config.i18n.models[langCode]);
	var rpsInputType = jp.query(this.config.i18n.models[langCode], '$.inputTypes[?(@.name=="myRockPaperScissorsInputType")]')[0]
	console.log("rpsInputType = ");
	console.log(rpsInputType);
	var rpsEntity = jp.query(rpsInputType, '$.values[?(@.value=="'+rps.value+'")]')[0]
	console.log("rpsEntity = ");
	console.log(rpsEntity);
	var rpsGenericId = rpsEntity.genericId
	console.log("rpsGenericId = ");
	console.log(rpsGenericId);

	var myChoice = Math.floor(Math.random() * Math.floor(3)) // 0, 1 or 2
	if (rpsGenericId == myChoice) {
	    speech.addT('ME_TOO');
	}
	else {
	    switch(myChoice) {
	    case 0:
		speech.addT('I_CHOSE_ROCK');
		break;
	    case 1:
		speech.addT('I_CHOSE_PAPER');
		break;	    
	    case 2:
		speech.addT('I_CHOSE_SCISSORS');
		break;
	    }
	}

	var winner = whoWon(rpsGenericId,myChoice);
	switch (winner) {
	case 'me':
	    speech.addT('I_WIN');
	    break;
	case 'you':
	    speech.addT('YOU_WIN');
	    break;
	case 'noone':
	    speech.addT('NOONE_WINS');
	    break;
	}

	this.tell(speech);
    }

});

module.exports.app = app;
