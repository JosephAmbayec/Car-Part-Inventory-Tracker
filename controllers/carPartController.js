'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const sqlModel = require('../models/carPartModelMysql.js');
const validUtils = require('../validateUtils.js');
const logger = require('../logger');
const projectModel = require('../models/projectModel');
const loginController = require('./loginController');
const userModel = require('../models/userModel');

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

    // If the image is not a valid url, set image to null
    if (!validUtils.isURL(image)){
        image = null;
        logger.info("Setting image to null -- createPart");
    }
    
    // If the condition is not valid, set the condition to 'unknown'
    if (validUtils.stringIsEmpty(condition)){
        condition = "unknown";
        logger.info("Setting condition to 'unknown' -- createPart");
    }
        
    try {
        await sqlModel.addCarPart(number, partName, condition, image);
        logger.info(`CREATED car part (Part #${number}, ${partName}, Condition: ${condition}) -- createPart`);

        response.status(201).render('home.hbs', {alertOccurred: true, alertMessage: `Created part: Part #${number}, ${partName}, Condition: ${condition}`});

    } 
    catch(error) {

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            const data = {
                alertMessage: "There was an error connecting to the database.",
                errorCode: 500
            }
            logger.error("DatabaseConnectionError when CREATING part -- createPart");
            response.status(500).render('error.hbs', data);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error("InvalidInputError when CREATING part -- createPart");
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable. Ensure the url is a valid image url"});
        }
        // If any other error
        else {
            const data = {
                message: `Unexpected error while trying to add part: ${error.message}`,
                errorCode: 500
            }
            logger.error("OTHER error when CREATING part -- createPart");
            response.status(500).render('error.hbs', data);
        }
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

    try {
        let part = await sqlModel.findCarPartByNumber(number);
        let output, signupDisplay, endpoint, logInText;
        let login = loginController.authenticateUser(request);
        let role = await userModel.determineRole(login);

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
            }

            logger.info(`DID NOT FIND car part by number ${number} -- getPartByNumber`);
            response.status(404).render('home.hbs', output);
        }
        // If the part was found
        else{
            output = {
                alertOccurred: true,
                alertMessage: `Successfully found car part ${number}!`,
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
            }

            logger.info(`FOUND car part by number ${number} -- getPartByNumber`);
            response.status(200).render('home.hbs', output);
        }
    }
    catch(error){

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            const data = {
                alertMessage: "There was an error connecting to the database.",
                errorCode: 500
            }
            logger.error(`DatabaseConnectionError when FINDING car part by number ${number} -- getPartByNumber`);
            response.status(500).render('error.hbs', data);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error(`InvalidInputError when FINDING car part by number ${number} -- getPartByNumber`);
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            const data = {
                alertMessage: `Unexpected error while trying to show part: ${error.message}`,
                errorCode: 500
            }
            logger.error(`OTHER error when FINDING car part by number ${number} -- getPartByNumber`);
            response.status(500).render('error.hbs', data);
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
            AccessProjectName = AccessProjectName[0].name;
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
                about_text: "About Us"
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
                    about_text: "À propos de nous"
                }

            }

            logger.info(`NOT RETRIEVED all car parts from database -- getAllCarParts`);
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
                    about_text: "About Us"
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
            }
            // If the language is french
            else{
                output.signUpText = "Enregistrer";
                output.Add = "Ajouter une Pièce Auto";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = "Mettre à Jour une Pièce Auto";
                output.Delete = "Supprimer une Pièce Auto";
                output.projects_text = "Projets";

                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }

            logger.info(`RETRIEVED ALL car parts from database -- getAllCarParts`);
            response.status(200).render('home.hbs', output)
        }  
    }
    catch(error){

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            const data = {
                message: "There was an error connecting to the database.",
                errorCode: 500
            }
            logger.error("DatabaseConnectionError when RETRIEVING all car parts -- getAllCarParts");
            response.status(500).render('error.hbs', data);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error("InvalidInputError when RETRIEVING all car parts -- getAllCarParts");
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            const data = {
                message: `Unexpected error while trying to show part: ${error.message}`,
                errorCode: 500
            }
            logger.error("OTHER error when RETRIEVING all car parts -- getAllCarParts");
            response.status(500).render('error.hbs', data);
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

    try {

        // If the car part doesn't exist in the database
        if (!await sqlModel.verifyCarPartExists(partNumber)){
            logger.info(`NOT UPDATED car part ${partNumber} because car part DOESN'T exist -- updatePartName`);
            response.status(404).render('home.hbs', {message:`Could not find part #${partNumber}`});
        }
        else{
            await sqlModel.updateCarPartName(partNumber, newName)
                .then(part => {
                    logger.info(`UPDATED car part ${partNumber} in database -- updatePartName`);
                    response.status(200).render('home.hbs', {message:`Updated part name with part number ${part.partNumber} to ${part.name}`});
                })
        }
    }
    catch(error){
        
        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            const data = {
                message: "There was an error connecting to the database.",
                errorCode: 500
            }
            logger.error(`DatabaseConnectionError when UPDATING car part ${partNumber} -- updatePartName`);
            response.status(500).render('error.hbs', data);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error(`InvalidInputError when UPDATING car part ${partNumber} -- updatePartName`);
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            const data = {
                message: `Unexpected error while trying to show part: ${error.message}`,
                errorCode: 500
            }
            logger.error(`OTHER error when UPDATING car part ${partNumber} -- updatePartName`);
            response.status(500).render('error.hbs', data);
        }
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
                    accessProjectName: AccessProjectName
                }

            }

            logger.info(`NOT RETRIEVED all car parts from database -- getAllCarParts`);
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
                about_text: "About Us"
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
                    accessProjectName: AccessProjectName
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
            }
            // If the language is french
            else{
                output.signUpText = "Enregistrer";
                output.Add = "Ajouter une Pièce Auto";
                output.Show = "Trouver une Pièce Auto";
                output.List = "Afficher Toutes les Pièces de Voiture";
                output.Edit = "Mettre à Jour une Pièce Auto";
                output.Delete = "Supprimer une Pièce Auto";

                if(logInText === "Log In"){
                    output.logInlogOutText = "Connexion";
                }
                else if(logInText === "Log Out"){
                    output.logInlogOutText = "Se déconnecter";
                }
            }

            logger.info(`RETRIEVED ALL car parts from database -- getAllCarParts`);
            response.status(200).render('home.hbs', output)
        }  
    }
    catch(error){

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            const data = {
                message: "There was an error connecting to the database.",
                errorCode: 500
            }
            logger.error("DatabaseConnectionError when RETRIEVING all car parts -- getAllCarParts");
            response.status(500).render('error.hbs', data);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error("InvalidInputError when RETRIEVING all car parts -- getAllCarParts");
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            const data = {
                message: `Unexpected error while trying to show part: ${error.message}`,
                errorCode: 500
            }
            logger.error("OTHER error when RETRIEVING all car parts -- getAllCarParts");
            response.status(500).render('error.hbs', data);
        }
    }
}

