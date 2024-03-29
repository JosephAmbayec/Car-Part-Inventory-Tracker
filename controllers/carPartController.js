'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const sqlModel = require('../models/carPartModelMysql.js');
const validUtils = require('../validateUtils.js');
const projectModel = require('../models/projectModel');
const loginController = require('./loginController');
const userModel = require('../models/userModel');
const homeController = require('./homeController');

/**
 * POST controller method that allows the user to create parts via the request body
 * @param {*} request 
 * @param {*} response 
 */
async function createPart(request, response){
    // Getting the values
    let number = request.body.partNumber;
    let partName = request.body.name;
    let image = request.body.image;
    let condition = request.body.addingForm;
    const lang = request.cookies.language;
    let signupDisplay, endpoint, logInText;
    let login = loginController.authenticateUser(request);

    // If the image is not a valid url, set image to null
    if (!validUtils.isURL(image)){
        image = null;
    }
    
    // If the condition is not valid, set the condition to 'unknown'
    if (validUtils.stringIsEmpty(condition)){
        condition = "unknown";
    }

    // Set the login to the username if response is not null
    if(login != null) {
        login = login.userSession.username;
        signupDisplay = "none";
        endpoint = "logout";
        logInText = "Log Out";

        try {
            await sqlModel.addCarPart(number, partName, condition, image);
    
            let role = await userModel.determineRole(login);
    
            let output = {
                alertOccurred: true,
                alertMessage: `Created part: Part #${number}, ${partName}, Condition: ${condition}`,
                showList: true,
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                signUpText: "Sign Up",
                endpointLogInLogOut: endpoint,
                Home: "Home",
                Add: role === 1 ? "Add a car part" : "",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: role === 1 ? "Update a Car Part" : "",
                Delete: role === 1 ? "Delete a Car Part" : "",
                Current: "English",
                loggedInUser: login,
                projects_text: "Projects",
                about_text: "About Us",
                inv_actions: "",
                addToProjText: "",
                partNumText: "",
                partNameText: "",
                partCondition: "",
                partImage: "",
                partDelete: "",
                allPartsText: "",
                footerData: footerLangObject(lang),
                part: await sqlModel.findAllCarParts(),
                alertLevel: 'success',
                    alertLevelText: 'success',
                    alertHref: 'exclamation-triangle-fill',
            }
    
            // If the language is english
            if (!lang || lang === 'en') {
                output.signUpText = "Sign Up";
                output.Add = role === 1 ? "Add a car part" : "";
                output.Show = "Find a Car Part";
                output.List = "Show all Car Parts";
                output.Edit = role === 1 ? "Update a Car Part" : "";
                output.Delete = role === 1 ? "Delete a Car Part" : "";
                output.projects_text = "Projects";
                output.about_text = "About Us"
                output.Home = "Home";
                output.Current = "English";
                output.inv_actions = "Inventory Actions";
                output.addToProjText = "Add to Project";
                output.partNumText = "Part #";
                output.partNameText = "Part Name";
                output.partCondition = "Condition";
                output.partImage = "Image";
                output.partDelete = "Delete";
                output.allPartsText = "All car parts in the inventory";
            }
            // If the language is french
            else{
                output.alertMessage = `Pièce D'auto Créée: Numéro ${number}, ${partName}, Condition: ${condition}`;
                output.signUpText = "Enregistrer";
                output.Add = role === 1 ? "Ajouter une Pièce Auto" : "";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = role === 1 ? "Mettre à Jour une Pièce Auto" : "";
                output.Delete = role === 1 ? "Supprimer une Pièce Auto" : "";
                output.projects_text = "Projets";
                output.about_text = "À Propos de Nous";
                output.Home = "Accueil";
                output.Current = "French";
                output.inv_actions = "Actions D'inventaire";
                output.addToProjText = "Ajouter au Projet";
                output.partNumText = "Pièce #";
                output.partNameText = "Nom de la Pièce";
                output.partCondition = "État";
                output.partImage = "Image";
                output.partDelete = "Supprimer";
                output.allPartsText = "Toutes les Pièces Autos en Inventaire";
    
                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }
    
            response.status(201).render('home.hbs', output);
    
        } 
        catch(error) {
            let pageData;

            // If language is English
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
            if (error instanceof sqlModel.DatabaseConnectionError){
                pageData.alertMessage = "There was an error connecting to the database.";
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
            // If the error is an instance of the InvalidInputError error
            else if (error instanceof sqlModel.InvalidInputError){
                pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable. Ensure the url is a valid image url";
                pageData.errorCode = 404;
                response.status(404).render('home.hbs', pageData);
            }
            // If any other error
            else {
                pageData.alertMessage = `Unexpected error while trying to add part: ${error.message}`;
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
        }
    }
    else{
        response.redirect('/parts');
    }
}

/**
 * GET controller method that allows the user to retrieve the part with the given part number
 * @param {*} request 
 * @param {*} response 
 */
async function getPartByNumber(request, response){
    // Getting the values
    let number = request.params.partNumber;
    const lang = request.cookies.language;
    let signupDisplay, endpoint, logInText;
    let login = loginController.authenticateUser(request);
    let role = await userModel.determineRole(login);

    try {
        let part = await sqlModel.findCarPartByNumber(number);
        let output, signupDisplay, endpoint, logInText;

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

        // If no part was found
        if (part.length == 0){
            output = {
                alertOccurred: true,
                alertMessage:`Could not find any parts with part number \'${number}\'`,
                showList: false,
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                signUpText: "Sign Up",
                endpointLogInLogOut: endpoint,
                Home: "Home",
                Add: role === 1 ? "Add a car part" : "",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: role === 1 ? "Update a Car Part" : "",
                Delete: role === 1 ? "Delete a Car Part" : "",
                Current: "English",
                loggedInUser: login,
                projects_text: "Projects",
                about_text: "About Us",
                part,
                    alertLevel: 'danger',
                    alertLevelText: 'Danger',
                    alertHref: 'exclamation-triangle-fill',
                inv_actions: "",
                footerData: footerLangObject(lang),
                addToProjText: "",
                partNumText: "",
                partNameText: "",
                partCondition: "",
                partImage: "",
                partDelete: "",
                allPartsText: ""
            }

            // If the language is english
            if (!lang || lang === 'en') {
                output.signUpText = "Sign Up";
                output.Add = role === 1 ? "Add a car part" : "";
                output.Show = "Find a Car Part";
                output.List = "Show all Car Parts";
                output.Edit = role === 1 ? "Update a Car Part" : "";
                output.Delete = role === 1 ? "Delete a Car Part" : "";
                output.projects_text = "Projects";
                output.about_text = "About Us"
                output.Home = "Home";
                output.Current = "English";
                output.inv_actions = "Inventory Actions";
                output.addToProjText = "Add to Project";
                output.partNumText = "Part #";
                output.partNameText = "Part Name";
                output.partCondition = "Condition";
                output.partImage = "Image";
                output.partDelete = "Delete";
                output.allPartsText = "All car parts in the inventory";
            }
            // If the language is french
            else{
                output.signUpText = "Enregistrer";
                output.Add = role === 1 ? "Ajouter une Pièce Auto" : "";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = role === 1 ? "Mettre à Jour une Pièce Auto" : "";
                output.Delete = role === 1 ? "Supprimer une Pièce Auto" : "";
                output.projects_text = "Projets";
                output.about_text = "À Propos de Nous";
                output.Home = "Accueil";
                output.Current = "French";
                output.inv_actions = "Actions D'inventaire";
                output.addToProjText = "Ajouter au Projet";
                output.partNumText = "Pièce #";
                output.partNameText = "Nom de la Pièce";
                output.partCondition = "État";
                output.partImage = "Image";
                output.partDelete = "Supprimer";
                output.allPartsText = "Toutes les Pièces Autos en Inventaire";

                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }

            response.status(404).render('home.hbs', output);
        }
        // If the part was found
        else{
            output = {
                alertOccurred: true,
                alertMessage: `Successfully found ${number}!`,
                showList: true,
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                signUpText: "Sign Up",
                endpointLogInLogOut: endpoint,
                Home: "Home",
                Add: role === 1 ? "Add a car part" : "",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: role === 1 ? "Update a Car Part" : "",
                Delete: role === 1 ? "Delete a Car Part" : "",
                Current: "English",
                loggedInUser: login,
                projects_text: "Projects",
                about_text: "About Us",
                part,
                alertLevel: 'success',
                    alertLevelText: 'success',
                    alertHref: 'exclamation-triangle-fill',
                inv_actions: "",
                footerData: footerLangObject(lang),
                addToProjText: "",
                partNumText: "",
                partNameText: "",
                partCondition: "",
                partImage: "",
                partDelete: "",
                allPartsText: ""
            }

            // If the language is english
            if (!lang || lang === 'en') {
                output.signUpText = "Sign Up";
                output.Add = role === 1 ? "Add a car part" : "";
                output.Show = "Find a Car Part";
                output.List = "Show all Car Parts";
                output.Edit = role === 1 ? "Update a Car Part" : "";
                output.Delete = role === 1 ? "Delete a Car Part" : "";
                output.projects_text = "Projects";
                output.about_text = "About Us"
                output.Home = "Home";
                output.Current = "English";
                output.inv_actions = "Inventory Actions";
                output.addToProjText = "Add to Project";
                output.partNumText = "Part #";
                output.partNameText = "Part Name";
                output.partCondition = "Condition";
                output.partImage = "Image";
                output.partDelete = "Delete";
                output.allPartsText = "All car parts in the inventory";
            }
            // If the language is french
            else{
                output.signUpText = "Enregistrer";
                output.Add = role === 1 ? "Ajouter une Pièce Auto" : "";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = role === 1 ? "Mettre à Jour une Pièce Auto" : "";
                output.Delete = role === 1 ? "Supprimer une Pièce Auto" : "";
                output.projects_text = "Projets";
                output.about_text = "À Propos de Nous";
                output.Home = "Accueil";
                output.Current = "French";
                output.inv_actions = "Actions D'inventaire";
                output.addToProjText = "Ajouter au Projet";
                output.partNumText = "Pièce #";
                output.partNameText = "Nom de la Pièce";
                output.partCondition = "État";
                output.partImage = "Image";
                output.partDelete = "Supprimer";
                output.allPartsText = "Toutes les Pièces Autos en Inventaire";

                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }

            response.status(200).render('home.hbs', output);
        }
    }
    catch(error){
        let pageData;

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
        if (error instanceof sqlModel.DatabaseConnectionError){
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            pageData.errorCode = 404;
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error
        else {
            pageData.alertMessage =`Unexpected error while trying to show part: ${error.message}`;
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
    }
}

/**
 * GET controller method that allows the user to retrieve an array of all parts in the database
 * @param {*} request 
 * @param {*} response 
 */
async function getAllCarParts(request, response){
    try {
        let parts = await sqlModel.findAllCarParts();
        let login = loginController.authenticateUser(request);
        let lang = request.cookies.language;
        let signupDisplay, endpoint, logInText;
        let output, role;
        let accessProject = request.cookies.lastAccessedProject;
        let AccessProject;
        let AccessProjectName;
        if (accessProject && accessProject != '-1'){
            AccessProject = true;
            AccessProjectName = await projectModel.getProjectByProjectId(accessProject)
            AccessProjectName = accessProject[0].name;
        }
        else
            AccessProject = false

        // If no car parts were found
        if (parts.length === 0){

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

            output = {
                showList: true,
                noCarParts: true,
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                signUpText: "Sign Up",
                endpointLogInLogOut: endpoint,
                Home: "Home",
                Add: role === 1 ? "Add a car part" : "",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: role === 1 ? "Update a Car Part" : "",
                Delete: role === 1 ? "Delete a Car Part" : "",
                Current: "English",
                loggedInUser: login,
                projects_text: "Projects",
                about_text: "About Us",
                inv_actions: "",
                addToProjText: "",
                partNumText: "",
                partNameText: "",
                partCondition: "",
                partImage: "",
                partDelete: "",
                allPartsText: "",
                footerData: footerLangObject(lang),
                sorry_noParts: "Sorry! Currently there are no car parts in the inventory!",
                comeBackSoon: "Come back soon to see if car parts have been added to the inventory!"
            }

            if (AccessProject){
                output = {                
                    showList: true,
                    noCarParts: true,
                    display_signup: signupDisplay,
                    display_login: "block",
                    logInlogOutText: logInText,
                    signUpText: "Sign Up",
                    endpointLogInLogOut: endpoint,
                    Home: "Home",
                    Add: role === 1 ? "Add a car part" : "",
                    Show: "Find a Car Part",
                    List: "Show all Car Parts",
                    Edit: role === 1 ? "Update a Car Part" : "",
                    Delete: role === 1 ? "Delete a Car Part" : "",
                    Current: "English",
                    loggedInUser: login,
                    accessProject: true,
                    accessProjectId: accessProject,
                    accessProjectName: AccessProjectName,
                    projects_text: "Projects",
                    about_text: "À propos de nous",
                    inv_actions: "",
                    addToProjText: "",
                    partNumText: "",
                    partNameText: "",
                    partCondition: "",
                    partImage: "",
                    partDelete: "",
                    allPartsText: "",
                    footerData: footerLangObject(lang),
                    sorry_noParts: "Sorry! Currently there are no car parts in the inventory!",
                    comeBackSoon: "Come back soon to see if car parts have been added to the inventory!"
                }

            }

            // If the language is english
            if (!lang || lang === 'en') {
                output.signUpText = "Sign Up";
                output.Add = role === 1 ? "Add a car part" : "";
                output.Show = "Find a Car Part";
                output.List = "Show all Car Parts";
                output.Edit = role === 1 ? "Update a Car Part" : "";
                output.Delete = role === 1 ? "Delete a Car Part" : "";
                output.projects_text = "Projects";
                output.about_text = "About Us"
                output.Home = "Home";
                output.Current = "English";
                output.inv_actions = "Inventory Actions";
                output.addToProjText = "Add to Project";
                output.partNumText = "Part #";
                output.partNameText = "Part Name";
                output.partCondition = "Condition";
                output.partImage = "Image";
                output.partDelete = "Delete";
                output.allPartsText = "All car parts in the inventory";
            }
            // If the language is french
            else{
                output.signUpText = "Enregistrer";
                output.Add = role === 1 ? "Ajouter une Pièce Auto" : "";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = role === 1 ? "Mettre à Jour une Pièce Auto" : "";
                output.Delete = role === 1 ? "Supprimer une Pièce Auto" : "";
                output.projects_text = "Projets";
                output.about_text = "À Propos de Nous";
                output.Home = "Accueil";
                output.Current = "French";
                output.inv_actions = "Actions D'inventaire";
                output.addToProjText = "Ajouter au Projet";
                output.partNumText = "Pièce #";
                output.partNameText = "Nom de la Pièce";
                output.partCondition = "État";
                output.partImage = "Image";
                output.partDelete = "Supprimer";
                output.allPartsText = "Toutes les Pièces Autos en Inventaire";
                output.sorry_noParts = "Désolé! Au moment, il n'y a pas de pièces d'autos dans l'inventaire!";
                output.comeBackSoon = "Revenez bientôt pour voir si des pièces d'autos ont été ajoutées à l'inventaire !";

                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }

            response.status(201).render('home.hbs', output);
        }
        // If car parts were found
        else{

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

            let projs = await projectModel.getAllProjects(login);

            // Deleting the car part images with no image
            for (let i = 0; i < parts.length; i++){
                if (parts[i].image == 'null' || parts[i].image == null || parts[i.image == '']){
                    delete parts[i].image;
                }
            }

            role = await userModel.determineRole(login);

            output = {
                part: parts, 
                showList: true,
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                signUpText: "Sign Up",
                endpointLogInLogOut: endpoint,
                Home: "Home",
                Add: "Add a car part",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: "Update a Car Part",
                Delete: "Delete a Car Part",
                Current: "English",
                project: projs,
                loggedInUser: login,
                about_text: "About Us",
                projects_text: "Projects",
                inv_actions: "",
                addToProjText: "",
                partNumText: "",
                partNameText: "",
                partCondition: "",
                partImage: "",
                partDelete: "",
                allPartsText: "",
                footerData: footerLangObject(lang)
            };

            if (AccessProject){
                output = {                
                    part: parts, 
                    showList: true,
                    display_signup: signupDisplay,
                    display_login: "block",
                    logInlogOutText: logInText,
                    signUpText: "Sign Up",
                    endpointLogInLogOut: endpoint,
                    Home: "Home",
                    Add: "Add a car part",
                    Show: "Find a Car Part",
                    List: "Show all Car Parts",
                    Edit: "Update a Car Part",
                    Delete: "Delete a Car Part",
                    Current: "English",
                    project: projs,
                    loggedInUser: login,
                    accessProject: true,
                    accessProjectId: accessProject,
                    accessProjectName: AccessProjectName,
                    projects_text: "Projects",
                    about_text: "About Us",
                    inv_actions: "",
                    addToProjText: "",
                    partNumText: "",
                    partNameText: "",
                    partCondition: "",
                    partImage: "",
                    partDelete: "",
                    allPartsText: "",
                    footerData: footerLangObject(lang)
                }

            }

            // If the language is english
            if (!lang || lang === 'en') {
                output.signUpText = "Sign Up";
                output.Add = role === 1 ? "Add a car part" : "";
                output.Show = "Find a Car Part";
                output.List = "Show all Car Parts";
                output.Edit = role === 1 ? "Update a Car Part" : "";
                output.Delete = role === 1 ? "Delete a Car Part" : "";
                output.projects_text = "Projects";
                output.about_text = "About Us"
                output.Home = "Home";
                output.Current = "English";
                output.inv_actions = "Inventory Actions";
                output.addToProjText = "Add to Project";
                output.partNumText = "Part #";
                output.partNameText = "Part Name";
                output.partCondition = "Condition";
                output.partImage = "Image";
                output.partDelete = "Delete";
                output.allPartsText = "All car parts in the inventory";
            }
            // If the language is french
            else{
                output.signUpText = "Enregistrer";
                output.Add = role === 1 ? "Ajouter une Pièce Auto" : "";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = role === 1 ? "Mettre à Jour une Pièce Auto" : "";
                output.Delete = role === 1 ? "Supprimer une Pièce Auto" : "";
                output.projects_text = "Projets";
                output.about_text = "À Propos de Nous";
                output.Home = "Accueil";
                output.Current = "French";
                output.inv_actions = "Actions D'inventaire";
                output.addToProjText = "Ajouter au Projet";
                output.partNumText = "Pièce #";
                output.partNameText = "Nom de la Pièce";
                output.partCondition = "État";
                output.partImage = "Image";
                output.partDelete = "Supprimer";
                output.allPartsText = "Toutes les Pièces Autos en Inventaire";

                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }

            response.status(200).render('home.hbs', output)
        }  
    }
    catch(error){
        let number = request.params.partNumber;
        const lang = request.cookies.language;
        let signupDisplay, endpoint, logInText;
        let login = loginController.authenticateUser(request);
        let role = await userModel.determineRole(login);
        let AccessProject;
        let pageData;
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
        if (error instanceof sqlModel.DatabaseConnectionError){
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            pageData.errorCode = 404;
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error
        else {
             pageData.alertMessage = `Unexpected error while trying to show part: ${error.message}`;
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
    }
}

/**
 * PUT controller method that allows the user to specify a part number, and update it's name
 * @param {*} request 
 * @param {*} response 
 */
async function updatePartName(request, response){
    // Getting the values
    let newName = request.body.name;
    let partNumber = request.params.partNumber;
    const lang = request.cookies.language;
    let signupDisplay, endpoint, logInText;
    let login = loginController.authenticateUser(request);

    // Set the login to the username if response is not null
    if(login != null) {
        login = login.userSession.username;
        signupDisplay = "none";
        endpoint = "logout";
        logInText = "Log Out";

        try {
            let role = await userModel.determineRole(login);
            let parts = await sqlModel.findAllCarParts();

            // If the car part doesn't exist in the database
            if (!await sqlModel.verifyCarPartExists(partNumber)){
                const data = {
                    alertMessage: `Could not find part #${partNumber}`,
                    errorCode: 404
                }
                response.status(404).render('home.hbs', data);
            }
            else{
                await sqlModel.updateCarPartName(partNumber, newName)
                    .then(part => {
        
                        let output = {
                            alertOccurred: true,
                            alertMessage: `Updated part name with part number ${part.partNumber} to ${part.name}`,
                            showList: true,
                            display_signup: signupDisplay,
                            display_login: "block",
                            logInlogOutText: logInText,
                            signUpText: "Sign Up",
                            endpointLogInLogOut: endpoint,
                            Home: "Home",
                            Add: role === 1 ? "Add a car part" : "",
                            Show: "Find a Car Part",
                            List: "Show all Car Parts",
                            Edit: role === 1 ? "Update a Car Part" : "",
                            Delete: role === 1 ? "Delete a Car Part" : "",
                            Current: "English",
                            loggedInUser: login,
                            projects_text: "Projects",
                            about_text: "About Us",
                            inv_actions: "",
                            addToProjText: "",
                            partNumText: "",
                            partNameText: "",
                            partCondition: "",
                            partImage: "",
                            partDelete: "",
                            allPartsText: "",
                            footerData: footerLangObject(lang),
                            part: parts,
                            alertLevel: 'success',
                                alertLevelText: 'success',
                                alertHref: 'exclamation-triangle-fill',
                        }
                
                        // If the language is english
                        if (!lang || lang === 'en') {
                            output.signUpText = "Sign Up";
                            output.Add = role === 1 ? "Add a car part" : "";
                            output.Show = "Find a Car Part";
                            output.List = "Show all Car Parts";
                            output.Edit = role === 1 ? "Update a Car Part" : "";
                            output.Delete = role === 1 ? "Delete a Car Part" : "";
                            output.projects_text = "Projects";
                            output.about_text = "About Us"
                            output.Home = "Home";
                            output.Current = "English";
                            output.inv_actions = "Inventory Actions";
                            output.addToProjText = "Add to Project";
                            output.partNumText = "Part #";
                            output.partNameText = "Part Name";
                            output.partCondition = "Condition";
                            output.partImage = "Image";
                            output.partDelete = "Delete";
                            output.allPartsText = "All car parts in the inventory";
                        }
                        // If the language is french
                        else{
                            output.alertMessage = `Nom de la Pièce mis à jour Avec le Numéro de Pièce ${part.partNumber} à ${part.name}`;
                            output.signUpText = "Enregistrer";
                            output.Add = role === 1 ? "Ajouter une Pièce Auto" : "";
                            output.Show = "Trouver une Pièce Auto";
                            output.List = "Afficher Toutes les Pièces de Voiture";
                            output.Edit = role === 1 ? "Mettre à Jour une Pièce Auto" : "";
                            output.Delete = role === 1 ? "Supprimer une Pièce Auto" : "";
                            output.projects_text = "Projets";
                            output.about_text = "À Propos de Nous";
                            output.Home = "Accueil";
                            output.Current = "French";
                            output.inv_actions = "Actions D'inventaire";
                            output.addToProjText = "Ajouter au Projet";
                            output.partNumText = "Pièce #";
                            output.partNameText = "Nom de la Pièce";
                            output.partCondition = "État";
                            output.partImage = "Image";
                            output.partDelete = "Supprimer";
                            output.allPartsText = "Toutes les Pièces Autos en Inventaire";
                
                            if(logInText === "Log In"){
                                output.logInlogOutText = "Connexion";
                            }
                            else if(logInText === "Log Out"){
                                output.logInlogOutText = "Se déconnecter";
                            }
                        }

                        response.status(200).render('home.hbs', output);
                    })
            }
        }
        catch(error){
            let pageData;

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
            if (error instanceof sqlModel.DatabaseConnectionError){
                pageData.alertMessage = "There was an error connecting to the database.";
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
            // If the error is an instance of the InvalidInputError error
            else if (error instanceof sqlModel.InvalidInputError){
                pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
                pageData.errorCode = 404
                response.status(404).render('home.hbs', pageData);
            }
            // If any other error
            else {
                pageData.alertMessage = `Unexpected error while trying to show part: ${error.message}`;
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
        }   
    }
    else{
        response.redirect('/parts');
    }
}

async function deleteSpecificCarPartTable(request, response){
    try {
        let parts = await sqlModel.findAllCarParts();
        let login = loginController.authenticateUser(request);
        let lang = request.cookies.language;
        let signupDisplay, endpoint, logInText;
        let output, role;
        let accessProject = request.cookies.lastAccessedProject;
        let AccessProject;
        let AccessProjectName;
        if (accessProject && accessProject != '-1'){
            AccessProject = true;
            AccessProjectName = await projectModel.getProjectByProjectId(accessProject)
            AccessProjectName = AccessProjectName[0].name;
        }
        else
            AccessProject = false;

        // If no car parts were found
        if (parts.length === 0){

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

            output = {
                showList: true,
                noCarParts: true,
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                signUpText: "Sign Up",
                endpointLogInLogOut: endpoint,
                Home: "Home",
                Add: role === 1 ? "Add a car part" : "",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: role === 1 ? "Update a Car Part" : "",
                Delete: role === 1 ? "Delete a Car Part" : "",
                Current: "English",
                loggedInUser: login,
                projects_text: "",
                inv_actions: "",
                about_text: "",
                addToProjText: "",
                partNumText: "",
                partNameText: "",
                partCondition: "",
                partImage: "",
                partDelete: "",
                allPartsText: "",
                footerData: footerLangObject(lang),
                sorry_noParts: "Sorry! Currently there are no car parts in the inventory!",
                comeBackSoon: "Come back soon to see if car parts have been added to the inventory!"
            }

            if (AccessProject){
                output = {                
                    showList: true,
                    noCarParts: true,
                    display_signup: signupDisplay,
                    display_login: "block",
                    logInlogOutText: logInText,
                    signUpText: "Sign Up",
                    endpointLogInLogOut: endpoint,
                    Home: "Home",
                    Add: role === 1 ? "Add a car part" : "",
                    Show: "Find a Car Part",
                    List: "Show all Car Parts",
                    Edit: role === 1 ? "Update a Car Part" : "",
                    Delete: role === 1 ? "Delete a Car Part" : "",
                    Current: "English",
                    loggedInUser: login,
                    accessProject: true,
                    accessProjectId: accessProject,
                    accessProjectName: AccessProjectName,
                    projects_text: "",
                    inv_actions: "",
                    about_text: "",
                    addToProjText: "",
                    partNumText: "",
                    partNameText: "",
                    partCondition: "",
                    partImage: "",
                    partDelete: "",
                    allPartsText: "",
                    footerData: footerLangObject(lang),
                    sorry_noParts: "Sorry! Currently there are no car parts in the inventory!",
                    comeBackSoon: "Come back soon to see if car parts have been added to the inventory!"
                }
            }

            // If the language is english
            if (!lang || lang === 'en') {
                output.signUpText = "Sign Up";
                output.Add = role === 1 ? "Add a car part" : "";
                output.Show = "Find a Car Part";
                output.List = "Show all Car Parts";
                output.Edit = role === 1 ? "Update a Car Part" : "";
                output.Delete = role === 1 ? "Delete a Car Part" : "";
                output.projects_text = "Projects";
                output.about_text = "About Us"
                output.Home = "Home";
                output.Current = "English";
                output.inv_actions = "Inventory Actions";
                output.addToProjText = "Add to Project";
                output.partNumText = "Part #";
                output.partNameText = "Part Name";
                output.partCondition = "Condition";
                output.partImage = "Image";
                output.partDelete = "Delete";
                output.allPartsText = "All car parts in the inventory";
            }
            // If the language is french
            else{
                output.signUpText = "Enregistrer";
                output.Add = role === 1 ? "Ajouter une Pièce Auto" : "";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = role === 1 ? "Mettre à Jour une Pièce Auto" : "";
                output.Delete = role === 1 ? "Supprimer une Pièce Auto" : "";
                output.projects_text = "Projets";
                output.about_text = "À Propos de Nous";
                output.Home = "Accueil";
                output.Current = "French";
                output.inv_actions = "Actions D'inventaire";
                output.addToProjText = "Ajouter au Projet";
                output.partNumText = "Pièce #";
                output.partNameText = "Nom de la Pièce";
                output.partCondition = "État";
                output.partImage = "Image";
                output.partDelete = "Supprimer";
                output.allPartsText = "Toutes les Pièces Autos en Inventaire";
                output.sorry_noParts = "Désolé! Au moment, il n'y a pas de pièces d'autos dans l'inventaire!";
                output.comeBackSoon = "Revenez bientôt pour voir si des pièces d'autos ont été ajoutées à l'inventaire !";

                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }

            response.status(201).render('home.hbs', output);
        }
        // If car parts were found
        else{

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

            let projs = await projectModel.getAllProjects(login);

            // Deleting the car part images with no image
            for (let i = 0; i < parts.length; i++){
                if (parts[i].image == 'null' || parts[i].image == null || parts[i.image == '']){
                    delete parts[i].image;
                }
            }

            role = await userModel.determineRole(login);

            output = {
                part: parts, 
                showList: true,
                isDelete: true,
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                signUpText: "Sign Up",
                endpointLogInLogOut: endpoint,
                Home: "Home",
                Add: "Add a car part",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: "Update a Car Part",
                Delete: "Delete a Car Part",
                Current: "English",
                project: projs,
                loggedInUser: login,
                about_text: "About Us",
                projects_text: "",
                inv_actions: "",
                addToProjText: "",
                partNumText: "",
                partNameText: "",
                partCondition: "",
                partImage: "",
                partDelete: "",
                allPartsText: "",
                footerData: footerLangObject(lang)
            };

            if (AccessProject){
                output = {                
                    part: parts, 
                    showList: true,
                    isDelete: true,
                    display_signup: signupDisplay,
                    display_login: "block",
                    logInlogOutText: logInText,
                    signUpText: "Sign Up",
                    endpointLogInLogOut: endpoint,
                    Home: "Home",
                    Add: "Add a car part",
                    Show: "Find a Car Part",
                    List: "Show all Car Parts",
                    Edit: "Update a Car Part",
                    Delete: "Delete a Car Part",
                    Current: "English",
                    project: projs,
                    loggedInUser: login,
                    accessProject: true,
                    accessProjectId: accessProject,
                    accessProjectName: AccessProjectName,
                    about_text: "About Us",
                    projects_text: "",
                    inv_actions: "",
                    addToProjText: "",
                    partNumText: "",
                    partNameText: "",
                    partCondition: "",
                    partImage: "",
                    partDelete: "",
                    allPartsText: "",
                    footerData: footerLangObject(lang)
                }
            }

            // If the language is english
            if (!lang || lang === 'en') {
                output.signUpText = "Sign Up";
                output.Add = role === 1 ? "Add a car part" : "";
                output.Show = "Find a Car Part";
                output.List = "Show all Car Parts";
                output.Edit = role === 1 ? "Update a Car Part" : "";
                output.Delete = role === 1 ? "Delete a Car Part" : "";
                output.projects_text = "Projects";
                output.about_text = "About Us"
                output.Home = "Home";
                output.Current = "English";
                output.inv_actions = "Inventory Actions";
                output.addToProjText = "Add to Project";
                output.partNumText = "Part #";
                output.partNameText = "Part Name";
                output.partCondition = "Condition";
                output.partImage = "Image";
                output.partDelete = "Delete";
                output.allPartsText = "All car parts in the inventory";
            }
            // If the language is french
            else{
                output.signUpText = "Enregistrer";
                output.Add = role === 1 ? "Ajouter une Pièce Auto" : "";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = role === 1 ? "Mettre à Jour une Pièce Auto" : "";
                output.Delete = role === 1 ? "Supprimer une Pièce Auto" : "";
                output.projects_text = "Projets";
                output.about_text = "À Propos de Nous";
                output.Home = "Accueil";
                output.Current = "French";
                output.inv_actions = "Actions D'inventaire";
                output.addToProjText = "Ajouter au Projet";
                output.partNumText = "Pièce #";
                output.partNameText = "Nom de la Pièce";
                output.partCondition = "État";
                output.partImage = "Image";
                output.partDelete = "Supprimer";
                output.allPartsText = "Toutes les Pièces Autos en Inventaire";

                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }

            response.status(200).render('home.hbs', output)
        }  
    }
    catch(error){
            let pageData;

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
        if (error instanceof sqlModel.DatabaseConnectionError){
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            pageData.errorCode = 404;
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error
        else {
            pageData.alertMessage = `Unexpected error while trying to show part: ${error.message}`;
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
    }
}

async function addCarPartToProject(request, response){
    const lang = request.cookies.language;

    try {
        // Getting the values
        let projectId = request.params.projectId;
        
        let result = await projectModel.addPartToProject(projectId);
        console.log(result);
    } 
    catch (error) {
        let pageData;

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
        if (error instanceof sqlModel.DatabaseConnectionError){
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            pageData.alertMessage =  "Invalid input, check that all fields are alpha numeric where applicable.";
            pageData.errorCode = 404;
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error
        else {
            pageData.alertMessage = `Unexpected error while trying to show part: ${error.message}`;
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
    }
}

/**
 * Deletes the specified car part from the database.
 * @param {*} request 
 * @param {*} response 
 */
async function deletePart(request, response){
    const lang = request.cookies.language;

    try {
        // Getting the values
        let partNumber = request.params.partNumber;

        // If the car part exists
        if (await sqlModel.verifyCarPartExists(partNumber)){
            // Delete from any project first
            let deletedPartProject = await projectModel.deletePartFromProjectWithNumber(partNumber);
            // Then delete the car part
            let deletedPart = await sqlModel.deleteCarPart(partNumber);

            if(deletedPartProject && deletedPart){
                response.status(200);
            }
            else{
                response.status(404);
            }

            // response.status(202).render('home.hbs', {message: `Deleted part with part number ${part.partNumber}`});

            response.redirect('/parts/table/delete');
        }
        // If the car part doesn't exists
        else{
            const data = {
                alertMessage: `Could not find part #${partNumber}`,
                errorCode: 404
            }
            response.status(404).render('home.hbs', data);
        }
    } 
    catch (error) {
        let pageData;

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
        if (error instanceof sqlModel.DatabaseConnectionError){
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            pageData.errorCode = 404;
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error
        else {
            pageData.alertMessage = `Unexpected error while trying to show part: ${error.message}`;
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
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


router.post("/parts", createPart)
router.get("/parts/:partNumber", getPartByNumber)
router.get("/parts", getAllCarParts)
router.get("/parts/table/delete", deleteSpecificCarPartTable);
router.put("/parts/:partNumber", updatePartName)
router.post("/parts/delete/:partNumber", deletePart)
router.get("/", getAllCarParts)
router.get("/parts/addto/:projectId", addCarPartToProject);



module.exports = {
    router,
    routeRoot
}