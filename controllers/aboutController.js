'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const userModel = require('../models/userModel');
const loginController = require('./loginController');
const homeController = require('./homeController');

/**
 * Renders the about page.
 * @param {*} request 
 * @param {*} response 
 */
async function showAbout(request, response) {
    try {
        const lang = request.cookies.language;
        let login = loginController.authenticateUser(request);
        let signupDisplay, endpoint, logInText;
        let role;
    
        let pageData;
         
        // Set the login to the username if response is not null
        if (login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Log Out";
        }
        else {
            signupDisplay = "block";
            endpoint = "login";
            logInText = "Log In";
        }
    
        role = await userModel.determineRole(login);
        
        if (!lang || lang === 'en'){
            pageData = {
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                endpointLogInLogOut: endpoint,
                about_text: "About Us",
                signUpText: "Sign Up",
                Home: "Home",
                mainTitle: "Who are The Car Guys?",
                mainText:"We are a group of 2nd year Computer Science students with an interest in the automotive industry. Our shared interests lead us to come up with an inventory tracker so car enthusiasts alike can organize and keep track of their projects.",
                motivationTitle: "Our motivation and inspiration",
                motivationText: "Our motivation for this project was the lack of free user friendly inventory management systems. There's already a fair amount of inventory trackers out there, however most of them are only available for a ridiculous monthly fee. The handful of free inventory trackers offer limited functionality or have an ugly and terribly designed interface. Our inspiration for the design was a combination of what we gathered from a few of the paid inventory tracking systems and features we came up with after group discussions.",
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
                mainTitle: "Qui sont Les Car Guys ?",
                mainText: "Nous sommes un groupe d'étudiants en informatique de 2e année qui s'intéressent à l'industrie automobile. Nos intérêts communs nous ont amenés à proposer un outil de gestion des stocks afin que les passionnés d'automobiles puissent organiser leurs projets.",
                motivationTitle: "Notre motivation et inspiration",
                motivationText: "Notre motivation pour ce projet était le manque de systèmes de gestion d'inventaire conviviaux et gratuits. Il existe déjà un bon nombre de trackers d'inventaire, mais la plupart d'entre eux ne sont disponibles que moyennant des frais mensuels ridicules. La majorité des outils de gestion d'inventaire gratuits offrent des fonctionnalités limitées ou ont une interface utilisateur laide et terriblement conçue. Notre inspiration pour la conception était une combinaison de ce que nous avons recueilli à partir de quelques-uns des systèmes de suivi des stocks payants et des fonctionnalités que nous avons proposées après des discussions de groupe.",
                projects_text: "Projets",
                display_signup: signupDisplay,
                loggedInUser: login,
                logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                footerData: footerLangObject(lang)
            }
        }
    
            response.status(200).render('about.hbs', pageData);
    }
    catch (err) {
        console.log(err)
    }

    
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

router.get('/about', showAbout);


module.exports = {
    router,
    routeRoot
}
