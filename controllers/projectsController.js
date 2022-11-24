'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const sqlModel = require('../models/carPartModelMysql.js');
const validUtils = require('../validateUtils.js');
const partsModel = require('../models/carPartModelMysql');
const usersModel = require('../models/userModel');
const projectModel = require('../models/projectModel');
const loginController = require('./loginController');
const homeController = require('../controllers/homeController');

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
    let pageData;
    let login = loginController.authenticateUser(request);
    let signupDisplay, endpoint, logInText;

    // Set the login to the username if response is not null
    if(login != null) {
        login = login.userSession.username;
        signupDisplay = "none";
        endpoint = "logout";
        logInText = "Log Out";
    }
    else{
        response.redirect('/parts');
    }

    try {
        // If the user id is not specified
        if (userId === -1) {
            throw new sqlModel.DatabaseConnectionError("The project is not associated with a user");
        }

        // Add project
        let projectId = await projectModel.addProject(name, description)
        await projectModel.addUserToProject(projectId, userId);
        let projs = await projectModel.getAllProjects(request.cookies.username);


        if (!lang || lang === 'en') {
            pageData = {
                alertOccurred: false,
                showTable: true,
                tableMessage: "You do not have any Projects.",
                titleName: 'Create a Project',
                pathNameForActionForm: 'projects',
                projects: await projectModel.getAllProjects(request.cookies.username),
                Home: "Home",
                logInlogOutText: logInText,
                loggedInUser: login,
                see_more: "See more",
                about_text: "About Us",
                endpointLogInLogOut: endpoint,
                projects_text: "Projects",
                clickedNewProject: true,
                footerData: footerLangObject(lang),
                new_project: "New Project",
                your_projects: "Your Projects",
            }
        }
        else {
            pageData = {
                alertOccurred: true,
                alertMessage: "Vous avez ajouté un projet avec succès!",
                alertLevel: 'success',
                alertLevelText: 'success',
                alertHref: 'exclamation-triangle-fill',
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Déconnecter",
                signUpText: "Enregistrer",
                endpointLogInLogOut: "login",
                projects: projs,
                clickedNewProject: false,
                Home: "Accueil",
                loggedInUser: login,
                new_project: "Nouveau Projet",
                your_projects: "Vos Projets",
                see_more: "Voir plus",
                footerData: footerLangObject(lang)
            }
        }


        response.cookie("lastAccessedProject", projectId);
        // response.status(201).render('allProjects.hbs', pageData);
        response.redirect('/projects');
    } 
    catch (error) {
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
                footerData: footerLangObject(lang)
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
                footerData: footerLangObject(lang)
            }
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "Error connecting to database.";
            response.status(500).render('allProjects.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError) {
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            response.status(404).render('allProjects.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to create project: ${error.message}`;
            response.status(500).render('allProjects.hbs', pageData);
        }
    }
}

/**
 * Renders the projects page with the given data. 
 * @param {*} request 
 * @param {*} response 
 */
async function showProjects(request, response) {

    let signupDisplay, endpoint, logInText;
    let login = loginController.authenticateUser(request);

    // Set the login to the username if response is not null
    if(login != null) {
        login = login.userSession.username;
        signupDisplay = "none";
        endpoint = "logout";
        logInText = "Log Out";

        const lang = request.cookies.language;
        let pageData;

        let allProjs = await projectModel.getAllProjects(request.cookies.username);

        try{
            if (!lang || lang === 'en') {
                pageData = {
                    alertOccurred: false,
                    showList: true,
                    tableMessage: "You do not have any Projects.",
                    titleName: 'Create a Project',
                    pathNameForActionForm: 'projects',
                    projects: allProjs,
                    noProjects: allProjs.length === 0 ? true : false,
                    noprojects_Available: "It seems you haven't created a project yet!",
                    click_CreateProj: "Click the 'New Project' button on the left to get started!",
                    endpointLogInLogOut: endpoint,
                    about_text: "About Us",
                    projects_text: "Projects",
                    Home: "Home",
                    logInlogOutText: logInText,
                    loggedInUser: login,
                    new_project: "New Project",
                    your_projects: "Your Projects",
                    see_more: "See more",
                    last_updated: "Last updated 3 minutes ago",
                    footerData: footerLangObject(lang)
                }
            }
            else {
                pageData = {
                    alertOccurred: false,
                    showList: true,
                    tableMessage: "Vous n'avez aucun Projet.",
                    titleName: 'Créer un Projet',
                    pathNameForActionForm: 'projects',
                    projects: allProjs,
                    noProjects: allProjs.length === 0 ? true : false,
                    noprojects_Available: "Il semble que vous n'ayez pas encore créé de projet!",
                    click_CreateProj: "Cliquez sur le bouton « Nouveau projet » à gauche pour commencer!",
                    Home: "Accueil",
                    logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                    loggedInUser: login,
                    new_project: "Nouveau Projet",
                    your_projects: "Vos Projets",
                    projects_text: "Projets",
                    see_more: "Voir plus",
                    last_updated: "Dernière mise à jour il y a 3 minutes",
                    about_text: "À Propos de Nous",
                    endpointLogInLogOut: endpoint,
                    footerData: footerLangObject(lang)
                }
            } 

            // If there's no projects
            if (pageData.projects.length == 0) {
                pageData.showTable = false;
            }

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
                    errorCode: "",
                    footerData: footerLangObject(lang)
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
                    errorCode: "",
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
                pageData.alertMessage = `Unexpected error while trying to show projects: ${error.message}`;
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
    }

    // If there's no projects
    if (pageData.projects.length == 0) {
        pageData.showTable = false;
    }

    response.status(201).render('allProjects.hbs', pageData);
    }
    // Redirect to home page since a user shouldn't be viewing the project if not logged in
    else{
        response.redirect('/parts');
    }
}

