'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const partController = require('./carPartController');
const loginController = require('./loginController');
const projectModel = require('../models/projectModel');
const userModel = require('../models/userModel');
const sqlModel = require('../models/carPartModelMysql');

const cookieParser = require("cookie-parser")
router.use(cookieParser());


/**
 * GET controller method that outputs the home view
 * @param {*} request 
 * @param {*} response 
 */
async function sendHome(request, response) {
    let pageData;
    const lang = request.cookies.language;

    try {
        // Getting the values
        const justRegistered = request.cookies.justRegistered;
        let login = loginController.authenticateUser(request);
        let signupDisplay, endpoint, logInText;
        let accessProject = request.cookies.lastAccessedProject;
        let AccessProject;
        let AccessProjectName;
        let role;
        
        if (accessProject && accessProject != '-1'){
            AccessProject = true;
            AccessProjectName = await projectModel.getProjectByProjectId(accessProject)
            //AccessProjectName = AccessProjectName[0].name;
            AccessProjectName = accessProject[0].name;
        }
    
        // If the user just registered
        if (justRegistered == 'true') {
            const username = request.cookies.username;
            response.cookie('justRegistered', 'false');
        }
    
        if (!lang || lang === 'en') {
            // Set the login to the username if response is not null
            if(login != null) {
                login = login.userSession.username;
                signupDisplay = "none";
                endpoint = "logout";
                logInText = "Log Out";
            }
            else{
                signupDisplay = "block";
                endpoint = "login";
                logInText = "Log In";
                AccessProject = false;
            }
    
            role = await userModel.determineRole(login);
    
            pageData = {
                Home: "Home",
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                endpointLogInLogOut: endpoint,
                signUpText: "Sign Up",
                Current: "English",
                Add: role === 1 ? "Add a Car part" : "",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: role === 1 ? "Update a Car Part" : "",
                Delete: role === 1 ? "Delete a Car Part" : "",
                loggedInUser: login,
                projects_text: "Projects",
                about_text: "About Us",
                accessProject: AccessProject,
                accessProjectId: accessProject,
                accessProjectName: AccessProjectName,
                inv_actions: "Inventory Actions",
                footerData: footerLangObject(lang),
                selectActionText: "Select an inventory action to continue!"
            }
        }
        else{
            // Set the login to the username if response is not null
            if(login != null) {
                login = login.userSession.username;
                signupDisplay = "none";
                endpoint = "logout";
                logInText = "Se Déconnecter";
            }
            else{
                signupDisplay = "block";
                endpoint = "login";
                logInText = "Connexion";
                AccessProject = false;
            }
    
            role = await userModel.determineRole(login);
    
            pageData = {
                Home: "Accueil",
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                endpointLogInLogOut: endpoint,
                signUpText: "Enregistrer",
                Current: "French",
                Add: role === 1 ? "Ajouter une Pièce Auto" : "",
                Show: "Trouver une Pièce Auto",
                List: "Afficher Toutes les Pièces de Voiture",
                Edit: role === 1 ? "Mettre à Jour une Pièce Auto" : "",
                Delete: role === 1 ? "Supprimer une Pièce Auto" : "",
                loggedInUser: login,
                projects_text: "Projets",
                about_text: "À propos de nous",
                accessProject: AccessProject,
                accessProjectId: accessProject,
                accessProjectName: AccessProjectName,
                inv_actions: "Actions D'inventaire",
                footerData: footerLangObject(lang),
                selectActionText: "Sélectionnez une action d'inventaire pour continuer!"
            }

            if(logInText === "Log In"){
                output.logInlogOutText = "Connexion";
            }
            else if(logInText === "Log Out"){
                output.logInlogOutText = "Se déconnecter";
            }
        }
    
        response.status(200).render('home.hbs', pageData);
    } 
    catch (error) {
        // If language is english
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
        // If language is french
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

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to render home: ${error.message}`;
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
    }
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
            showAddForm(request, response);
            break;

        // Case of finding a car part
        case 'show':
            showListOneForm(request, response);
            break;

        // Case of getting all car parts
        case 'list':
            response.redirect('/parts');
            break;

        // Case of updating a car part
        case 'edit':
            showEditForm(request, response);
            break;

        // Case of deleting a car part
        case 'delete':
            // showDeleteForm(request, response);
            response.redirect('/parts/table/delete');
            break;

        // Default case
        default:
            response.render('home.hbs');
    }
}

/**
 * Displays the add car part form
 * @param {*} response 
 */
async function showAddForm(request, response) {
    let lang = request.cookies.language;
    let login = loginController.authenticateUser(request);
    let signupDisplay, endpoint, logInText;
    let role;

    let pageData;

    if (!lang || lang === 'en') {
        // Set the login to the username if response is not null
        if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Log Out";
        }
        else{
            signupDisplay = "block";
            endpoint = "login";
            logInText = "Log In";
        }

        role = await userModel.determineRole(login);

        pageData = {
            Home: "Home",
            showForm: true,
            endpoint: "/parts",
            method: "post",
            Current: "English",
            legend: "Please enter details for new car part: ",
            formfields: [
                { field: "partNumber", pretty: "Part Number", type: "number", required: "required" },
                { field: "name", pretty: "Part Name", required: "required" }, 
                { isCondition: true, field: "condition", pretty: "Condition", required: "required",
                    conditions: [
                       "New",
                        "Used"
                    ]}, 
                { field: "image", pretty: "Image URL" }
            ],
            Submit: "Submit",
            display_signup: signupDisplay,
            display_login: "block",
            logInlogOutText: logInText,
            signUpText: "Sign Up",
            endpointLogInLogOut: endpoint,
            Add: role === 1 ? "Add a Car part" : "",
            Show: "Find a Car Part",
            List: "Show all Car Parts",
            Edit: role === 1 ? "Update a Car Part" : "",
            Delete: role === 1 ? "Delete a Car Part" : "",
            loggedInUser: login,
            projects_text: "Projects",
            about_text: "About Us",
            inv_actions: "Inventory Actions",
            footerData: footerLangObject(lang)
        }
    }
    else {
        // Set the login to the username if response is not null
        if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Se Déconnecter";
        }
        else{
            signupDisplay = "block";
            endpoint = "login";
            logInText = "Connexion";
        }

        role = await userModel.determineRole(login);

        pageData = {
            Home: "Accueil",
            showForm: true,
            endpoint: "/parts",
            method: "post",
            Current: "French",
            legend: "Veuillez entrer les détails de la nouvelle pièce de voiture: ",
            formfields: [
                { field: "partNumber", pretty: "Numéro de Pièce", type: "number", required: "required" },
                { field: "name", pretty: "Nom de la Pièce", required: "required" }, 
                { isCondition: true, field: "condition", pretty: "État" ,
                    conditions: [
                        "Nouveau",
                        "Utilisé"
                    ]},  
                { field: "image", pretty: "URL de L'image" }
            ],
            Submit: "Soumettre",
            display_signup: signupDisplay,
            display_login: "block",
            logInlogOutText: logInText,
            signUpText: "Enregistrer",
            endpointLogInLogOut: endpoint,
            Add: role === 1 ? "Ajouter une Pièce Auto" : "",
            Show: "Trouver une Pièce Auto",
            List: "Afficher Toutes les Pièces de Voiture",
            Edit: role === 1 ? "Mettre à Jour une Pièce Auto" : "",
            Delete: role === 1 ? "Supprimer une Pièce Auto" : "",
            loggedInUser: login,
            projects_text: "Projets",
            about_text: "À propos de nous",
            inv_actions: "Actions D'inventaire",
            footerData: footerLangObject(lang)
        }

        if(logInText === "Log In"){
            output.logInlogOutText = "Connexion";
        }
        else if(logInText === "Log Out"){
            output.logInlogOutText = "Se déconnecter";
        }
    }

    response.render('home.hbs', pageData);
}

/**
 * Displays the show car part form
 * @param {*} response 
 */
async function showListOneForm(request, response) {
    let lang = request.cookies.language;
    let login = loginController.authenticateUser(request);
    let signupDisplay, endpoint, logInText;
    let role;

    let pageData;

    if (!lang || lang === 'en') {
        // Set the login to the username if response is not null
        if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Log Out";
        }
        else{
            signupDisplay = "block";
            endpoint = "login";
            logInText = "Log In";
        }

        role = await userModel.determineRole(login);

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
            display_signup: signupDisplay,
            display_login: "block",
            logInlogOutText: logInText,
            signUpText: "Sign Up",
            endpointLogInLogOut: endpoint,
            Add: role === 1 ? "Add a car part" : "",
            Show: "Find a Car Part",
            List: "Show all Car Parts",
            Edit: role === 1 ? "Update a Car Part" : "",
            Delete: role === 1 ? "Delete a Car Part" : "",
            loggedInUser: login,
            projects_text: "Projects",
            about_text: "About Us",
            inv_actions: "Inventory Actions",
            footerData: footerLangObject(lang)
        };
    }
    else {
        // Set the login to the username if response is not null
        if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Se Déconnecter";
        }
        else{
            signupDisplay = "block";
            endpoint = "login";
            logInText = "Connexion";
        }

        role = await userModel.determineRole(login);

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
            display_signup: signupDisplay,
            display_login: "block",
            logInlogOutText: logInText,
            signUpText: "Enregistrer",
            endpointLogInLogOut: endpoint,
            Add: role === 1 ? "Ajouter une Pièce Auto" : "",
            Show: "Trouver une Pièce Auto",
            List: "Afficher Toutes les Pièces de Voiture",
            Edit: role === 1 ? "Mettre à Jour une Pièce Auto" : "",
            Delete: role === 1 ? "Supprimer une Pièce Auto" : "",
            loggedInUser: login,
            projects_text: "Projets",
            about_text: "À propos de nous",
            inv_actions: "Actions D'inventaire",
            footerData: footerLangObject(lang)
        };

        if(logInText === "Log In"){
            output.logInlogOutText = "Connexion";
        }
        else if(logInText === "Log Out"){
            output.logInlogOutText = "Se déconnecter";
        }
    }

    response.render('home.hbs', pageData);
}

/**
 * Displays the update car part form
 * @param {*} response 
 */
async function showEditForm(request, response) {
    let lang = request.cookies.language;
    let login = loginController.authenticateUser(request);
    let signupDisplay, endpoint, logInText;
    let role;

    let pageData;

    if (!lang || lang === 'en') {
        // Set the login to the username if response is not null
        if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Log Out";
        }
        else{
            signupDisplay = "block";
            endpoint = "login";
            logInText = "Log In";
        }

        role = await userModel.determineRole(login);

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
            display_signup: signupDisplay,
            display_login: "block",
            logInlogOutText: logInText,
            signUpText: "Sign Up",
            endpointLogInLogOut: endpoint,
            Add: role === 1 ? "Add a car part" : "",
            Show: "Find a Car Part",
            List: "Show all Car Parts",
            Edit: role === 1 ? "Update a Car Part" : "",
            Delete: role === 1 ? "Delete a Car Part" : "",
            loggedInUser: login,
            projects_text: "Projects",
            about_text: "About Us",
            inv_actions: "Inventory Actions",
            footerData: footerLangObject(lang)
        };
    }
    else {
        // Set the login to the username if response is not null
        if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Se Déconnecter";
        }
        else{
            signupDisplay = "block";
            endpoint = "login";
            logInText = "Connexion";
        }

        role = await userModel.determineRole(login);

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
            display_signup: signupDisplay,
            display_login: "block",
            logInlogOutText: logInText,
            signUpText: "Enregistrer",
            endpointLogInLogOut: endpoint,
            Add: role === 1 ? "Ajouter une Pièce Auto" : "",
            Show: "Trouver une Pièce Auto",
            List: "Afficher Toutes les Pièces de Voiture",
            Edit: role === 1 ? "Mettre à Jour une Pièce Auto" : "",
            Delete: role === 1 ? "Supprimer une Pièce Auto" : "",
            loggedInUser: login,
            projects_text: "Projets",
            about_text: "À propos de nous",
            inv_actions: "Actions D'inventaire",
            footerData: footerLangObject(lang)
        };

        if(logInText === "Log In"){
            output.logInlogOutText = "Connexion";
        }
        else if(logInText === "Log Out"){
            output.logInlogOutText = "Se déconnecter";
        }
    }

    response.render('home.hbs', pageData);
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


router.get('/', sendHome);
router.post('/', showForm);


module.exports = {
    router,
    routeRoot,
    footerLangObject
}
