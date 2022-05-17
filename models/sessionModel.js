const uuid = require('uuid');
const logger = require('../logger');

const sessions = {};

/**
 * Represents a session for when the user is on the website.
 */
class Session {
    /**
     * Instantiates a new instance of the session class.
     * @param {*} username The username of the user.
     * @param {*} expiresAt The expiry date of the session.
     */
    constructor(username, expiresAt) {
        this.username = username
        this.expiresAt = expiresAt

        logger.info(`SESSION constructor for username ${username} with expiry date ${expiresAt}`);
    }

    /**
     * True if the session has expired; otherwise false.
     */
    isExpired() {
        this.expiresAt < (new Date());
    }
}

/**
 * Creates a new session with the given information.
 * @param {*} username The username of the user.
 * @param {*} numMinutes The number of minutes the session should last for.
 * @returns The id of the created session.
 */
function createSession(username, numMinutes) {
    // Generate a random UUID as the sessionId
    const sessionId = uuid.v4()

    // Set the expiry time as numMinutes (in milliseconds) after the current time
    const expiresAt = new Date(Date.now() + numMinutes * 60000);
    // Create a session object containing information about the user and expiry time
    const thisSession = new Session(username, expiresAt);
    // Add the session information to the sessions map, using sessionId as the key
    sessions[sessionId] = thisSession;

    logger.info(`CREATED SESSION for username ${username} with expiry date ${expiresAt}`);

    return sessionId;
}


module.exports = {
    createSession, 
    sessions
}