/**
 * Shows the create project form.
 * @param {*} request 
 * @param {*} response 
 */
async function showCreateForm(request, response) {
    let signupDisplay, endpoint, logInText;
    let login = loginController.authenticateUser(request);

    // Set the login to the username if response is not null
        if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Log Out";
        }
        // Redirect to home page since a user shouldn't be viewing the project if not logged in
        else{
            response.redirect('/parts');
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
            logInlogOutText: logInText,
            loggedInUser: login,
            clickedNewProject: true,
            project_name: "Project Name",
            name_field: "Enter a project name",
            project_description: "Project Description",
            description_field: "Enter a description",
            back_button: "Return",
            endpointLogInLogOut: endpoint,
            projects_text: "Projects",
            about_text: "About Us",
            footerData: footerLangObject(lang)
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
            logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
            loggedInUser: login,
            clickedNewProject: true,
            project_name: "Nom du Projet",
            name_field: "Entrez un nom de Projet",
            project_description: "Description du Projet",
            description_field: "Entrez une description",
            back_button: "Retournez",
            endpointLogInLogOut: endpoint,
            projects_text: "Projets",
            about_text: "À propos de nous",
            footerData: footerLangObject(lang)
        }
    }


    response.status(201).render('allProjects.hbs', pageData);
}
/**
 * Called when adding a car part
 * @param {*} request 
 * @param {*} response 
 */
async function addCarPart(request, response) {
    let login = loginController.authenticateUser(request);
    let signupDisplay, endpoint, logInText;
    let partNumber = request.body.partNumber;
    let projectId = request.params.projectId;
    const lang = request.cookies.language;

        // Set the login to the username if response is not null
        if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Log Out";

            let role = await usersModel.determineRole(login);
    
            try {
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
                        logInlogOutText: logInText,
                        signUpText: "Sign Up",
                        endpointLogInLogOut: endpoint,
                        clickedNewProject: false,
                        Home: "Home",
                        loggedInUser: login,
                        projects_text: "Projects",
                        about_text: "About Us",
                        Current: "English",
                        footerData: footerLangObject(lang),
                        showList: true,
                        tableMessage: "You do not have any Projects.",
                        titleName: 'Create a Project',
                        pathNameForActionForm: 'projects',
                        projects: await projectModel.getAllProjects(request.cookies.username),
                        new_project: "New Project",
                        your_projects: "Your Projects",
                        see_more: "See more",
                        last_updated: "Last updated 3 minutes ago",
                    }
                }
                else {
                    pageData = {
                        alertOccurred: true,
                        alertMessage: "Vous avez ajouté à un projet avec succès!",
                        alertLevel: 'success',
                        alertLevelText: 'success',
                        alertHref: 'exclamation-triangle-fill',
                        display_signup: signupDisplay,
                        display_login: "block",
                        signUpText: "Enregistrer",
                        endpointLogInLogOut: endpoint,
                        clickedNewProject: false,
                        Home: "Accueil",
                        loggedInUser: login,
                        projects_text: "Projets",
                        about_text: "À propos de nous",
                        Current: "French",
                        footerData: footerLangObject(lang),
                        showList: true,
                        tableMessage: "Vous n'avez aucun Projet.",
                        titleName: 'Créer un Projet',
                        pathNameForActionForm: 'projects',
                        projects: await projectModel.getAllProjects(request.cookies.username),
                        Home: "Accueil",
                        logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                        new_project: "Nouveau Projet",
                        your_projects: "Vos Projets",
                        see_more: "Voir plus",
                        last_updated: "Dernière mise à jour il y a 3 minutes"
                    }
                }
        
                response.cookie("lastAccessedProject", projectId);
                // response.status(201).render('home.hbs', pageData);
                response.redirect('/parts');
            }
            catch (error) {
                const pageData = {
                    alertOccurred: true,
                    alertMessage: "",
                    alertLevel: 'danger',
                    alertLevelText: 'Danger',
                    alertHref: 'exclamation-triangle-fill',
                    loggedInUser: login,
                    footerData: footerLangObject(lang)
                }
        
                if (error instanceof sqlModel.DatabaseConnectionError) {
                    pageData.alertMessage = "Error connecting to database.";
                    response.status(500).render('home.hbs', pageData);
                }
                // If the error is an instance of the InvalidInputError error
                else if (error instanceof sqlModel.InvalidInputError) {
                    pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
                    response.status(404).render('home.hbs', pageData);
                }
                // If any other error occurs
                else {
                    pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
                    response.status(500).render('home.hbs', pageData);
                }
            }
        }
        // Redirect to home page since a user shouldn't be viewing the project if not logged in
        else{
            response.redirect('/parts');
        }
}

