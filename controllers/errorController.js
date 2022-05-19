'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const logger = require('../logger');

/**
 * Renders the home page with the given error data.
 * @param {*} request 
 * @param {*} response 
 */
function sendError(request, response){
    response.status(404);
    logger.info(`RENDERING home page WITH Invalid URL ERROR -- sendError`);
    response.render('error.hbs');
}

router.all('*', sendError);


module.exports = {
    router,
    routeRoot
}

