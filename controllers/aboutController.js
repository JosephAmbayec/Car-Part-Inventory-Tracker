'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const logger = require('../logger');

/**
 * Renders the about page.
 * @param {*} request 
 * @param {*} response 
 */
function showAbout(request, response) {
    const pageData = {
        display_signup: "block",
        display_login: "block",
        logInlogOutText: "Log In",
        endpointLogInLogOut: "login",
        projects_text: "Projects",
        about_text: "About Us",
        signUpText: "Sign Up",
        Home: "Home",
    }

    logger.info(`RENDERING about page -- showAbout`);
    response.status(200).render('about.hbs', pageData);
}

router.get('/about', showAbout);


module.exports = {
    router,
    routeRoot
}
