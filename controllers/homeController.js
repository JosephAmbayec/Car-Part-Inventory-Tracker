'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const partController = require('./carPartController');
const logger = require('../logger');

const cookieParser = require("cookie-parser")
router.use(cookieParser());

/**
 * GET controller method that outputs the home view
 * @param {*} request 
 * @param {*} response 
 */
function sendHome(request, response) {
    // Getting the values
    const justRegistered = request.cookies.justRegistered;
    const lang = request.cookies.language;
    let pageData;

    // If the user just registered
    if (justRegistered == 'true') {
        const username = request.cookies.username;
        response.cookie('justRegistered', 'false');
        logger.info(`COOKIE CREATED for user ${username}, rendering home page -- sendHome`);
    }

    if (!lang || lang === 'en') {
        pageData = {
            Home: "Home",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Log In",
            endpointLogInLogOut: "login",
            signUpText: "Sign Up",
            Current: "English",
            Add: "Add a Car part",
            Show: "Find a Car Part",
            List: "Show all Car Parts",
            Edit: "Update a Car Part",
            Delete: "Delete a Car Part"
        }
    }
    else{
        pageData = {
            Home: "Accueil",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Connexion",
            endpointLogInLogOut: "login",
            signUpText: "Enregistrer",
            Current: "French",
            Add: "Ajouter une Pièce Auto",
            Show: "Trouver une Pièce Auto",
            List: "Afficher Toutes les Pièces de Voiture",
            Edit: "Mettre à Jour une Pièce Auto",
            Delete: "Supprimer une Pièce Auto"
        }
    }

    logger.info(`RENDERING home page -- sendHome`);
    response.status(200).render('home.hbs', pageData);
}

/**
 * Form POST method that displays a form based on the user's selection
 * @param {*} request 
 * @param {*} response 
 */
function showForm(request, response) {
    // Gets the choice value for the button that was clicked
    switch (request.body.choice) {
        // Case of adding a car part
        case 'add':
            logger.info(`SWITCH CASE add -- showForm`);
            showAddForm(response);
            break;

        // Case of finding a car part
        case 'show':
            logger.info(`SWITCH CASE show (find) -- showForm`);
            showListOneForm(response);
            break;

        // Case of getting all car parts
        case 'list':
            logger.info(`SWITCH CASE list (all) -- showForm`);
            response.redirect('/parts');
            break;

        // Case of updating a car part
        case 'edit':
            logger.info(`SWITCH CASE update -- showForm`);
            showEditForm(response);
            break;

        // Case of deleting a car part
        case 'delete':
            logger.info(`SWITCH CASE delete -- showForm`);
            showDeleteForm(response);
            break;

        // Default case
        default:
            logger.info(`SWITCH CASE default -- showForm`);
            response.render('home.hbs');
    }
}
/**
 * Displays the add car part form
 * @param {*} response 
 */
function showAddForm(response) {
    let lang = response.req.cookies.language;

    let pageData;

    if (!lang || lang === 'en') {
        pageData = {
            Home: "Home",
            showForm: true,
            endpoint: "/parts",
            method: "post",
            Current: "English",
            legend: "Please enter details for new car part: ",
            formfields: [{ field: "partNumber", pretty: "Part Number", type: "number", required: "required" },
            { field: "name", pretty: "Part Name", required: "required" }, { field: "condition", pretty: "Condition" }, { field: "image", pretty: "Image URL" }],
            Submit: "Submit",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Log In",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            Add: "Add a Car part",
            Show: "Find a Car Part",
            List: "Show all Car Parts",
            Edit: "Update a Car Part",
            Delete: "Delete a Car Part"
        }
    }
    else {
        pageData = {
            Home: "Accueil",
            showForm: true,
            endpoint: "/parts",
            method: "post",
            Current: "French",
            legend: "Veuillez entrer les détails de la nouvelle pièce de voiture: ",
            formfields: [{ field: "partNumber", pretty: "Numéro de Pièce", type: "number", required: "required" },
            { field: "name", pretty: "Nom de la Pièce", required: "required" }, { field: "condition", pretty: "État" }, { field: "image", pretty: "URL de L'image" }],
            Submit: "Soumettre",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Connexion",
            signUpText: "Enregistrer",
            endpointLogInLogOut: "login",
            Add: "Ajouter une Pièce Auto",
            Show: "Trouver une Pièce Auto",
            List: "Afficher Toutes les Pièces de Voiture",
            Edit: "Mettre à Jour une Pièce Auto",
            Delete: "Supprimer une Pièce Auto"
        }
    }

    logger.info(`RENDERING home page WITH ADDING form -- showAddForm`);
    response.render('home.hbs', pageData);
}

/**
 * Displays the show car part form
 * @param {*} response 
 */
