'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const partController = require('./carPartController');

/**
 * Creates a language cookie and re-directs back to home page.
 * @param {*} request 
 * @param {*} response 
 */
function createLanguageCookie(request, response){
    // Get the language
    const lang = request.body.language;

    // If the language is specified, create a cookie for it
    if (lang) {
        response.cookie('language', lang);
    }

    // Re-direct page to home page
    response.redirect("/");
};

router.post('/language', createLanguageCookie);


module.exports = {
    routeRoot,
    router
}