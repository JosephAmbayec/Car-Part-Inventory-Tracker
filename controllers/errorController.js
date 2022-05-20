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
    
    const error = {
        errorCode: 404,
        alertMessage: "There was a slight error...",
        footerData: footerLangObject(lang)
    }

    response.status(error.errorCode);
    logger.info(`RENDERING home page WITH Invalid URL ERROR -- sendError`);
    response.render('error.hbs', error);
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

