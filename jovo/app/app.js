'use strict';

// =================================================================================
// App Configuration
// =================================================================================

const {App} = require('jovo-framework');

const config = {
    logging: true,
};

const app = new App(config);


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
        this.ask('Rock, paper or scissors? Pick one',
		 'Rock, paper or scissors?');
    },

    'RockPaperScissorsChoiceIntent': function(rps) {
        this.tell('You chose ' + rps.value + '!',
		  'You picked ' + rps.value + '!',
		  'OK, ' + rps.value + ' you chose!');
    }

});

module.exports.app = app;
