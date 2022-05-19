const logger = require('../logger');
const model = require('../models/sessionModel');
const { DatabaseConnectionError } = require('../models/carPartModelMysql');
const express = require('express')();
const app = express;

/**
 * Creates a new session with the given information.
 * @param {*} username The username of the user.
 * @param {*} numMinutes The number of minutes the session should last for.
 * @returns The id of the created session.
 */
async function createSession(username, numMinutes) {
    try{
        let sessionId = await model.createSession(username, numMinutes)  
        logger.info(`CREATED sessionId for user ${username} -- createUser`);      
        return sessionId;
    }
    catch(error){
        const data = {
            alertMessage: `Unexpected error while trying to create sessionId for user: ${error.message}`,
            errorCode: 500
        }
        errorData.alertMessage = data.message;
        logger.error(`error when CREATING sessionId for user ${username} -- createUser`);
        app.get('/'), (request, response)=>{
            response.status(500).render('error.hbs', data);
        }
    }
}


module.exports = {
    createSession
}