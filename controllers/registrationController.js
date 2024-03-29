'use strict';

const express = require('express');
const { DatabaseConnectionError } = require('../models/carPartModelMysql');
const router = express.Router();
const routeRoot = '/';
const userModel = require('../models/userModel');
const homeController = require('../controllers/homeController');
const loginController = require('./loginController');

/**
 * POST method that allows the creation of a user
 * @param {*} request 
 * @param {*} response 
 */
async function createUser(request, response){
    // Getting the values
    let username = request.body.username;
    let password = request.body.password;
    let confirmPassword = request.body.confirmPassword;
    const lang = request.cookies.language;
    let errorData;

    let signupDisplay, endpoint, logInText;
    let login = loginController.authenticateUser(request);

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

    // Making sure the password and confirmed password match
    if (password != confirmPassword){
        // Error data for when an error occurs
        if (!lang || lang === 'en') {
            errorData = {
                alertOccurred: true,
                alertMessage: "The passwords you have entered are not the same.",
                alertLevel: 'danger',
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Sign Up',
                pathNameForActionForm: 'signup',
                showConfirmPassword: true,
                oppositeFormAction: 'login',
                oppositeFormName: 'Log in',
                dontHaveAccountText: "Already have an account?",
                Home: "Home",
                footerData: footerLangObject(lang)
            }
        }
        else{
            errorData = {
                alertOccurred: true,
                alertMessage: "Les mots de passe que vous avez entré ne sont pas les mêmes.",
                alertLevel: 'danger',
                alertLevelText: 'Danger',
                alertHref: 'exclamation-triangle-fill',
                titleName: 'Enregistrer',
                pathNameForActionForm: 'signup',
                showConfirmPassword: true,
                oppositeFormAction: 'login',
                oppositeFormName: 'Connexion',
                dontHaveAccountText: "Vous avez déjà un compte?",
                footerData: footerLangObject(lang),
                endpointLogInLogOut: endpoint,
                    logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                    loggedInUser: login,
                    projects_text: "Projets",
                    about_text: "À Propos de Nous",
                    Home : "Accueil",
                    Current: "French",
                    signUpText: "Enregistrer",
            }
        }

        
        response.status(404).render('loginsignup.hbs', errorData);
    }
    // If both passwords match
    else{
        try {
            let role;

            // Admins are only the creators of the website
            if(username === 'Braeden' || username === 'Jayden' || username === 'Joseph'){
                role = 1;
            }
            // If it's a guest on the website
            else{
                role = 2;
            }

            await userModel.addUser(username, password, role);

            // Save cookie that will expire.
            response.cookie("username", username);

            response.cookie("justRegistered", "true");
                // .redirect('/')// Need cookie or session to pass this message to /


            let pageData;

            if (!lang || lang === 'en'){
                pageData = {
                    alertOccurred: true,
                    alertMessage: `Congrats ${username} you have been registered!`,
                    alertLevel: 'success',
                    alertLevelText: 'Success',
                    alertHref: 'check-circle-fill',
                    display_signup: "none",
                    display_login: "block",
                    logInlogOutText: "Log Out",
                    endpointLogInLogOut: "login",
                    loggedInUser: username,
                    Home: "Home",
                    Add: "Add a Car part",
                    Show: "Find a Car Part",
                    List: "Show all Car Parts",
                    Edit: "Update a Car Part",
                    Delete: "Delete a Car Part",
                    projects_text: "Projects",
                    about_text: "About Us",
                    Current: "English",
                    footerData: footerLangObject(lang)
                }
            }
            else{
                pageData = {
                    alertOccurred: true,
                    alertMessage: `Félicitations ${username} vous avez été enregistré!`,
                    alertLevel: 'success',
                    alertLevelText: 'Success',
                    alertHref: 'check-circle-fill',
                    display_signup: "none",
                    display_login: "block",
                    endpointLogInLogOut: "login",
                    Home: "Accueil",
                    Add: "Ajouter une Pièce Auto",
                    Show: "Trouver une Pièce Auto",
                    List: "Afficher Toutes les Pièces de Voiture",
                    Edit: "Mettre à Jour une Pièce Auto",
                    Delete: "Supprimer une Pièce Auto",
                    Current: "French",
                    footerData: footerLangObject(lang),
                    endpointLogInLogOut: endpoint,
                    logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                    loggedInUser: login,
                    signUpText: "Enregistrer",
                    about_text: "À propos de nous",
                }
            }


            // Render the home page
            response.status(201).render('home.hbs', pageData) // Need cookie or session to pass this message to /

        } catch(error) {

            // Error data for when an error occurs
            let errorData;
            
            if (!lang || lang === 'en'){
                errorData = {
                    alertOccurred: true,
                    alertMessage: "",
                    alertLevel: 'danger',
                    alertLevelText: 'Danger',
                    alertHref: 'exclamation-triangle-fill',
                    titleName: 'Sign Up',
                    pathNameForActionForm: 'signup',
                    showConfirmPassword: true,
                    oppositeFormAction: 'login',
                    oppositeFormName: 'Log in',
                    dontHaveAccountText: "Already have an account?",
                    usernameHeader: "Username",
                    passwordHeader: "Password",
                    confirmPasswordHeader: "Confirm Password",
                    Home: "Home",
                    alertMessage: "",
                    errorCode: "",
                    footerData: footerLangObject(lang)
                }
            }
            else{
                errorData = {
                    alertOccurred: true,
                    alertMessage: "",
                    alertLevel: 'danger',
                    alertLevelText: 'Danger',
                    alertHref: 'exclamation-triangle-fill',
                    titleName: 'Enregistrer',
                    pathNameForActionForm: 'signup',
                    showConfirmPassword: true,
                    oppositeFormAction: 'login',
                    oppositeFormName: 'Connexion',
                    dontHaveAccountText: "Vous avez déjà un compte?",
                    usernameHeader: "Nom D'utilisateur",
                    passwordHeader: "Mot de Passe",
                    confirmPasswordHeader: "Confirmez le Mot de Passe",
                    alertMessage: "",
                    errorCode: "",
                    Home: "Accueil",
                    Current: "French",
                    footerData: footerLangObject(lang),
                    endpointLogInLogOut: endpoint,
                    logInlogOutText: logInText === "Log In" ? "Connexion" : logInText === "Log Out" ? "Déconnecter" : "",
                    loggedInUser: login,
                    signUpText: "Enregistrer",
                    about_text: "À propos de nous",
                } 
            }

            // If the error is an instance of the DatabaseConnectionError error
            if (error instanceof DatabaseConnectionError){
                errorData.alertMessage = "There was an error connecting to the database.";
                errorData.errorCode = 500;
                response.status(500).render('error.hbs', errorData);
            }
            // If the error is an instance of the UserLoginError error
            else if (error instanceof userModel.UserLoginError){
                errorData.alertMessage = error.message;
                response.status(404).render('loginsignup.hbs', errorData);
            }
            // If any other error occurs
            else {
                errorData.alertMessage = `Unexpected error while trying to register user: ${error.message}`;
                errorData.errorCode = 500;
                response.status(500).render('error.hbs', errorData);
            }
        }
    }
}

