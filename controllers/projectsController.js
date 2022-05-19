'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const logger = require('../logger');
const sqlModel = require('../models/carPartModelMysql.js');
const validUtils = require('../validateUtils.js');
const partsModel = require('../models/carPartModelMysql');
const usersModel = require('../models/userModel');
const projectModel = require('../models/projectModel');
const loginController = require('./loginController');

/**
 * POST controller method that allows the user to create projects
 * @param {*} request 
 * @param {*} response 
 */
async function createProject(request, response) {
    // Getting the values
    let name = request.body.name;
    let description = request.body.description;
    let userId = await usersModel.getUserByName(request.cookies.username);
    const lang = request.cookies.language;

    // If the user id is not specified
    if (userId === -1) {
        logger.error(`No user to create project -- createProject`);
        throw new sqlModel.DatabaseConnectionError("The project is not associated with a user");
    }

    try {
        // Add project
        let projectId = await projectModel.addProject(name, description)
        await projectModel.addUserToProject(projectId, userId);
        let projs = await projectModel.getAllProjects(request.cookies.username);
        let login = loginController.authenticateUser(request);

        // Set the login to the username if response is not null
        if (login != null) {
            login = login.userSession.username;
        }

        let pageData;

        if (!lang || lang === 'en') {
            pageData = {
                alertOccurred: true,
                alertMessage: "You have successfully added a project!",
                alertLevel: 'success',
                alertLevelText: 'success',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Create a Project',
                pathNameForActionForm: 'projects',
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Log Out",
                signUpText: "Sign Up",
                endpointLogInLogOut: "login",
                projects: projs,
                clickedNewProject: false,
                Home: "Home",
                loggedInUser: login
            }
        }
        else {
            pageData = {
                alertOccurred: true,
                alertMessage: "Vous avez ajouté un projet avec succès!",
                alertLevel: 'success',
                alertLevelText: 'success',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Créer un Projet',
                pathNameForActionForm: 'projects',
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Déconnecter",
                signUpText: "Enregistrer",
                endpointLogInLogOut: "login",
                projects: projs,
                clickedNewProject: false,
                Home: "Accueil",
                loggedInUser: login
            }
        }


        logger.info(`CREATED PROJECT (Name: ${name}, Description: ${description} -- loginUser`);
        response.cookie("lastAccessedProject", projectId);
        response.status(201).render('allProjects.hbs', pageData);

    } catch (error) {
        let pageData;

        if (!lang || lang === 'en') {
            pageData = {
                alertOccurred: true,
                alertMessage: "",
                alertLevel: 'danger',
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Create a Project',
                pathNameForActionForm: 'projects',
                projects: await projectModel.getAllProjects(),
                clickedNewProject: false,
                loggedInUser: login,
                errorCode: ""
            }
        }
        else {
            pageData = {
                alertOccurred: true,
                alertMessage: "",
                alertLevel: 'danger',
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Créer un Projet',
                pathNameForActionForm: 'projects',
                projects: await projectModel.getAllProjects(),
                clickedNewProject: false,
                loggedInUser: login,
                errorCode: ""
            }
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            logger.error(`DatabaseConnectionError when CREATING PROJECT ${name} -- createProject`);
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError) {
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            logger.error(`InvalidInputError when CREATING PROJECT ${name} -- createProject`);
            response.status(404).render('allProjects.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to create project: ${error.message}`;
            pageData.errorCode = 500;
            logger.error(`OTHER error when CREATING PROJECT ${name} -- createProject`);
            response.status(500).render('error.hbs', pageData);
        }
    }
}

/**
 * Renders the projects page with the given data. 
 * @param {*} request 
 * @param {*} response 
 */
async function showProjects(request, response) {

    try {
        let login = loginController.authenticateUser(request);
    
        // Set the login to the username if response is not null
        if (login != null) {
            login = login.userSession.username;
        }
    
        const lang = request.cookies.language;
        let pageData;
    
        if (!lang || lang === 'en') {
            pageData = {
                alertOccurred: false,
                showTable: true,
                tableMessage: "You do not have any Projects.",
                titleName: 'Create a Project',
                pathNameForActionForm: 'projects',
                projects: await projectModel.getAllProjects(request.cookies.username),
                Home: "Home",
                logInlogOutText: "Log Out",
                loggedInUser: login
            }
        }
        else {
            pageData = {
                alertOccurred: false,
                showTable: true,
                tableMessage: "Vous n'avez aucun Projet.",
                titleName: 'Créer un Projet',
                pathNameForActionForm: 'projects',
                projects: await projectModel.getAllProjects(request.cookies.username),
                Home: "Accueil",
                logInlogOutText: "Déconnecter",
                loggedInUser: login
            }
        }

        // If there's no projects
        if (pageData.projects.length == 0) {
            logger.info(`CANNOT SHOW PROJECTS TABLE due to there being no projects created -- showProjects`);
            pageData.showTable = false;
        }
    
        logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
        response.status(201).render('allProjects.hbs', pageData);
    } 
    catch (error) {
        let pageData;

        if (!lang || lang === 'en') {
            pageData = {
                alertOccurred: true,
                alertMessage: "",
                alertLevel: 'danger',
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Create a Project',
                pathNameForActionForm: 'projects',
                projects: await projectModel.getAllProjects(),
                clickedNewProject: false,
                loggedInUser: login,
                errorCode: ""
            }
        }
        else {
            pageData = {
                alertOccurred: true,
                alertMessage: "",
                alertLevel: 'danger',
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Créer un Projet',
                pathNameForActionForm: 'projects',
                projects: await projectModel.getAllProjects(),
                clickedNewProject: false,
                loggedInUser: login,
                errorCode: ""
            }
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            logger.error(`DatabaseConnectionError when SHOWING PROJECTS -- showProjects`);
            response.status(500).render('error.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to show projects: ${error.message}`;
            pageData.errorCode = 500;
            logger.error(`OTHER error when SHOWING PROJECTS -- showProjects`);
            response.status(500).render('error.hbs', pageData);
        }
    }
}

/**
 * Shows the create project form.
 * @param {*} request 
 * @param {*} response 
 */
async function showCreateForm(request, response) {
    let login = loginController.authenticateUser(request);

    // Set the login to the username if response is not null
    if (login != null) {
        login = login.userSession.username;
    }

    const lang = request.cookies.language;
    let pageData;

    if (!lang || lang === 'en') {
        // Page data 
        pageData = {
            alertOccurred: false,
            showTable: true,
            tableMessage: "You do not have any Projects.",
            titleName: 'Create a Project',
            pathNameForActionForm: 'projects',
            Home: "Home",
            logInlogOutText: "Log Out",
            loggedInUser: login,
            clickedNewProject: true
        }
    }
    else {
        // Page data 
        pageData = {
            alertOccurred: false,
            showTable: true,
            tableMessage: "Vous n'avez aucun Projet.",
            titleName: 'Créer un Projet',
            pathNameForActionForm: 'projects',
            Home: "Accueil",
            logInlogOutText: "Déconnecter",
            loggedInUser: login,
            clickedNewProject: true
        }
    }

    // logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
    response.status(201).render('allProjects.hbs', pageData);
}

/**
 * Called when adding a car part
 * @param {*} request 
 * @param {*} response 
 */

async function addCarPart(request, response) {
    const lang = request.cookies.language;

    try {
        let partNumber = request.body.partNumber;
        let projectId = request.params.projectId;

        await projectModel.addPartToProject(projectId, partNumber);

        let pageData;

        if (!lang || lang === 'en') {
            pageData = {
                alertOccurred: true,
                alertMessage: "You have successfully added to a project!",
                alertLevel: 'success',
                alertLevelText: 'success',
                alertHref: 'exclamation-triangle-fill',
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Log Out",
                signUpText: "Sign Up",
                endpointLogInLogOut: "login",
                clickedNewProject: false,
                Home: "Home",
                loggedInUser: true,
                Add: "Add a Car part",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: "Update a Car Part",
                Delete: "Delete a Car Part",
                projects_text: "Projects",
                about_text: "About Us",
                Current: "English"
            }
        }
        else {
            pageData = {
                alertOccurred: true,
                alertMessage: "Vous avez ajouté à un projet avec succès!",
                alertLevel: 'success',
                alertLevelText: 'success',
                alertHref: 'exclamation-triangle-fill',
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Déconnecter",
                signUpText: "Enregistrer",
                endpointLogInLogOut: "login",
                clickedNewProject: false,
                Home: "Accueil",
                loggedInUser: true,
                Add: "Ajouter une Pièce Auto",
                Show: "Trouver une Pièce Auto",
                List: "Afficher Toutes les Pièces de Voiture",
                Edit: "Mettre à Jour une Pièce Auto",
                Delete: "Supprimer une Pièce Auto",
                projects_text: "Projets",
                about_text: "À propos de nous",
                Current: "French"
            }
        }


        response.cookie("lastAccessedProject", projectId);
        response.status(201).render('home.hbs', pageData);
    }
    catch (error) {
        let pageData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            loggedInUser: lang,
            errorCode: "",
            alertMessage: ""
        }

         // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            logger.error(`DatabaseConnectionError when ADDING CAR PAR to PROJECT ${partNumber} -- addCarPart`);
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError) {
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            logger.error(`InvalidInputError when ADDING CAR PAR to PROJECT ${partNumber} -- addCarPart`);
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
            pageData.errorCode = 500;
            logger.error(`OTHER error when ADDING CAR PAR to PROJECT ${partNumber} -- addCarPart`);
            response.status(500).render('error.hbs', pageData);
        }
    }
}