async function addCarPartToProject(request, response){
    try {
        // Getting the values
        let projectId = request.params.projectId;
        
        let result = await projectModel.addPartToProject(projectId);
        console.log(result);
    } 
    catch (error) {
        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            const data = {
                message: "There was an error connecting to the database.",
                errorCode: 500
            }
            logger.error(`DatabaseConnectionError when ADDING car part to PROJECT ${partNumber} -- addCarPartToProject`);
            response.status(500).render('error.hbs', data);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error(`InvalidInputError when ADDING car part to PROJECT ${partNumber} -- addCarPartToProject`);
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            const data = {
                message: `Unexpected error while trying to show part: ${error.message}`,
                errorCode: 500
            }
            logger.error(`OTHER error when ADDING car part to PROJECT ${partNumber} -- addCarPartToProject`);
            response.status(500).render('error.hbs', data);
        }
    }
}

/**
 * Deletes the specified car part from the database.
 * @param {*} request 
 * @param {*} response 
 */
async function deletePart(request, response){
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
                logger.info(`DELETING car part ${partNumber} controller -- deletePart`);
            }
            else{
                response.status(404);
                logger.info(`DELETING car part ${partNumber} failed -- deletePart`);
            }

            // response.status(202).render('home.hbs', {message: `Deleted part with part number ${part.partNumber}`});

            response.redirect('/parts/table/delete');
        }
        // If the car part doesn't exists
        else{
            logger.info(`NOT DELETING car part ${partNumber} in database -- deletePart`);
            response.status(404).render('home.hbs', {message:`Could not find part #${partNumber}`});
        }
    } 
    catch (error) {
        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            const data = {
                message: "There was an error connecting to the database.",
                errorCode: 500
            }
            logger.error(`DatabaseConnectionError when DELETING car part ${partNumber} -- deletePart`);
            response.status(500).render('error.hbs', data);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error(`InvalidInputError when DELETING car part ${partNumber} -- deletePart`);
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            const data = {
                message: `Unexpected error while trying to show part: ${error.message}`,
                errorCode: 500
            }
            logger.error(`OTHER error when DELETING car part ${partNumber} -- deletePart`);
            response.status(500).render('error.hbs', data);
        }
    }
}


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