'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const logger = require('../logger');
const homeController = require('./homeController');

/**
 * Renders the home page with the given error data.
 * @param {*} request 
 * @param {*} response 
 */
function sendError(request, response){
    const lang = request.cookies.language;
    let pageData;

    if (!lang || lang === 'en'){
        pageData = {
            errorCode: 404,
            alertMessage: "There was a slight error...",
            display_signup: signupDisplay,
            display_login: "block",
            logInlogOutText: logInText,
            endpointLogInLogOut: endpoint,
            about_text: "About Us",
            signUpText: "Sign Up",
            Home: "Home", 
            loggedInUser: login,
            projects_text: "Projects",
            footerData: footerLangObject(lang)
        }
    }
    else {
        pageData = {
            display_signup: "block",
            display_login: "block",
            endpointLogInLogOut: endpoint,
            projects_text: "Projets",
            about_text: "À propos de nous",
            signUpText: "Enregistrer",
            Home: "Accueil",
            projects_text: "Projets",
            display_signup: signupDisplay,
            loggedInUser: login,
            logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
            footerData: footerLangObject(lang)
        }
    }

    response.status(pageData.errorCode);
    logger.info(`RENDERING home page WITH Invalid URL ERROR -- sendError`);
    response.render('error.hbs', pageData);
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

router.all('*', sendError);


module.exports = {
    router,
    routeRoot
}