let theProjectId;

/**
 * Shows the specified project on a new page.
 * @param {*} request 
 * @param {*} response 
 */
async function showSpecificProject(request, response) {
    let projectID = request.params.projectId;
    let theProject = await projectModel.getProjectByProjectId(projectID);
    let allCarPartsInProject = await projectModel.getProjectCarParts(projectID);
    let login = loginController.authenticateUser(request);
    let arrayOFCatPartsInProject = await partsModel.getArrayOfCarPartsInProject(allCarPartsInProject);
    let noPartsFound, name, description;
    let signupDisplay, endpoint, logInText;

    // If no parts were found
    if (arrayOFCatPartsInProject.length === 0) {
        noPartsFound = true;
    }
    else {
        name = theProject[0].name;
        description = theProject[0].description;
    }

    // If the project id is null
    if (projectID != 'null') {
        theProjectId = projectID;
    }

    const lang = request.cookies.language;
    let pageData;

    // Set the login to the username if response is not null
    if(login != null) {
        login = login.userSession.username;
        signupDisplay = "none";
        endpoint = "logout";
        logInText = "Log Out";

        try {

            let projectID = request.params.projectId;
            let theProject = await projectModel.getProjectByProjectId(projectID);
            let allCarPartsInProject = await projectModel.getProjectCarParts(projectID);
            let arrayOFCatPartsInProject = await partsModel.getArrayOfCarPartsInProject(allCarPartsInProject);
            let noPartsFound;
    
            let description = theProject[0].description;
            let theName = theProject[0].name;
    
            if (!lang || lang === 'en') {
                //Page data
                pageData = {
                    alertOccurred: false,
                    display_signup: signupDisplay,
                    display_login: "block",
                    logInlogOutText: logInText,
                    signUpText: "Sign Up",
                    endpointLogInLogOut: endpoint,
                    clickedNewProject: false,
                    Home: "Home",
                    loggedInUser: login,
                    projectName: theName,
                    projectDescription: description,
                    projectId: parseInt(theProjectId),
                    projectParts: arrayOFCatPartsInProject,
                    noParts: arrayOFCatPartsInProject.length === 0,
                    back_button: "Return",
                    edit: "Edit",
                    project_name_label: "Project Name",
                    project_description_label: "Project Description",
                    update_button: "Update Project",
                    noprojects_Available: "No car parts added in this project",
                    click_CreateProj: "Try adding one from the home page!",
                    parts_in_project_label: "Car Parts in Project",
                    partNumberLabel: "Part Number",
                    partConditionLabel: "Condition",
                    about_text: "About Us",
                    projects_text: "Projects",
                    footerData: footerLangObject(lang)
                }
            }
            else {
                pageData = {
                    alertOccurred: false,
                    display_signup: "none",
                    display_login: "block",
                    logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                    signUpText: "Enregistrer",
                    endpointLogInLogOut: endpoint,
                    clickedNewProject: false,
                    Home: "Accueil",
                    loggedInUser: login,
                    projectName: theName,
                    projectDescription: description,
                    projectId: parseInt(theProjectId),
                    projectParts: arrayOFCatPartsInProject,
                    noParts: arrayOFCatPartsInProject.length === 0,
                    back_button: "Retournez",
                    edit: "Modifier",
                    project_name_label: "Nom du Projet",
                    project_description_label: "Description du Projet",
                    update_button: "Mettre à Jour le Projet",
                    noprojects_Available: "Aucune pièce de voiture ajoutée dans ce projet",
                    click_CreateProj: "Essayez d'en ajouter un depuis la page d'accueil!",
                    parts_in_project_label: "Pièces dans le Projet",
                    partNumberLabel: "Numéro de Pièce",
                    partConditionLabel: "Condition",
                    about_text: "À propos de nous",
                    projects_text: "Projets",
                    footerData: footerLangObject(lang)
                }
            }
        
            response.status(201).render('showProject.hbs', pageData);
        } 
        catch (error) {
            pageData = {
                alertOccurred: true,
                alertMessage: "",
                alertLevel: 'danger',
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                loggedInUser: lang,
                errorCode: "",
                alertMessage: "",
                footerData: footerLangObject(lang)
            }

            // If the error is an instance of the DatabaseConnectionError error
            if (error instanceof sqlModel.DatabaseConnectionError) {
                pageData.alertMessage = "There was an error connecting to the database.";
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
            // If the error is an instance of the InvalidInputError error
            else if (error instanceof sqlModel.InvalidInputError) {
                pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
                response.status(404).render('home.hbs', pageData);
            }
            // If any other error occurs
            else {
                pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
        }
    
        // response.status(201).render('showProject.hbs', pageData);
    }
    // Redirect to home page since a user shouldn't be viewing the project if not logged in
    else{
        response.redirect('/parts');
    }
}

/**
 * Updates the project details.
 * @param {*} request 
 * @param {*} response 
 */
async function updateProject(request, response) {
    try {
        // Get the values
        let name = request.body.name;
        let description = request.body.description;
        let projectID = request.params.projectId;
        let login = loginController.authenticateUser(request);
    
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
                footerData: footerLangObject(lang)
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
                Home: "Accueil",
                loggedInUser: login,
                footerData: footerLangObject(lang)
            }
        }
    
        response.cookie("lastAccessedProject", projectID);
        response.redirect(`/projects/${projectID}`);
        response.status(201).render('showProject.hbs', pageData);
    } 
    catch (error) {
        pageData = {
            alertOccurred: true,
            alertMessage: "",
            alertLevel: 'danger',
            alertLevelText: 'Danger',
            alertHref: 'exclamation-triangle-fill',
            loggedInUser: lang,
            errorCode: "",
            alertMessage: "",
            footerData: footerLangObject(lang)
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError) {
            pageData.alertMessage = "There was an error connecting to the database.";
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError) {
            pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
            response.status(404).render('home.hbs', pageData);
        }
        // If any other error occurs
        else {
            pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
            pageData.errorCode = 500;
            response.status(500).render('error.hbs', pageData);
        }
    }
}