let theProjectId;

/**
 * Shows the specified project on a new page.
 * @param {*} request 
 * @param {*} response 
 */
async function showSpecificProject(request, response) {
    try {
        let projectID = request.params.projectId;
        let theProject = await projectModel.getProjectByProjectId(projectID);
        let allCarPartsInProject = await projectModel.getProjectCarParts(projectID);
        let login = loginController.authenticateUser(request);
        let arrayOFCatPartsInProject = await partsModel.getArrayOfCarPartsInProject(allCarPartsInProject);
        let noPartsFound, name, description;
        // console.log(this.);
    
        if (arrayOFCatPartsInProject.length === 0) {
            noPartsFound = true;
        }
        else {
            name = theProject[0].name;
            theProject[0].description;
        }
        if (projectID != 'null') {
            theProjectId = projectID;
        }
        // Set the login to the username if response is not null
        if (login != null) {
            login = login.userSession.username;
        }
    
        const lang = request.cookies.language;
        let pageData;
    
        if (!lang || lang === 'en') {
            //Page data
            pageData = {
                alertOccurred: false,
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Log Out",
                signUpText: "Sign Up",
                endpointLogInLogOut: "login",
                clickedNewProject: false,
                Home: "Home",
                loggedInUser: login,
                projectName: name,
                projectDescription: description,
                projectId: parseInt(theProjectId),
                projectParts: arrayOFCatPartsInProject,
                noParts: noPartsFound
            }
        }
        else {
            pageData = {
                alertOccurred: false,
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Déconnecter",
                signUpText: "Enregistrer",
                endpointLogInLogOut: "login",
                clickedNewProject: false,
                Home: "Accueil",
                loggedInUser: login,
                projectName: name,
                projectDescription: description,
                projectId: parseInt(theProjectId),
                projectParts: arrayOFCatPartsInProject,
                noParts: noPartsFound
            }
        }
    
        // logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
        response.status(201).render('showProject.hbs', pageData);
    } 
    catch (error) {
        let pageData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            loggedInUser: lang,
            errorCode: "",
            alertMessage: ""
        }

         // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            logger.error(`DatabaseConnectionError when ADDING CAR PAR to PROJECT  -- showSpecificProject`);
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError) {
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            logger.error(`InvalidInputError when SHOWING SPECIFIC PROJECT -- showSpecificProject`);
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
            pageData.errorCode = 500;
            logger.error(`OTHER error when SHOWING SPECIFIC PROJECT -- showSpecificProject`);
            response.status(500).render('error.hbs', pageData);
        }
    }
}

