'use strict';

const mysql = require('mysql2/promise');
const validUtils = require('../validateUtils.js');
const logger = require('../logger');
const userModel = require('../models/userModel');
var connection;

// docker run -p 10000:3306 --name carPartSqlDb -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=carPart_db -d mysql:5.7

//#region Initializing

/**
 * Initializes a connection to database for car part model.
 * @param {*} dbname The database name.
 * @param {*} reset True if resetting the tables; otherwise false.
 * @returns The connection to the database.
 */
async function initialize(dbname, reset){

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: '10000',
            password: 'pass',
            database: dbname
        })
    
        // Dropping the tables if resetting them
        if (reset){
            resetTable("PartProject");
            resetTable("UsersProject");
            resetTable("Project");
            resetTable("carPart");
        }

        // Creating the carPart table
        let createTableStatement = 'CREATE TABLE IF NOT EXISTS carPart(partNumber int, name VARCHAR(100), `condition` VARCHAR(50), image VARCHAR(2000), PRIMARY KEY (partNumber))';
        await connection.execute(createTableStatement);
        logger.info("Car part table created/exists");

        return connection
    }
    catch (error){
        logger.error(error.message);
        throw new DatabaseConnectionError();
    }
}

//#endregion

//#region Connection

/**
 * Gets the connection to the database.
 * @returns The connection to the database.
 */
async function getConnection(){
    return connection;
}

//#endregion

//#region Reset table

/**
 * Drops the carPart table from the database.
 */