async function deleteProject(request, response) {
    // Get the values
    let projectID = request.params.projectId;
    let signupDisplay, endpoint, logInText;
    let login = loginController.authenticateUser(request);
    const lang = request.cookies.language;
    let pageData;

    // Set the login to the username if response is not null
    if(login != null) {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Log Out";

            try {
                await projectModel.deleteProject(projectID);

                if (!lang || lang === 'en') {
                    pageData = {
                        alertOccurred: true,
                        showList: true,
                        tableMessage: "You do not have any Projects.",
                        titleName: 'Create a Project',
                        pathNameForActionForm: 'projects',
                        projects: await projectModel.getAllProjects(request.cookies.username),
                        about_text: "About Us",
                        endpointLogInLogOut: endpoint,
                        projects_text: "Projects",
                        Home: "Home",
                        logInlogOutText: logInText,
                        loggedInUser: login,
                        new_project: "New Project",
                        your_projects: "Your Projects",
                        see_more: "See more",
                        last_updated: "Last updated 3 minutes ago",
                        footerData: footerLangObject(lang),
                        alertMessage: `Successfully deleted project ${projectID}!`,
                        alertLevel: 'success',
                        alertLevelText: 'success',
                        alertHref: 'exclamation-triangle-fill',
                        display_signup: signupDisplay,
                        display_login: "block",
                        signUpText: "Sign Up",
                    }
                }
                else {
                    pageData = {
                        alertOccurred: false,
                        showList: true,
                        tableMessage: "Vous n'avez aucun Projet.",
                        titleName: 'Créer un Projet',
                        pathNameForActionForm: 'projects',
                        projects: await projectModel.getAllProjects(request.cookies.username),
                        Home: "Accueil",
                        logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                        loggedInUser: login,
                        new_project: "Nouveau Projet",
                        your_projects: "Vos Projets",
                        see_more: "Voir plus",
                        last_updated: "Dernière mise à jour il y a 3 minutes",
                        about_text: "À Propos de Nous",
                        endpointLogInLogOut: endpoint,
                        projects_text: "Projets",
                        footerData: footerLangObject(lang),
                        alertOccurred: false,
                // showList: true,
                // tableMessage: "Vous n'avez aucun Projet.",
                // titleName: 'Créer un Projet',
                // pathNameForActionForm: 'projects',
                // projects: await projectModel.getAllProjects(request.cookies.username),
                // Home: "Accueil",
                // logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                // loggedInUser: login,
                // new_project: "Nouveau Projet",
                // your_projects: "Vos Projets",
                // see_more: "Voir plus",
                // last_updated: "Dernière mise à jour il y a 3 minutes",
                // about_text: "À Propos de Nous",
                // endpointLogInLogOut: endpoint,
                // projects_text: "Projets",
                // footerData: footerLangObject(lang)
                    }
                } 

                // response.redirect(`/projects`);
                response.cookie("lastAccessedProject", -1);
                response.status(201).render('allProjects.hbs', pageData);
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
                    alertMessage: "",
                    footerData: footerLangObject(lang)
                }
        
                // If the error is an instance of the DatabaseConnectionError error
                if (error instanceof sqlModel.DatabaseConnectionError) {
                    pageData.alertMessage = "There was an error connecting to the database.";
                    pageData.errorCode = 500;
                    response.status(500).render('error.hbs', pageData);
                }
                // If the error is an instance of the InvalidInputError error
                else if (error instanceof sqlModel.InvalidInputError) {
                    pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
                    response.status(404).render('home.hbs', pageData);
                }
                // If any other error occurs
                else {
                    pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
                    pageData.errorCode = 500;
                    response.status(500).render('error.hbs', pageData);
                }
            }
    }
    // Redirect to home page since a user shouldn't be viewing the project if not logged in
    else{
            response.redirect('/parts');
    }
}

