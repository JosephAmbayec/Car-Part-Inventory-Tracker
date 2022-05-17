'use strict';

const validator = require("./node_modules/validator/validator.js");
const logger = require('./logger');

/**
 * Validates that the specified car part name is an alphanumeric string.
 * @param {*} name The name of the car part.
 * @returns True if the name is an alphanumeric string; otherwise false.
 */
function isValid(name){
    if (validator.isAlphanumeric(name,  ['en-US'], {'ignore': ' _-'})){
        logger.info(`IS an alphanumeric string ${name} - car part name -- isValid`);
        return true;
    }
    else{
        logger.info(`NOT an alphanumeric string ${name} - car part name  -- isValid`);
        return false;
    }
}

/**
 * Validates that the specified car part number is numeric.
 * @param {*} partNumber The part number of the car part.
 * @returns True if the part number is numeric; otherwise false.
 */
function isPartNumber(partNumber){ 
    if (validator.isNumeric(partNumber.toString())){
        logger.info(`IS an numeric ${partNumber} - car part name  -- isPartNumber`);
        return true;
    }
    else{
        logger.info(`NOT an numeric ${partNumber} - car part name  -- isPartNumber`);
        return false;
    }
}

/**
 * Validates that the specified string is a valid URL.
 * https://thispointer.com/javascript-check-if-string-is-url/
 * @param {*} string The specified string to validate.
 * @returns True if the specified string is a valid URL; otherwise false.
 */
function isURL(string) {
    if (string == undefined)
        return false;
    if (validator.isEmpty(string))
        return false;
    const matchpattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm;
    logger.info(`Currently validating url ${string} -- isPartNumber`);
    return matchpattern.test(string);
}

/**
 * Checks if the specified string is empty.
 * @param {*} string The specified string.
 * @returns True if the specified string is empty; otherwise false.
 */
function stringIsEmpty(string){
    if (string == ""){
        logger.info(`IS empty string ${string} - checks if string is empty-- stringIsEmpty`);
        return true;
    }
    else{
        logger.info(`NOT an empty string ${string} - checks if string is empty-- stringIsEmpty`);
        return false;
    }
}


module.exports = {
    isValid,
    isPartNumber,
    isURL,
    stringIsEmpty
}
