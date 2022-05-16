'use strict';

const express = require('express');
const { DatabaseConnectionError } = require('../models/carPartModelMysql');
const router = express.Router();
const routeRoot = '/';
const userModel = require('../models/userModel');
const logger = require('../logger');
const session = require('../models/sessionModel');

let LOGGED_IN_USER = null;

/**
 * Handles the request for logging in a user and forms the appropriate response.
 * @param {*} request 
 * @param {*} response 
 */
async function loginUser(request, response){
    // Getting the values
    let username = request.body.username;
    let password = request.body.password;

    try {
        let result = await userModel.validateLogin(username, password);

        // If the validation is successful
        if (result === true){
            // Create a session object that will expire in 2 minutes
            const sessionId = session.createSession(username, 2);

            // Save cookie that will expire.
            response.cookie("sessionId", sessionId, { expires: session.sessions[sessionId].expiresAt }); 
            response.cookie("userRole", await userModel.getRole(username));
            response.cookie("username", username);
            
            const pageData = {
                alertOccurred: true,
                alertMessage: `${username} has successfully logged in!`,
                alertLevel: 'success',
                alertLevelText: 'Success',
                alertHref: 'check-circle-fill',
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Log Out",
                endpointLogInLogOut: "login",
                loggedInUser: username
            }
            LOGGED_IN_USER = username;

            logger.info(`LOGGED IN user ${username} -- loginUser`);
            // Render the home page
            response.status(201).render('home.hbs', pageData);
        }
        else{
            // Error data for when an error occurs
            const errorData = {
                alertOccurred: true,
                alertMessage: "Invalid username or password.",
                alertLevel: 'danger',
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Log In',
                pathNameForActionForm: 'login',
                showConfirmPassword: false,
                oppositeFormAction: 'signup',
                oppositeFormName: 'Sign up',
                dontHaveAccountText: "Don't have an account?"
            }

            logger.info(`DID NOT LOG IN user ${username} because of validation failure -- loginUser`);
            response.status(404).render('loginsignup.hbs', errorData);
        }
            
    } catch(error) {

        // Error data for when an error occurs
        const errorData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            titleName: 'Log In',
            pathNameForActionForm: 'login',
            showConfirmPassword: false,
            oppositeFormAction: 'signup',
            oppositeFormName: 'Sign up',
            dontHaveAccountText: "Don't have an account?"
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof DatabaseConnectionError){
            errorData.alertMessage = "Error while connecting to database.";
            logger.error(`DatabaseConnectionError when LOGGING IN user ${username} -- loginUser`);
            response.status(500).render('loginsignup.hbs', {alertMessage: "Error while connecting to database."});
        }
        // If the error is an instance of the UserLoginError error
        else if (error instanceof userModel.UserLoginError){
            errorData.alertMessage = error.message;
            logger.error(`UserLoginError when LOGGING IN user ${username} -- loginUser`);
            response.status(404).render('loginsignup.hbs', errorData);
        }
        // If any other error occurs
        else {
            logger.error(`OTHER error when LOGGING IN user ${username} -- loginUser`);
            response.status(500).render('error.hbs', {message: `Unexpected error while trying to register user: ${error.message}`});
        }
    }
}

// Deletes the session cookie to logout the user
async function logoutUser(request, response){
    const authenticatedSession = authenticateUser(request);
    if (!authenticatedSession) {
        response.sendStatus(401); // Unauthorized access
        return;
    }
    delete session.sessions[authenticatedSession.sessionId]
    console.log("Logged out user " + authenticatedSession.userSession.username);
    
    response.cookie("sessionId", "", { expires: new Date() }); // "erase" cookie by forcing it to expire.
    response.redirect('/');

    logger.info(`SHOWING LOGIN information (login page) -- showLogin`);
    response.status(201).render('loginsignup.hbs', pageData);
}

async function showLogin(request, response) {

    // Page data 
    const pageData = {
        alertOccurred: false,
        titleName: 'Log In',
        pathNameForActionForm: 'login',
        showConfirmPassword: false,
        oppositeFormAction: 'signup',
        oppositeFormName: 'Sign up',
        dontHaveAccountText: "Don't have an account?",
        display_signup: "block",
        display_login: "block",
        logInlogOutText: "Log In",
        endpointLogInLogOut: "login"
    }

    response.status(201).render('loginsignup.hbs', pageData);
}

// Check if a user is logged in before granting them access to certain functions
function authenticateUser(request) {
    // If this request doesn't have any cookies, that means it isn't authenticated. Return null.
    if (!request.cookies) {
        return null;
    }
    // We can obtain the session token from the requests cookies, which come with every request
    const sessionId = request.cookies['sessionId']
    if (!sessionId) {
        // If the cookie is not set, return null
        return null;
    }
    // We then get the session of the user from our session map
    userSession = session.sessions[sessionId]
    if (!userSession) {
        return null;
    } // If the session has expired, delete the session from our map and return null
    if (userSession.isExpired()) {
        delete session.sessions[sessionId];
        return null;
    }
    return { sessionId, userSession }; // Successfully validated.
}


router.get('/users/login', showLogin)
router.post("/users/login", loginUser)
module.exports = {
    router,
    routeRoot,
    LOGGED_IN_USER
}

