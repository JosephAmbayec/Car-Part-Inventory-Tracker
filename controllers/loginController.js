'use strict';

const express = require('express');
const { DatabaseConnectionError } = require('../models/carPartModelMysql');
const router = express.Router();
const routeRoot = '/';
const userModel = require('../models/userModel');
const session = require('./sessionController');
const sessionModel = require('../models/sessionModel');
const homeController = require('../controllers/homeController');

/**
 * Handles the request for logging in a user and forms the appropriate response.
 * @param {*} request 
 * @param {*} response 
 */
async function loginUser(request, response) {
    // Getting the values
    let username = request.body.username;
    let password = request.body.password;
    let signupDisplay, endpoint, logInText;
    let login = authenticateUser(request);

    // Set the login to the username if response is not null
    if(login != null) {
        login = login.userSession.username;
        signupDisplay = "none";
        endpoint = "logout";
        logInText = "Log Out";
    }
    else{
        signupDisplay = "block";
        endpoint = "login";
        logInText = "Log In";
    }

    try {
        let result = await userModel.validateLogin(username, password);

        // If the validation is successful
        if (result === true) {

            // Create a session object that will expire in 2 minutes
            let sessionId = await session.createSession(username, 20);

            // Save cookie that will expire.
            response.cookie("sessionId", sessionId, { expires: sessionModel.sessions[sessionId].expiresAt });
            response.cookie("userRole", await userModel.getRole(username));
            response.cookie("username", username);

            let pageData;

            const lang = request.cookies.language;

            if (!lang || lang === 'en') {
                pageData = {
                    alertOccurred: true,
                    alertMessage: `${username} has successfully logged in!`,
                    alertLevel: 'success',
                    alertLevelText: 'Success',
                    alertHref: 'check-circle-fill',
                    display_signup: "none",
                    display_login: "block",
                    logInlogOutText: "Log Out",
                    signUpText: "Sign Up",
                    endpointLogInLogOut: "login",
                    loggedInUser: username,
                    Add: "Add a Car part",
                    Show: "Find a Car Part",
                    List: "Show all Car Parts",
                    Edit: "Update a Car Part",
                    Delete: "Delete a Car Part",
                    projects_text: "Projects",
                    about_text: "About Us",
                    Current: "English",
                    footerData: footerLangObject(lang)
                }
            }
            else {
                pageData = {
                    alertOccurred: true,
                    alertMessage: `${username} s'est connecté avec succès!`,
                    alertLevel: 'success',
                    alertLevelText: 'Success',
                    alertHref: 'check-circle-fill',
                    display_signup: "none",
                    display_login: "block",
                    signUpText: "Enregistrer",
                    endpointLogInLogOut: "login",
                    Add: "Ajouter une Pièce Auto",
                    Show: "Trouver une Pièce Auto",
                    List: "Afficher Toutes les Pièces de Voiture",
                    Edit: "Mettre à Jour une Pièce Auto",
                    Delete: "Supprimer une Pièce Auto",
                    projects_text: "Projets",
                    about_text: "À propos de nous",
                    Current: "French",
                    footerData: footerLangObject(lang),
                    logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                    loggedInUser: login,
                    Home : "Accueil",
                    Current: "French"
                }
            }

            response.status(201).redirect('/parts');
        }
        else {
            // Error data for when an error occurs
            let errorData;
            const lang = request.cookies.language;

            if (!lang || lang === 'en') {
                errorData = {
                    alertOccurred: true,
                    alertMessage: "Invalid username or password.",
                    alertLevel: 'danger',
                    alertLevelText: 'Danger',
                    alertHref: 'exclamation-triangle-fill',
                    titleName: 'Log In',
                    pathNameForActionForm: 'login',
                    showConfirmPassword: false,
                    signUpText: "Sign Up",
                    oppositeFormAction: 'signup',
                    oppositeFormName: 'Sign up',
                    dontHaveAccountText: "Don't have an account?",
                    footerData: footerLangObject(lang),
                    endpointLogInLogOut: endpoint,
                    about_text: "About Us",
                    projects_text: "Projects",
                    Home: "Home",
                    logInlogOutText: logInText,
                    loggedInUser: login,
                }
            }
            else {
                errorData = {
                    alertOccurred: true,
                    alertMessage: "Nom d'utilisateur ou mot de passe invalide.",
                    alertLevel: 'danger',
                    alertLevelText: 'Danger',
                    alertHref: 'exclamation-triangle-fill',
                    titleName: 'Connexion',
                    pathNameForActionForm: 'login',
                    showConfirmPassword: false,
                    signUpText: "Enregistrer",
                    oppositeFormAction: 'signup',
                    oppositeFormName: 'Enregistrer',
                    dontHaveAccountText: "Vous n'avez pas de compte?",
                    footerData: footerLangObject(lang),
                    endpointLogInLogOut: endpoint,
                    logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                    loggedInUser: login,
                    projects_text: "Projets",
                    about_text: "À Propos de Nous",
                    Home : "Accueil",
                    Current: "French"
                }
            }


            response.status(404).render('loginsignup.hbs', errorData);
        }

    } catch (error) {

        let errorData;
        const lang = request.cookies.language;
        
        // Error data for when an error occurs
        if (!lang || lang === 'en') {
            errorData = {
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
                signUpText: "Sign Up",
                dontHaveAccountText: "Don't have an account?",
                alertMessage: "",
                errorCode: "",
                footerData: footerLangObject(lang)
            }
        }
        else {
            errorData = {
                alertOccurred: true,
                alertMessage: "",
                alertLevel: 'danger',
                signUpText: "Sign Up",
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Connexion',
                pathNameForActionForm: 'login',
                showConfirmPassword: false,
                oppositeFormAction: 'signup',
                oppositeFormName: 'Enregistrer',
                dontHaveAccountText: "Vous n'avez pas de compte?",
                alertMessage: "",
                errorCode: "",
                footerData: footerLangObject(lang),
                projects_text: "Projets",
                about_text: "À Propos de Nous",
                Home : "Accueil",
                Current: "French"
            }
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof DatabaseConnectionError) {
            errorData.alertMessage = "There was an error connecting to the database."
            response.status(500).render('error.hbs', errorData);
        }
        // If the error is an instance of the UserLoginError error
        else if (error instanceof userModel.UserLoginError) {
            errorData.alertMessage = error.message;
            response.status(404).render('loginsignup.hbs', errorData);
        }
        // If any other error occurs
        else {
            errorData.alertMessage = `Unexpected error while trying to log in user: ${error.message}`,
            errorData.errorCode = 500;
            response.status(500).render('error.hbs', errorData);
        }
    }
}

