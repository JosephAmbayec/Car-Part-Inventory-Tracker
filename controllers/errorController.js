const express = require('express');
const router = express.Router();
const routeRoot = '/';

/**
 * Renders the home page with the given error data.
 * @param {*} request 
 * @param {*} response 
 */
function sendError(request, response){
    response.status(404);
    response.render('home.hbs', {alertMessage: 'Invalid URL entered.  Please try again.'});
}

router.all('*', sendError);


module.exports = {
    router,
    routeRoot
}