/**
 * Updates the project details.
 * @param {*} request 
 * @param {*} response 
 */
async function updateProject(request, response) {
    // Get the values
    let name = request.body.name;
    let description = request.body.description;
    let projectID = request.params.projectId;
    let login = loginController.authenticateUser(request);

    try {    
        // Set the login to the username if response is not null
        if (login != null) {
            login = login.userSession.username;
        }
    
        await projectModel.updateProject(name, description, projectID);
    
        const lang = request.cookies.language;
        let pageData;
    
        if (!lang || lang === 'en') {
            // Page data 
            pageData = {
                alertOccurred: true,
                alertMessage: `Successfully updated project ${name}!`,
                alertLevel: 'success',
                alertLevelText: 'success',
                alertHref: 'exclamation-triangle-fill',
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Log Out",
                signUpText: "Sign Up",
                endpointLogInLogOut: "login",
                clickedNewProject: false,
                Home: "Home",
                loggedInUser: login,
            }
        }
        else {
            // Page data 
            pageData = {
                alertOccurred: true,
                alertMessage: `Projet mis à jour avec succès ${name}!`,
                alertLevel: 'success',
                alertLevelText: 'success',
                alertHref: 'exclamation-triangle-fill',
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Déconnecter",
                signUpText: "Enregistrer",
                endpointLogInLogOut: "login",
                clickedNewProject: false,
                Home: "Acceuil",
                loggedInUser: login,
            }
        }
    
    
        // logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
        response.cookie("lastAccessedProject", projectID);
        response.redirect(`/projects/${projectID}`);
        response.status(201).render('showProject.hbs', pageData);
    } 
    catch (error) {
        let pageData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            errorCode: "",
            alertMessage: "",
            display_signup: "none",
            display_login: "block",
            logInlogOutText: "Déconnecter",
            signUpText: "Enregistrer",
            endpointLogInLogOut: "login",
            clickedNewProject: false,
            Home: "Accueil",
            loggedInUser: login,
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            logger.error(`DatabaseConnectionError when UPDATING PROJECT ${name} -- updateProject`);
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError) {
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            logger.error(`InvalidInputError when UPDATING PROJECT ${name} -- updateProject`);
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
            pageData.errorCode = 500;
            logger.error(`OTHER error when UPDATING PROJECT ${name} -- updateProject`);
            response.status(500).render('error.hbs', pageData);
        }
    }
}