/**
 * GET method that lists all users in the database
 * @param {*} request 
 * @param {*} response 
 */
 async function showUsers(request, response){
    try {
        await userModel.showAllUsers()
            .then(users => {
                if (users.length == 0){
                    response.status(404).render('users.hbs', {alertMessage: "No results"});
                }
                else{
                    let output = {users};
                    response.status(200).render('users.hbs', output)
                }  
            })
    }
    catch (error){

        const data = {
            alertMessage: "",
            errorCode: ""
        }

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof DatabaseConnectionError){
            errorData.alertMessage = "There was an error connecting to the database.";
            errorData.errorCode = 500;
            response.status(500).render('error.hbs', data);
        }
        // If any other error occurs
        else {
            errorData.alertMessage = `Unexpected error while trying to register user: ${error.message}`;
            errorData.errorCode = 500;
            response.status(500).render('error.hbs', data);
        }
    }
}

/**
 * Renders the signup page with the given data. 
 * @param {*} request 
 * @param {*} response 
 */
async function showSignup(request, response){
    const lang = request.cookies.language;
    let pageData;
    // Page data 
    
    if (!lang || lang === 'en'){
        pageData = {
            alertOccurred: false,
            titleName: 'Sign Up',
            pathNameForActionForm: 'signup',
            showConfirmPassword: true,
            oppositeFormAction: 'login',
            oppositeFormName: 'Log in',
            dontHaveAccountText: "Already have an account?",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Log In",
            signUpText: "Sign Up",
            endpointLogInLogOut: "login",
            usernameHeader: "Username",
            passwordHeader: "Password",
            confirmPasswordHeader: "Confirm Password",
            Home: "Home",
            about_text: "About Us",
            footerData: footerLangObject(lang)
        }
    }
    else{
        pageData = {
            alertOccurred: false,
            titleName: 'Enregistrer',
            pathNameForActionForm: 'signup',
            showConfirmPassword: true,
            oppositeFormAction: 'login',
            oppositeFormName: 'Connexion',
            dontHaveAccountText: "Vous avez déjà un compte?",
            display_signup: "block",
            display_login: "block",
            logInlogOutText: "Connexion",
            signUpText: "Enregistrer",
            endpointLogInLogOut: "login",
            usernameHeader: "Nom D'utilisateur",
            passwordHeader: "Mot de Passe",
            confirmPasswordHeader: "Confirmez le Mot de Passe",
            Home: "Accueil",
            about_text: "À propos de nous",
            footerData: footerLangObject(lang)
        }
    }

    response.status(201).render('loginsignup.hbs', pageData);
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


router.get('/users', showUsers);
router.get('/users/signup', showSignup)
router.post("/users/signup", createUser)


module.exports = {
    router,
    routeRoot
}