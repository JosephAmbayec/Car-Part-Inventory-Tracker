'use strict';

const express = require('express');
const app = express();
const {engine} = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const logger = require('./logger');
const pinohttp = require('pino-http');
var cookies = require("cookie-parser");

app.use(cookies());

app.engine('hbs', engine({ extname: '.hbs'}));
app.set('view engine', 'hbs');
app.set('views', './views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'))

const httpLogger = pinohttp({
  logger: logger
});
app.use(httpLogger);

// Make sure errorController is last!
const controllers = ['homeController', 'aboutController', 'carPartController', 'registrationController', 'loginController', 'projectsController', 'languageController', 'errorController'];

app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.json());
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));


// Register routes from all controllers 
//  (Assumes a flat directory structure and common 'routeRoot' / 'router' export)
controllers.forEach((controllerName) => {
    try {
        const controllerRoutes = require('./controllers/' + controllerName);
        app.use(controllerRoutes.routeRoot, controllerRoutes.router);
    } catch (error) {
      //fail gracefully if no routes for this controller
      console.log(error);
    }    
})

module.exports = app