async function deletePartFromProject(request, response) {
     // Get the values
     let projectID = request.params.projectId;
     let partNumber = request.params.partNumber;
     let signupDisplay, endpoint, logInText;
     let login = loginController.authenticateUser(request);
     const lang = request.cookies.language;
     
     // Set the login to the username if response is not null
     if (login != null) {
        try {
            login = login.userSession.username;
            signupDisplay = "none";
            endpoint = "logout";
            logInText = "Log Out";

            await projectModel.deletePartFromProject(projectID, partNumber);

            // Page data 
            const pageData = {
                alertOccurred: true,
                alertMessage: `Successfully deleted project ${projectID}!`,
                alertLevel: 'success',
                alertLevelText: 'success',
                alertHref: 'exclamation-triangle-fill',
                display_signup: signupDisplay,
                display_login: "block",
                logInlogOutText: logInText,
                signUpText: "Sign Up",
                endpointLogInLogOut: endpoint,
                clickedNewProject: false,
                Home: "Home",
                loggedInUser: login,
                footerData: footerLangObject(lang)
            }

            response.cookie("lastAccessedProject", projectID);
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
                loggedInUser: lang,
                errorCode: "",
                alertMessage: "",
                footerData: footerLangObject(lang)
            }

            // If the error is an instance of the DatabaseConnectionError error
            if (error instanceof sqlModel.DatabaseConnectionError) {
                pageData.alertMessage = "There was an error connecting to the database.";
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
            // If the error is an instance of the InvalidInputError error
            else if (error instanceof sqlModel.InvalidInputError) {
                pageData.alertMessage = "Invalid input, check that all fields are alpha numeric where applicable.";
                response.status(404).render('home.hbs', pageData);
            }
            // If any other error occurs
            else {
                pageData.alertMessage = `Unexpected error while trying to adding part: ${error.message}`;
                pageData.errorCode = 500;
                response.status(500).render('error.hbs', pageData);
            }
        }
    }
    else{
        response.redirect('/parts');
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