const logger = require('../logger');
const model = require('../models/sessionModel');
const { DatabaseConnectionError } = require('../models/carPartModelMysql');

/**
 * Creates a new session with the given information.
 * @param {*} username The username of the user.
 * @param {*} numMinutes The number of minutes the session should last for.
 * @returns The id of the created session.
 */
async function createSession(username, numMinutes) {
    try{
        let sessionId = await model.createSession(username, numMinutes)
        
        return sessionId;
    }
    catch(error){
        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof DatabaseConnectionError){
            errorData.alertMessage = "Error while connecting to database.";
            logger.error(`DatabaseConnectionError when CREATING sessionId for user ${username} -- createUser`);
            response.status(500).render('users.hbs', {alertMessage: "Error while connecting to database."});
        }
        // If any other error occurs
        else {
            logger.error(`OTHER error when CREATING sessionId for user ${username} -- createUser`);
            response.status(500).render('error.hbs', {message: `Unexpected error while trying to create sessionId for user: ${error.message}`});
        }
    }
}


module.exports = {
    createSession
}