'use strict';
var sprintf = require('sprintf-js').sprintf;
var whoWon = require('./utils').whoWon;
var getInputTypeAttribute = require('./utils').getInputTypeAttribute;

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
    'nl-nl': models_nl,
    'nl-NL': models_nl,
    'fr': models_fr,
    'fr-fr': models_fr,
    'fr-FR': models_fr,
    'en': models_en,
    'en-us': models_en,
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
	this.setSessionAttribute('NrGamesWonByUser', 0);
	this.setSessionAttribute('NrGamesWonByAssistant', 0);
	this.setSessionAttribute('NrDraws', 0);
        this.toStateIntent('GameState', 'RockPaperScissorsQuestionIntent');	
    },

    'Default Fallback Intent': function() {
        this.toStateIntent('GameState', 'RockPaperScissorsQuestionIntent');	
    },

    'Default Welcome Intent': function() {
        this.toStateIntent('GameState', 'RockPaperScissorsQuestionIntent');	
    },

    'GameState': {

	'RockPaperScissorsQuestionIntent': function() {
	    this.ask(this.speechBuilder().addT('RPS_QUESTION'));
	},
	
	'RockPaperScissorsChoiceIntent': function(rps) {

	    console.log("Inside 'GameState.RockPaperScissorsChoiceIntent'");
	    
	    if (rps.value == undefined || rps.value == null || rps.value == '') {
		console.log("No valid RPS choice!!");
		this.toIntent('RockPaperScissorsQuestionIntent');
		return;
	    };
	    
	    var speech = this.speechBuilder().addT('YOU_CHOSE_RPS', {rps: rps.value});

	    // Get the user generic ID of the RPS chosen by the user from the i18N_models
	    var rpsGenericId = getInputTypeAttribute(this.config.i18n.models, 
						     this.requestObj.queryResult.languageCode, 
						     'myRockPaperScissorsInputType', 
						     'genericId',
						     rps);
	    
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
		this.setSessionAttribute('NrGamesWonByAssistant', this.getSessionAttribute('NrGamesWonByAssistant') + 1);
		speech.addT('I_WIN');
		break;
	    case 'you':
		this.setSessionAttribute('NrGamesWonByUser', this.getSessionAttribute('NrGamesWonByUser') + 1);
		speech.addT('YOU_WIN');
		break;
	    case 'noone':
		this.setSessionAttribute('NrDraws', this.getSessionAttribute('NrDraws') + 1);
		speech.addT('NOONE_WINS');
		break;
	    }
	    
	    speech.addBreak('800ms');
	    speech.addT('RPS_QUESTION')
	    this.ask(speech);
	    
	},

	'RockPaperScissorsShowScore': function() {
	    var speech = this.speechBuilder().addT('SHOW_SCORE', {you: this.getSessionAttribute('NrGamesWonByUser'),
								  you_s: this.getSessionAttribute('NrGamesWonByUser') == 1 ? '':'s',
								  me: this.getSessionAttribute('NrGamesWonByAssistant'),
								  me_s: this.getSessionAttribute('NrGamesWonByAssistant') == 1 ? '':'s',
								  draw: this.getSessionAttribute('NrDraws'),
								  draw_s: this.getSessionAttribute('NrDraws') == 1 ? '':'s'
								 });
	    
	    speech.addBreak('300ms');

	    if (this.getSessionAttribute('NrGamesWonByUser') < this.getSessionAttribute('NrGamesWonByAssistant')) {
		speech.addT('I_WIN_SOFAR');
	    }
	    else if (this.getSessionAttribute('NrGamesWonByUser') > this.getSessionAttribute('NrGamesWonByAssistant')) {
		speech.addT('YOU_WIN_SOFAR');
	    }
	    else {	
		speech.addT('NOONE_WINS_SOFAR');
	    }
	    
	    speech.addBreak('800ms');
	    speech.addT('RPS_QUESTION')
	    this.ask(speech);
	}
	
    }
    
});
 
module.exports.app = app;