async function resetTable(table){
    try {
        const dropQuery = `DROP TABLE IF EXISTS ${table}`;
        await connection.execute(dropQuery);
        logger.info("Car part table dropped");
        // .then(logger.info("Car part table dropped")).catch((error) => { logger.error(error) });

    } catch (error) {
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

//#endregion

//#region Project operations


//#endregion

//#region CRUD operations

/**
 * Adds a car part to the database with the given part information.
 * @param {*} partNumber The part number of the car part.
 * @param {*} name The name of the car part.
 * @param {*} condition The condition of the car part.
 * @param {*} image The image of the car part.
 * @returns Object representing the added car part.
 */
async function addCarPart(partNumber, name, condition, image){ 
    // Validates the name and partNumber of the car part
    if (!validUtils.isValid(name) || !validUtils.isPartNumber(partNumber)) {
        logger.error("Name or partNumber of car part to be added is not valid -- addCarPart");
        throw new InvalidInputError();
    }

    try {
        const addStatement = 'INSERT INTO carPart(partNumber, name, `condition`' + `, image) values ('${partNumber}', '${name}', '${condition}', '${image}');`;
        await connection.execute(addStatement);
        logger.info(`ADDED car part (${partNumber}) to the database.`);

        return { "partNumber": partNumber, "name": name, "condition": condition, "image": image };           
    }
    catch(error){
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

/**
 * Finds the car part in the database matching the given part number.
 * @param {*} partNumber The part number to search for.
 * @returns The found car part in the database.
 */
async function findCarPartByNumber(partNumber){
    // Validates the partNumber of the car part
    if (!validUtils.isPartNumber(partNumber)){
        logger.error("PartNumber of car part to find is not valid -- findCarPartByNumber");
        throw new InvalidInputError();
    }

    try {
        const queryStatement = `SELECT * FROM carPart WHERE partNumber= '${partNumber}';`;
        let carPartArray = await connection.execute(queryStatement);
        logger.info(`FOUND the car part (${partNumber}) in the database.`);

        return carPartArray[0];
    }
    catch(error){
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

/**
 * Gets all the car parts in the database.
 * @returns Array of all the car parts in the database.
 */
async function findAllCarParts(){
    try {
        const queryStatement = "SELECT partNumber, name, `condition` , image FROM carPart;";
        let carPartArray = await connection.query(queryStatement);
        logger.info("FOUND ALL the car parts in the database.");

        return carPartArray[0];
    }
    catch(error){
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

/**
 * Updates the car part in the database with the given part number and part name. 
 * @param {integer} partNumber The part number of the car part.
 * @param {double} name The name of the car part.
 * @returns Object representing the updated car part.
 */
async function updateCarPartName(partNumber, name){
    // Validates the name and partNumber of the car part
    if (!validUtils.isValid(name) || !validUtils.isPartNumber(partNumber)) {
        logger.error("Name or partNumber of car part to be updated is not valid -- updateCarPartName");
        throw new InvalidInputError();
    }
    
    try {
        const addStatement = `UPDATE carPart SET name = '${name}' WHERE partNumber = ${partNumber};`;
        await connection.query(addStatement);
        logger.info(`UPDATED the car part (${partNumber}) in the database.`);

        return { "partNumber": partNumber, "name": name };
    }
    catch(error){
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

/**
 * Deletes the car part in the database matching the specified part number.
 * @param {*} partNumber The part number of the car part.
 * @returns Object representing the deleted car part.
 */
 async function deleteCarPart(partNumber){
    // Validates the partNumber of the car part
    if (!validUtils.isPartNumber(partNumber)){
        logger.error("PartNumber of car part to be deleted is not valid -- deleteCarPart");
        throw new InvalidInputError();
    }

    try {
        // Delete from any project first
        let tableExists = await connection.query("SHOW TABLES LIKE 'PartProject'")
        if (tableExists[0].length != 0){
            let sqlStatement = `DELETE FROM PartProject WHERE partNumber = ${partNumber};`;
            await connection.execute(sqlStatement);
        }

        // Delete from part table
        let sqlStatement = `DELETE FROM carPart where partNumber = ${partNumber};`;
        await connection.execute(sqlStatement);

        logger.info(`DELETED the car part (${partNumber}) from the database.`);

        return {"partNumber": partNumber }
    }
    catch(error){
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

//#endregion

//#region Validating

/**
 * Verifies that the car part matching the specified part number exists in the database.
 * @param {*} partNumber The part number of the car part.
 * @returns 
 */
 async function verifyCarPartExists(partNumber){
    // Validates the partNumber of the car part
    if (!validUtils.isPartNumber(partNumber)){
        logger.error("PartNumber of car part to verify if exists is not valid -- verifyCarPartExists");
        throw new InvalidInputError();
    }

    try {
        const carPart = await findCarPartByNumber(partNumber);

        // Checks if the array length of the found car part is not 0
        if(carPart.length != 0){
            logger.info("Car part EXISTS - Verify that the car part exists -- verifyCarPartExists");
            return true;
        }
    }
    catch(error){
        logger.error(error);
        throw new DatabaseConnectionError();
    }

    logger.info("Car part DOES NOT EXISTS - Verify that the car part exists -- verifyCarPartExists");
    return false;
}

/**
 * Checks that the connection to the database is open.
 * @param {*} res 
 * @returns True if the connection is open; otherwise false.
 */
function checkConnection(res){
    // Checking if the connection is closed
    if (connection.connection._closing){
        res.status(500);
        logger.info("NOT OPEN - Connection to the database -- checkConnection");
        return false;
    }

    logger.info("OPEN - Connection to the database -- checkConnection");
    return true;
}

//#endregion


async function getArrayOfCarPartsInProject(allCarPartsInProject){
    var arrayOfCarParts = [];

    for (let i = 0; i < allCarPartsInProject.length; i++) {
        try {
            let getCurrentCarPart = await findCarPartByNumber(allCarPartsInProject[i].partNumber);
            
            if(getCurrentCarPart){
                // const currentCarPartObject = {
                //     partNumber: getCurrentCarPart[0].partNumber,
                //     name: getCurrentCarPart[0].name,
                //     condition: getCurrentCarPart[0].condition,
                //     image: getCurrentCarPart[0].image
                // }
                
                arrayOfCarParts.push(getCurrentCarPart[0]);
            }
            else
                throw new DatabaseConnectionError();
        } 
        catch (error) {
            logger.error(error);
            throw new DatabaseConnectionError();
        }
    }

    return arrayOfCarParts;
}

//#region Errors

/**
 * Error representing a databases connection error.
 */
class DatabaseConnectionError extends Error {}
/**
 * Error representing an invalid input error.
 */
class InvalidInputError extends Error {} 

//#endregion


module.exports = {
    initialize,
    getConnection,
    addCarPart,
    findCarPartByNumber,
    updateCarPartName,
    deleteCarPart,
    findAllCarParts,
    verifyCarPartExists,
    checkConnection,
    DatabaseConnectionError,
    InvalidInputError,
    getArrayOfCarPartsInProject
}