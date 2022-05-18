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
 async function createProject(request, response){
    // Getting the values
    let name = request.body.name;
    let description = request.body.description;
    let userId = await usersModel.getUserByName(request.cookies.username);
   
    // If the user id is not specified
    if (userId === -1){
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
        if(login != null) {
            login = login.userSession.username;
        }

        const pageData = {
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
    
        logger.info(`CREATED PROJECT (Name: ${name}, Description: ${description} -- loginUser`);
        response.status(201).render('allProjects.hbs', pageData);

    } catch(error) {
        const pageData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            titleName: 'Create a Project',
            pathNameForActionForm: 'projects',
            projects: await projectModel.getAllProjects(),
            clickedNewProject: false,
            loggedInUser: login
        }
        
        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            pageData.alertMessage = "Error connecting to database.";
            logger.error(`DatabaseConnectionError when CREATING PROJECT ${name} -- createProject`);
            response.status(500).render('allProjects.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            logger.error(`UserLoginError when CREATING PROJECT ${name} -- createProject`);
            response.status(404).render('allProjects.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to create project: ${error.message}`;
            logger.error(`OTHER error when CREATING PROJECT ${name} -- createProject`);
            response.status(500).render('allProjects.hbs', pageData);
        }
    }
}

/**
 * Renders the projects page with the given data. 
 * @param {*} request 
 * @param {*} response 
 */
 async function showProjects(request, response){

    let login = loginController.authenticateUser(request);

     // Set the login to the username if response is not null
     if(login != null) {
        login = login.userSession.username;
    }

    // Page data 
    const pageData = {
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

    // If there's no projects
    if (pageData.projects.length == 0){
        logger.info(`CANNOT SHOW PROJECTS TABLE due to there being no projects created -- showProjects`);
        pageData.showTable = false;
    }

    logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
    response.status(201).render('allProjects.hbs', pageData);
}

/**
 * Shows the create project form.
 * @param {*} request 
 * @param {*} response 
 */
async function showCreateForm(request, response){
    let login = loginController.authenticateUser(request);

     // Set the login to the username if response is not null
     if(login != null) {
        login = login.userSession.username;
    }

    // Page data 
    const pageData = {
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

    // logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
    response.status(201).render('allProjects.hbs', pageData);
}
/**
 * Called when adding a car part
 * @param {*} request 
 * @param {*} response 
 */

async function addCarPart(request, response){
    try{
        let partNumber = request.body.partNumber;
        let projectId = request.params.projectId;

        await projectModel.addPartToProject(projectId, partNumber);

        const pageData = {
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
            loggedInUser: true
        }
        response.status(201).render('home.hbs', pageData);
    }
    catch(error) {
        const pageData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            loggedInUser: LOGGED_IN_USER
        }

        if (error instanceof sqlModel.DatabaseConnectionError){
            pageData.alertMessage = "Error connecting to database.";
            logger.error(`DatabaseConnectionError when CREATING PROJECT ${name} -- createProject`);
            response.status(500).render('home.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            logger.error(`UserLoginError when CREATING PROJECT ${name} -- createProject`);
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
            logger.error(`OTHER error when CREATING PROJECT ${name} -- createProject`);
            response.status(500).render('home.hbs', pageData);
        }
    }
}

/**
 * Shows the specified project on a new page.
 * @param {*} request 
 * @param {*} response 
 */
async function showSpecificProject(request, response){
    let projectID = request.params.projectId;
    let theProject = await projectModel.getProjectByProjectId(projectID);
    let allCarPartsInProject = await projectModel.getProjectCarParts(projectID);
    let login = loginController.authenticateUser(request);
    let arrayOFCatPartsInProject = await partsModel.getArrayOfCarPartsInProject(allCarPartsInProject);
    let showImage = false;

    if(arrayOFCatPartsInProject.length === 0){

    }
    // Set the login to the username if response is not null
    if(login != null) {
        login = login.userSession.username;
    }

    // Page data 
    const pageData = {
            alertOccurred: false,
            display_signup: "none",
            display_login: "block",
            logInlogOutText: "Log Out",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            clickedNewProject: false,
            Home: "Home",
            loggedInUser: login,
            projectName: theProject[0].name,
            projectDescription: theProject[0].description,
            projectId: projectID,
            projectParts: arrayOFCatPartsInProject
    }

    // logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
    response.status(201).render('showProject.hbs', pageData);
}

/**
 * Updates the project details.
 * @param {*} request 
 * @param {*} response 
 */
async function updateProject(request, response){
    // Get the values
    let name = request.body.name;
    let description = request.body.description;
    let projectID = request.params.projectId;
    let login = loginController.authenticateUser(request);

    // Set the login to the username if response is not null
    if(login != null) {
        login = login.userSession.username;
    }

    await projectModel.updateProject(name, description, projectID);
    
    // Page data 
    const pageData = {
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

    // logger.info(`SHOWING ALL PROJECTS  -- showProjects`);
    response.redirect(`/projects/${projectID}`);
    response.status(201).render('showProject.hbs', pageData);
}

router.post("/projects", createProject);
router.get("/projects", showProjects);
router.post("/projects/new", showCreateForm);
router.get("/projects/:projectId", showSpecificProject);
router.post("/projects/:projectId/update", updateProject);

router.post("/projects/:projectId", addCarPart)


module.exports = {
    router,
    routeRoot
}