function showListOneForm(response) {
    let lang = response.req.cookies.language;

    let pageData;

    if (!lang || lang === 'en') {
        pageData = {
            Home: "Home",
            showForm: true,
            endpoint: "/parts",
            submitfn: "this.action = this.action + '/'+ this.partNumber.value",
            method: "GET",
            methodOverride: "GET",
            Current: "English",
            legend: "Please enter the part number to display: ",
            formfields: [{ field: "partNumber", pretty: "Original Part Number", type: "number" }],
            Submit: "Submit",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Log In",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            Add: "Add a car part",
            Show: "Find a Car Part",
            List: "Show all Car Parts",
            Edit: "Update a Car Part",
            Delete: "Delete a Car Part"
        };
    }
    else {
        pageData = {
            Home: "Accueil",
            showForm: true,
            endpoint: "/parts",
            submitfn: "this.action = this.action + '/'+ this.partNumber.value",
            method: "GET",
            methodOverride: "GET",
            Current: "French",
            legend: "Veuillez entrer le numéro de pièce à afficher: ",
            formfields: [{ field: "partNumber", pretty: "Numéro De Pièce", type: "number" }],
            Submit: "Soumettre",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Connexion",
            signUpText: "Enregistrer",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            Add: "Ajouter une Pièce Auto",
            Show: "Trouver une Pièce Auto",
            List: "Afficher Toutes les Pièces de Voiture",
            Edit: "Mettre à Jour une Pièce Auto",
            Delete: "Supprimer une Pièce Auto"
        };
    }



    logger.info(`RENDERING home page WITH FIND form -- showListOneForm`);
    response.render('home.hbs', pageData);
}

/**
 * Displays the update car part form
 * @param {*} response 
 */
function showEditForm(response) {
    let lang = response.req.cookies.language;

    let pageData;

    if (!lang || lang === 'en') {
        pageData = {
            Home: "Home",
            showForm: true,
            endpoint: "/parts",
            submitfn: "this.action = this.action + '/'+ this.partNumber.value",
            method: "post",
            methodOverride: "PUT",
            Current: "English",
            legend: "Please enter the new part name for the part to be changed: ",
            formfields: [{ field: "partNumber", pretty: "Original Part Number", type: "number" },
            { field: "name", pretty: "New Part Name" }],
            Submit: "Submit",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Log In",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            Add: "Add a car part",
            Show: "Find a Car Part",
            List: "Show all Car Parts",
            Edit: "Update a Car Part",
            Delete: "Delete a Car Part"
        };
    }
    else {
        pageData = {
            Home: "Accueil",
            showForm: true,
            endpoint: "/parts",
            submitfn: "this.action = this.action + '/'+ this.partNumber.value",
            method: "post",
            methodOverride: "PUT",
            Current: "French",
            legend: "Veuillez entrer le nouveau nom de la pièce à modifier: ",
            formfields: [{ field: "partNumber", pretty: "Numéro De Pièce", type: "number" },
            { field: "name", pretty: "Nouveau Nom De Pièce" }],
            Submit: "Soumettre",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Connexion",
            signUpText: "Enregistrer",
            endpointLogInLogOut: "login",
            Add: "Ajouter une Pièce Auto",
            Show: "Trouver une Pièce Auto",
            List: "Afficher Toutes les Pièces de Voiture",
            Edit: "Mettre à Jour une Pièce Auto",
            Delete: "Supprimer une Pièce Auto"
        };
    }

    logger.info(`RENDERING home page WITH UPDATE form -- showEditForm`);
    response.render('home.hbs', pageData);
}

/**
 * Displays the delete car part form
 * @param {*} response 
 */
function showDeleteForm(response) {
    let lang = response.req.cookies.language;

    let pageData;

    if (!lang || lang === 'en') {
        pageData = {
            Home: "Home",
            showForm: true,
            endpoint: "/parts",
            submitfn: "this.action = this.action + '/'+ this.partNumber.value",
            method: "post",
            methodOverride: "DELETE",
            Current: "English",
            legend: "Please enter the part number of the part that should be deleted:",
            formfields: [{ field: "partNumber", pretty: "Part Number", type: "number" }],
            Submit: "Submit",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Log In",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            Add: "Add a car part",
            Show: "Find a Car Part",
            List: "Show all Car Parts",
            Edit: "Update a Car Part",
            Delete: "Delete a Car Part"
        };
    }
    else {
        pageData = {
            Home: "Accueil",
            showForm: true,
            endpoint: "/parts",
            submitfn: "this.action = this.action + '/'+ this.partNumber.value",
            method: "post",
            methodOverride: "DELETE",
            Current: "French",
            legend: "Veuillez entrer le numéro de pièce de la pièce à supprimer :",
            formfields: [{ field: "partNumber", pretty: "Numéro De Pièce", type: "number" }],
            Submit: "Soumettre",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Connexion",
            signUpText: "Enregistrer",
            endpointLogInLogOut: "login",
            Add: "Ajouter une Pièce Auto",
            Show: "Trouver une Pièce Auto",
            List: "Afficher Toutes les Pièces de Voiture",
            Edit: "Mettre à Jour une Pièce Auto",
            Delete: "Supprimer une Pièce Auto"
        };
    }



    logger.info(`RENDERING home page WITH DELETE form -- showDeleteForm`);
    response.render('home.hbs', pageData);
}

router.get('/', sendHome);
router.post('/', showForm);


module.exports = {
    router,
    routeRoot
}
