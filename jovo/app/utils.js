'use strict';
var assert = require('assert');
var jp = require('jsonpath');

function whoWon(yourChoice, myChoice) {
    // returns 'you', 'me' or 'noone'
    // 0 == rock
    // 1 == paper
    // 2 == scissors
    assert.ok(yourChoice == 0 || yourChoice == 1 || yourChoice == 2);
    assert.ok(myChoice == 0 || myChoice == 1 || myChoice == 2);
    
    if (yourChoice == myChoice) {
	return 'noone';
    }
    else {
	switch(myChoice) {
	case 0:
	    switch(yourChoice) {
	    case 1:
		return 'you';
		break;
	    case 2:
		return 'me';
	    }
	    break;

	case 1:
	    switch(yourChoice) {
	    case 0:
		return 'me';
		break;
	    case 2:
		return 'you';
	    }	    
	    break;

	case 2:
	    switch(yourChoice) {
	    case 0:
		return 'you';
		break;
	    case 1:
		return 'me';
	    }	    
	    break;
	    
	default:
	    throw new Error('I chose ' + myChoice + ', you chose ', yourChoice + ', but this should not happen');
	}
    }
}


function getInputTypeAttribute(i18n_models, langCode, inputType, attributeName, entity) {
    console.log("i18n_models[langCode] = ");
    console.log(i18n_models[langCode]);
    var inputType = jp.query(i18n_models[langCode], '$.inputTypes[?(@.name=="'+inputType+'")]')[0]
    console.log("inputType = ");
    console.log(inputType);
    var entity = jp.query(inputType, '$.values[?(@.value=="'+entity.value+'")]')[0]
    console.log("entity = ");
    console.log(entity);
    var result = entity[attributeName]
    console.log("result = ");
    console.log(result);
    return result;
}

module.exports.whoWon = whoWon;
module.exports.getInputTypeAttribute = getInputTypeAttribute;
