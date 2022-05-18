'use strict';

const express = require('express');
const router = express.Router();
const routeRoot = '/';
const sqlModel = require('../models/carPartModelMysql.js');
const validUtils = require('../validateUtils.js');
const logger = require('../logger');
const projectModel = require('../models/projectModel');
const loginController = require('./loginController');

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
    let condition = request.body.condition;

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

        response.status(201).render('home.hbs', {message: `Created part: Part #${number}, ${partName}, Condition: ${condition}`});

    } catch(error) {

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            logger.error("DatabaseConnectionError when CREATING part -- createPart");
            response.status(500).render('error.hbs', {message: "Error connecting to database."});
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error("InvalidInputError when CREATING part -- createPart");
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable. Ensure the url is a valid image url"});
        }
        // If any other error
        else {
            logger.error("OTHER error when CREATING part -- createPart");
            response.status(500).render('error.hbs', {message: `Unexpected error while trying to add part: ${error.message}`});
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

        // If no part was found
        if (part.length == 0){
            logger.info(`DID NOT FIND car part by number ${number} -- getPartByNumber`);
            response.status(404).render('home.hbs', {message: `Could not find any parts with part number \'${number}\'`});
        }
        // If the part was found
        else{
            let output = {part, showList: true};
            logger.info(`FOUND car part by number ${number} -- getPartByNumber`);
            response.status(200).render('home.hbs', output);
        }
    }
    catch(error){

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            logger.error(`DatabaseConnectionError when FINDING car part by number ${number} -- getPartByNumber`);
            response.status(500).render('home.hbs', {message: "Error connecting to database."});
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error(`InvalidInputError when FINDING car part by number ${number} -- getPartByNumber`);
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            logger.error(`OTHER error when FINDING car part by number ${number} -- getPartByNumber`);
            response.status(500).render('error.hbs', {message: `Unexpected error while trying to show part: ${error.message}`});
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

        // If no car parts were found
        if (parts.length === 0){

            let output = {
                showList: true,
                noCarParts: true,
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Log Out",
                signUpText: "Sign Up",
                endpointLogInLogOut: "login",
                Home: "Home",
                Add: "Add a car part",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: "Update a Car Part",
                Delete: "Delete a Car Part",
                Current: "English",
            }

            logger.info(`NOT RETRIEVED all car parts from database -- getAllCarParts`);
            response.status(201).render('home.hbs', output);
        }
        // If car parts were found
        else{

            const authenticatedSession = loginController.authenticateUser(request);
            let projs;
            let isUserLoggedIn;

            if(authenticatedSession && authenticatedSession != null){
                projs = await projectModel.getAllProjects(authenticatedSession.userSession.username);
                isUserLoggedIn = true;
            }

            // Deleting the car part images with no image
            for (let i = 0; i < parts.length; i++){
                if (parts[i].image == 'null' || parts[i].image == null || parts[i.image == '']){
                    delete parts[i].image;
                }
            }

            let output = {
                part: parts, 
                showList: true,
                display_signup: "none",
                display_login: "block",
                logInlogOutText: "Log Out",
                signUpText: "Sign Up",
                endpointLogInLogOut: "login",
                Home: "Home",
                Add: "Add a car part",
                Show: "Find a Car Part",
                List: "Show all Car Parts",
                Edit: "Update a Car Part",
                Delete: "Delete a Car Part",
                Current: "English",
                project: projs,
                isUserLoggedIn: isUserLoggedIn
            };

            logger.info(`RETRIEVED ALL car parts from database -- getAllCarParts`);
            response.status(200).render('home.hbs', output)
        }  
    }
    catch(error){

        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            logger.error("DatabaseConnectionError when RETRIEVING all car parts -- getAllCarParts");
            response.status(500).render('home.hbs', {message: "Error connecting to database."});
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error("InvalidInputError when RETRIEVING all car parts -- getAllCarParts");
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            logger.error("OTHER error when RETRIEVING all car parts -- getAllCarParts");
            response.status(500).render('error.hbs', {message: `Unexpected error while trying to show part: ${error.message}`});
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
            logger.error(`DatabaseConnectionError when UPDATING car part ${partNumber} -- updatePartName`);
            response.status(500).render('home.hbs', {message: "Error connecting to database."});
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error(`InvalidInputError when UPDATING car part ${partNumber} -- updatePartName`);
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            logger.error(`OTHER error when UPDATING car part ${partNumber} -- updatePartName`);
            response.status(500).render('error.hbs', {message: `Unexpected error while trying to show part: ${error.message}`});
        }
    }   
}
/**
 * DELETE controller method that allows the user to delete a specific part given it's part number
 * @param {*} request 
 * @param {*} response 
 */
async function deletePart(request, response){
    // Getting the values
    let partNumber = request.params.partNumber;

    try {

        // If the car part exists
        if (await sqlModel.verifyCarPartExists(partNumber)){
            await sqlModel.deleteCarPart(partNumber)
                .then(part => {
                    logger.info(`DELETING car part ${partNumber} because car part DOESN'T exist -- deletePart`);
                    response.status(202).render('home.hbs', {message: `Deleted part with part number ${part.partNumber}`});
                })
        }
        // If the car part doesn't exists
        else{
            logger.info(`NOT DELETING car part ${partNumber} in database -- deletePart`);
            response.status(404).render('home.hbs', {message:`Could not find part #${partNumber}`});
        }
    }
    catch (error){
        
        // If the error is an instance of the DatabaseConnectionError error
        if (error instanceof sqlModel.DatabaseConnectionError){
            logger.error(`DatabaseConnectionError when DELETING car part ${partNumber} -- deletePart`);
            response.status(500).render('home.hbs', {message: "Error connecting to database."});
        }
        // If the error is an instance of the InvalidInputError error
        else if (error instanceof sqlModel.InvalidInputError){
            logger.error(`InvalidInputError when DELETING car part ${partNumber} -- deletePart`);
            response.status(404).render('home.hbs', {message: "Invalid input, check that all fields are alpha numeric where applicable."});
        }
        // If any other error
        else {
            logger.error(`OTHER error when DELETING car part ${partNumber} -- deletePart`);
            response.status(500).render('error.hbs', {message: `Unexpected error while trying to show part: ${error.message}`});
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
        
    }
}

router.post("/parts", createPart)
router.get("/parts/:partNumber", getPartByNumber)
router.get("/parts", getAllCarParts)
router.put("/parts/:partNumber", updatePartName)
router.delete("/parts/:partNumber", deletePart)
router.get("/", getAllCarParts)
router.get("/parts/addto/:projectId", addCarPartToProject);


module.exports = {
    router,
    routeRoot
}