// Deletes the session cookie to logout the user
async function logoutUser(request, response) {
    const authenticatedSession = authenticateUser(request);

    // If unauthorized access
    if (!authenticatedSession || authenticatedSession === null) {
        response.redirect('/parts');
    }
    // If valid access
    else{
        delete sessionModel.sessions[authenticatedSession.sessionId]
        response.cookie("sessionId", "", { expires: new Date() }); // "erase" cookie by forcing it to expire.
        response.redirect('/parts');

        const lang = request.cookies.language;

        // Page data 
        let pageData;

        if (!lang || lang === 'en') {
            pageData = {
                alertOccurred: false,
                Home: 'Home',
                titleName: 'Log In',
                pathNameForActionForm: 'login',
                showConfirmPassword: false,
                oppositeFormAction: 'signup',
                oppositeFormName: 'Sign up',
                dontHaveAccountText: "Don't have an account?",
                display_signup: "block",
                display_login: "block",
                logInlogOutText: "Log In",
                signUpText: "Sign Up",
                endpointLogInLogOut: "login",
                usernameHeader: "Username",
                passwordHeader: "Password",
                about_text: "About Us",
                footerData: footerLangObject(lang)
            }
        }
        else {
            pageData = {
                alertOccurred: false,
                Home: 'Accueil',
                titleName: 'Connexion',
                pathNameForActionForm: 'login',
                showConfirmPassword: false,
                oppositeFormAction: 'signup',
                oppositeFormName: 'Enregistrer',
                dontHaveAccountText: "Vous n'avez pas de compte?",
                display_signup: "block",
                display_login: "block",
                logInlogOutText: "Connexion",
                signUpText: "Enregistrer",
                endpointLogInLogOut: "login",
                usernameHeader: "Nom D'utilisateur",
                passwordHeader: "Mot de Passe",
                about_text: "À propos de nous",
                footerData: footerLangObject(lang)
            }
        }

        // response.status(201).render('loginsignup.hbs', pageData);
    }
}

async function showLogin(request, response) {
    const lang = request.cookies.language;

    // Page data 
    let pageData;

    if (!lang || lang === 'en') {
        pageData = {
            alertOccurred: false,
            Home: 'Home',
            titleName: 'Log In',
            pathNameForActionForm: 'login',
            showConfirmPassword: false,
            oppositeFormAction: 'signup',
            oppositeFormName: 'Sign up',
            dontHaveAccountText: "Don't have an account?",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Log In",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            usernameHeader: "Username",
            passwordHeader: "Password",
            about_text: "About Us",
            footerData: footerLangObject(lang)
        }
    }
    else {
        pageData = {
            alertOccurred: false,
            Home: 'Accueil',
            titleName: 'Connexion',
            pathNameForActionForm: 'login',
            showConfirmPassword: false,
            oppositeFormAction: 'signup',
            oppositeFormName: 'Enregistrer',
            dontHaveAccountText: "Vous n'avez pas de compte?",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Connexion",
            signUpText: "Enregistrer",
            endpointLogInLogOut: "login",
            usernameHeader: "Nom D'utilisateur",
            passwordHeader: "Mot de Passe",
            about_text: "À propos de nous",
            footerData: footerLangObject(lang)
        }
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
    let userSession = sessionModel.sessions[sessionId]
    if (!userSession) {
        return null;
    } // If the session has expired, delete the session from our map and return null
    if (userSession.isExpired()) {
        delete session.sessions[sessionId];
        return null;
    }
    return { sessionId, userSession }; // Successfully validated.
}

/* #region Helper */

/**
 * Helper function to display footer information in specified language.
 * @param {*} lang The specified language.
 * @returns Object containing the footer information.
 */
 function footerLangObject(lang){
    if (!lang || lang === 'en') {
        const footerData = {
            footer_home_title: "Home Page",
            footerHomeText: "Home",
            footer_whoAreWe: "Who are the car guys?",
            footerAboutText: "Learn more",
            footer_getAccess: "Get access to projects",
            footer_logIn: "Log In",
            footer_signUp: "Sign Up"
        }

        return footerData;
    }
    else{
        const footerData = {
            footer_home_title: "Page D'accueil",
            footerHomeText: "Accueil",
            footer_whoAreWe: "Qui sommes nous?",
            footerAboutText: "Apprendre plus",
            footer_getAccess: "Accéder aux Projets",
            footer_logIn: "Connexion",
            footer_signUp: "Enregistrer"
        }

        return footerData;
    }
}

/* #endregion */

router.get('/users/login', showLogin)
router.post("/users/login", loginUser)
router.get('/users/logout', logoutUser)


module.exports = {
    router,
    routeRoot,
    authenticateUser
}