async function deleteProject(request, response) {
    // Get the values
    let projectID = request.params.projectId;

    try {
        let login = loginController.authenticateUser(request);

        // Set the login to the username if response is not null
        if (login != null) {
            login = login.userSession.username;
        }

        await projectModel.deleteProject(projectID);

        // Page data 
        const pageData = {
            alertOccurred: true,
            alertMessage: `Successfully deleted project ${projectID}!`,
            alertLevel: 'success',
            alertLevelText: 'success',
            alertHref: 'exclamation-triangle-fill',
            display_signup: "none",
            display_login: "block",
            logInlogOutText: "Log Out",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            clickedNewProject: false,
            Home: "Home",
            loggedInUser: login,
        }

        // logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
        response.redirect(`/projects`);
        // response.status(201).render('allProjects.hbs', pageData);
    }
    catch (error) {
        let pageData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            loggedInUser: lang,
            errorCode: "",
            alertMessage: ""
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            logger.error(`DatabaseConnectionError when DELETING PROJECT ${projectID} -- deleteProject`);
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError) {
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            logger.error(`InvalidInputError when DELETING PROJECT ${projectID} -- deleteProject`);
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
            pageData.errorCode = 500;
            logger.error(`OTHER error when DELETING PROJECT ${projectID} -- deleteProject`);
            response.status(500).render('error.hbs', pageData);
        }
    }
}

async function deletePartFromProject(request, response) {
    // Get the values
    let projectID = request.params.projectId;
    let partNumber = request.params.partNumber;

    try {
        let login = loginController.authenticateUser(request);

        // Set the login to the username if response is not null
        if (login != null) {
            login = login.userSession.username;
        }

        await projectModel.deletePartFromProject(projectID, partNumber);

        // Page data 
        const pageData = {
            alertOccurred: true,
            alertMessage: `Successfully deleted project ${projectID}!`,
            alertLevel: 'success',
            alertLevelText: 'success',
            alertHref: 'exclamation-triangle-fill',
            display_signup: "none",
            display_login: "block",
            logInlogOutText: "Log Out",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            clickedNewProject: false,
            Home: "Home",
            loggedInUser: login,
        }

        // logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
        response.redirect(`/projects/${projectID}`);
        // response.status(201).render('allProjects.hbs', pageData);
    }
    catch (error) {
        let pageData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            titleName: 'Créer un Projet',
            pathNameForActionForm: 'projects',
            projects: await projectModel.getAllProjects(),
            clickedNewProject: false,
            loggedInUser: login,
            errorCode: ""
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            logger.error(`DatabaseConnectionError when DELETING PART ${partNumber} from PROJECT ${projectID} -- deletePartFromProject`);
            response.status(500).render('error.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to show projects: ${error.message}`;
            pageData.errorCode = 500;
            logger.error(`OTHER error when DELETING PART ${partNumber} from PROJECT ${projectID} -- deletePartFromProject`);
            response.status(500).render('error.hbs', pageData);
        
        }
    }
}


router.post("/projects", createProject);
router.get("/projects", showProjects);
router.post("/projects/new", showCreateForm);
router.get("/projects/:projectId", showSpecificProject);
router.post("/projects/:projectId/update", updateProject);

router.post("/projects/:projectId", addCarPart)
router.get("/projects/del/:projectId", deleteProject);
router.post("/projects/del/part/:projectId/:partNumber", deletePartFromProject);


module.exports = {
    router,
    routeRoot
}