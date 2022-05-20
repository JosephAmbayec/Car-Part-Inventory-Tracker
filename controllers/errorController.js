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
    const error = {
        errorCode: 404,
        alertMessage: "There was a slight error..."
    }

    response.status(error.errorCode);
    logger.info(`RENDERING home page WITH Invalid URL ERROR -- sendError`);
    response.render('error.hbs', error);
}

router.all('*', sendError);


module.exports = {
    router,
    routeRoot
}

