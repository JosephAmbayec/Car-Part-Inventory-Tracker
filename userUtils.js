'use strict';

const validator = require("validator/validator");
const model = require("./models/userModel");
const bcrypt = require('bcrypt');
const res = require("express/lib/response");

// Constants
const SALT_ROUNDS = 10;
const MAX_USERNAME_LENGTH = 15;
const MIN_USERNAME_LENGTH = 6;


//#region Validating

/**
 * Validates that the specified name is a valid username.
 * @param {*} name The specified name.
 * @returns True if the username is valid; otherwise false.
 */
function isValidUsername(name){

    // Checks if the length of the name is greater than the max username length
    if (name.length > MAX_USERNAME_LENGTH){
        return false;
    }

    // Checks if the length of the name is less than the min username length
    if (name.length < MIN_USERNAME_LENGTH){
        return false;
    }


    return true;
}

/**
 * Validates that the specified password is a valid password.
 * @param {*} password The specified password.
 * @returns True if the password is valid; otherwise false.
 */
function isValidPassword(password){
    // Checks if the password is a strong password
    if (!validator.isStrongPassword(password)){
        return false;
    }

    
    return true;
}

/**
 * Validates that the specified login information is valid.
 * @param {*} plain The data to be encrypted.
 * @param {*} hash The hash.
 * @returns Promise containing the comparison result.
 */
 async function validateLogin(plain, hash){
    const result = await bcrypt.compare(plain, hash.password);
    return result;
}

//#endregion

//#region Hashing

/**
 * Hashes the specified password.
 * @param {*} password The specified password.
 * @returns The hashed password.
 */
async function hashPassword(password){
    let hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
}

//#endregion


module.exports = {
    isValidUsername,
    isValidPassword,
    hashPassword,
    validateLogin
}