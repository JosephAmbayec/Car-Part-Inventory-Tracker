'use strict';

const mysql = require('mysql2/promise');
const validUtils = require('../validateUtils.js');
const userUtils = require('../userUtils.js');
const logger = require('../logger');
//const { DatabaseConnectionError } = require('./carPartModelMysql.js'); // Was creating circular dependency
var connection;

// docker run -p 10000:3306 --name carPartSqlDb -e MYSQL_ROOT_PASSWORD=pass -e MYSQL_DATABASE=carPart_db -d mysql:5.7

//#region Initializing

/**
 * Initializes a connection to database for user model.
 * @param {*} dbname The database name.
 * @param {*} reset True if resetting the tables; otherwise false.
 * @returns The connection to the database.
 */
async function initializeUserModel(dbname, reset){

    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            port: '10000',
            password: 'pass',
            database: dbname
        })
    
        // Dropping the tables if resetting them
        if (reset) {
            await resetTables(connection);
        }
        
        await createTables(connection);
        return connection;
    
    } catch (err) {
        logger.error(err);
        throw new DatabaseConnectionError();
    }
}
async function resetTables(connection){
    resetTable("PartProject");
    resetTable("UsersProject");
    resetTable("Project");
    // Dropping the Users table
    resetTable("Users");
    // let dropQuery = "DROP TABLE IF EXISTS Users";
    // await connection.execute(dropQuery);
    // logger.info("Users table dropped");
    // .then(console.log("User table dropped")).catch((error) => { console.error(error) });

    // Dropping the Roles table
    resetTable("Roles");
}

async function createTables(connection){
    const createRoleStatement = `CREATE TABLE IF NOT EXISTS Roles(roleID int, rolename VARCHAR(50), PRIMARY KEY (roleID))`;
    await connection.execute(createRoleStatement);
    logger.info("Roles table created/exists");
    // .then(logger.info("Role table created/exists")).catch((error) => { logger.error(error) });

    // Ignoring invalid data into Roles table
    let insertDefaultRoles = 'INSERT IGNORE INTO Roles(roleID, rolename) values (1, "admin");';
    await connection.execute(insertDefaultRoles);
    logger.info("Roles table created/exists");
    // .then(logger.info("Role table created/exists")).catch((error) => { logger.error(error) });

    // Ignoring invalid data into Roles table
    insertDefaultRoles = 'INSERT IGNORE INTO Roles(roleID, rolename) values (2, "guest");';
    await connection.execute(insertDefaultRoles);
    logger.info("Roles table created/exists");
    // .then(logger.info("Role table created/exists")).catch((error) => { logger.error(error) });

    // Creating the Users table
    let createTableStatement = `CREATE TABLE IF NOT EXISTS Users(id int AUTO_INCREMENT, username VARCHAR(15), password varchar(128), roleID int, PRIMARY KEY (id), FOREIGN KEY (roleID) REFERENCES Roles(roleID))`;
    await connection.execute(createTableStatement);
    logger.info("Users table created/exists");
}
//#endregion


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
 * Drops the specified table from the database.
 * @param {*} tableName The name of the table to be dropped.
 */
 async function resetTable(tableName){
    try {
        const dropQuery = `DROP TABLE IF EXISTS ${tableName}`;
        await connection.execute(dropQuery);
        logger.info(`${tableName} table dropped`);

    } catch (error) {
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

//#endregion
async function getUserByName(username){
    if (username == undefined || username == null || username.length == 0)
        return -1;
    let query = `SELECT id from Users where username = '${username}'`;
    let result = await connection.query(query);
    return result[0][0].id;
}
/**
 * Adds a user to the database with the given username and password.
 * @param {string} username The username of the user.
 * @param {string} password The password of the user.
 */
async function addUser(username, password) {

    // Checks if the user already exists in the database
    if (await userExists(username)){
        logger.error("User NOT ADDED due to already existing in database");
        throw new UserLoginError("Username already exists.");
    }
    // Checks for valid username
    if (userUtils.isValidUsername(username)) {

        // Checks for valid password
        if (userUtils.isValidPassword(password)){
            try {
                let hashedPassword = await userUtils.hashPassword(password);
                let insertQuery = `INSERT INTO Users(username, password, roleID) values ('${username}', '${hashedPassword}', '2');`

                await connection.execute(insertQuery);
                logger.info("User added successfully to the database");
            }
            catch (err) {
                logger.error(err)
                throw new DatabaseConnectionError();
            }
        }
        // Invalid password
        else{
            logger.error("User NOT ADDED due to invalid password");
            throw new UserLoginError("Password must be 8 or more characters and include an uppercase character, lowercase character, number and symbol.");
        }
    }
    // Invalid username
    else{
        logger.error("User NOT ADDED due to invalid username");
        throw new UserLoginError("Username must be between 6 and 15 characters");
    }
}

/**
 * Gets a list of all the users in the database.
 * @returns A list of all the users in the database.
 */
async function showAllUsers(){
    try {
        const queryStatement = "SELECT username, rolename FROM Users INNER JOIN Roles ON Users.roleID = Roles.roleID;";
        let userArray = await connection.query(queryStatement);
        logger.info("Successfully retrieved all users from the database");
        
        return userArray[0];
    }
    catch(error){
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

/**
 * Gets the role id of the given user. 
 * @param {string} username The username of the user.
 * @returns The role id of the user. 
 */
async function getRole(username){
    // First checks if the user actually exists in the database
    if (await userExists(username)){
        const queryStatement = `SELECT Users.roleID FROM Users INNER JOIN Roles on Users.roleID = Roles.roleID where username = '${username}'`;
        let result = await connection.query(queryStatement);
        let toReturn = result[0];

        logger.info(`Successfully retrieved the role id of the user (${username})`);

        return toReturn[0].roleID;
    }
    else{
        logger.warn(`User doesn't exist - 'Failed to retrieve the role id of the user (${username}) -- getRole`);
        // todo
    }
}


//#region Validating

/**
 * Checks if the specified user already exists as a user in the database.
 * @param {*} username The username of the user.
 * @returns True if the user already exists in the database; otherwise false.
 */
 async function userExists(username){
    try {
        const findUser = `SELECT username FROM Users where username = '${username}'`;
        const [rows, fields] = await connection.query(findUser);

        if (rows.length != 0){
            logger.info(`User ${username} EXISTS in the database`);  
            return true;
        }
        else{
            logger.info(`User ${username} DOES NOT EXIST in the database`);   
            return false;
        }
    }
    catch (err){
        logger.error(err)
        throw new DatabaseConnectionError();
    }
}

// ******************************************

/**
 * Calls a method in utils that compares the plain password to the hashed password
 * @param {string} username 
 * @param {string} password 
 * @returns true if login information is valid, false otherwise.
 */

async function validateLogin(username, password){
    // First checks if the user actually exists in the database
    if (await userExists(username)){
        const queryStatement = `SELECT password FROM Users where username = '${username}'`;
        let result = await connection.query(queryStatement);
        return userUtils.validateLogin(password, result[0]);
    }
    else{
        // show message about username not found
        logger.warn(`User doesn't exist - Failed to validate user (${username}) input -- validateLogin`);
        return false;
    }
}

//#endregion

//#region Errors

/**
 * Error representing a user login error.
 */
class UserLoginError extends Error {}

//#endregion

module.exports = {
    UserLoginError,
    userExists,
    initializeUserModel,
    getConnection,
    addUser,
    showAllUsers,
    validateLogin,
    getRole,
    getUserByName,
    createTables,
    resetTables
}