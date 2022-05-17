'use strict';

const express = require('express');
const { DatabaseConnectionError } = require('../models/carPartModelMysql');
const router = express.Router();
const routeRoot = '/';
const userModel = require('../models/userModel');
const logger = require('../logger');

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
                Home: "Retournez",
            }
        }

        
        logger.info(`DID NOT CREATE user ${username} because of passwords NOT matching -- createUser`);
        response.status(404).render('loginsignup.hbs', errorData);
    }
    // If both passwords match
    else{
        try {
            await userModel.addUser(username, password);

            // Save cookie that will expire.
            response.cookie("username", username);
            logger.info(`CREATED cookie username ${username} -- createUser`);

            response.cookie("justRegistered", "true");
            logger.info(`JUST REGISTERED user ${username} -- createUser`);
                // .redirect('/')// Need cookie or session to pass this message to /

            logger.info(`CREATED user ${username} in database -- createUser`);

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
                    logInlogOutText: "Déconnecter",
                    endpointLogInLogOut: "login",
                    loggedInUser: username,
                    Home: "Home",
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
                    Home: "Retournez",
                } 
            }


            // If the error is an instance of the DatabaseConnectionError error
            if (error instanceof DatabaseConnectionError){
                errorData.alertMessage = "Error while connecting to database.";
                logger.error(`DatabaseConnectionError when CREATING user ${username} -- createUser`);
                response.status(500).render('users.hbs', {alertMessage: "Error while connecting to database."});
            }
            // If the error is an instance of the UserLoginError error
            else if (error instanceof userModel.UserLoginError){
                errorData.alertMessage = error.message;
                logger.error(`UserLoginError when CREATING user ${username} -- createUser`);
                response.status(404).render('loginsignup.hbs', errorData);
            }
            // If any other error occurs
            else {
                logger.error(`OTHER error when CREATING user ${username} -- createUser`);
                response.status(500).render('error.hbs', {message: `Unexpected error while trying to register user: ${error.message}`});
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
                    logger.info(`NOT RETRIEVED all users in database -- showUsers`);
                    response.status(404).render('users.hbs', {alertMessage: "No results"});
                }
                else{
                    let output = {users};
                    logger.info(`RETRIEVED all users in database -- showUsers`);
                    response.status(200).render('users.hbs', output)
                }  
            })
    }
    catch (error){

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof DatabaseConnectionError){
            errorData.alertMessage = "Error while connecting to database.";
            logger.error(`DatabaseConnectionError when RETRIEVING all users -- showUsers`);
            response.status(500).render('users.hbs', {alertMessage: "Error while connecting to database."});
        }
        // If any other error occurs
        else {
            logger.error(`OTHER error when RETRIEVING all users -- showUsers`);
            response.status(500).render('error.hbs', {message: `Unexpected error while trying to register user: ${error.message}`});
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
            Home: "Retournez",
        }
    }


    logger.info(`SHOWING SIGNUP information (signup page) -- showSignup`);
    response.status(201).render('loginsignup.hbs', pageData);
}

router.get('/users', showUsers);
router.get('/users/signup', showSignup)
router.post("/users/signup", createUser)


module.exports = {
    router,
    routeRoot
}