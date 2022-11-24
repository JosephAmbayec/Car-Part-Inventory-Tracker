'use strict';

const {Client} = require('pg');
const validUtils = require('../validateUtils.js');
const model = require('../models/carPartModelMysql');
const userModel = require('../models/userModel');
const partModel = require('../models/carPartModelMysql');
var connection;

/**
 * Initializes a connection to database for user model.
 * @param {*} dbname The database name.
 * @param {*} reset True if resetting the tables; otherwise false.
 * @returns The connection to the database.
 */
async function initializeProjectModel(dbname, reset){

    try {
        if (process.env.DATABASE_URL) {
            connection = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: {
                    rejectUnauthorized: false
                }
            })
        } else {
            connection = new Client({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                port: process.env.DB_PORT || '10000',
                password: process.env.DB_PASSWORD || 'pass',
                database: dbname // assumes this was passed in as a parameter to initialize function
            });
        }
        
        connection.connect();
         // Dropping the tables if resetting them
        if (reset) {
            await resetTable("PartProject");
            await resetTable("UsersProject");
            await resetTable("Project");
        }

        // Creating the Users table
        let createTableStatement = `CREATE TABLE IF NOT EXISTS Users(id SERIAL, username VARCHAR(15), password varchar(128), roleID int, PRIMARY KEY (id), FOREIGN KEY (roleID) REFERENCES Roles(roleID))`;
        connection.query(createTableStatement);

        // Creating the car part table
        createTableStatement = 'CREATE TABLE IF NOT EXISTS carPart(partNumber int, name VARCHAR(100), condition VARCHAR(50), image VARCHAR(2000), PRIMARY KEY (partNumber))';
        connection.query(createTableStatement);

        // Creating the project table
        createTableStatement = 'CREATE TABLE IF NOT EXISTS Project(projectId SERIAL, name VARCHAR(50), description VARCHAR(255), PRIMARY KEY (projectId))';
        connection.query(createTableStatement);

        // Creating the part project table
        createTableStatement = 'CREATE TABLE IF NOT EXISTS PartProject(projectId int, partNumber int,  FOREIGN KEY (partNumber) REFERENCES carPart(partNumber), FOREIGN KEY (projectId) REFERENCES Project(projectId), PRIMARY KEY (projectId, partNumber))';
        connection.query(createTableStatement);

        // Creating the users projects table
        createTableStatement = 'CREATE TABLE IF NOT EXISTS UsersProject(projectId int, id int,  FOREIGN KEY (id) REFERENCES Users(id), FOREIGN KEY (projectId) REFERENCES Project(projectId), PRIMARY KEY (projectId, id))';
        connection.query(createTableStatement);

        return connection;
    
    } 
    catch (err) {
        throw new DatabaseConnectionError();
    }
}

/**
 * Gets the connection to the database.
 * @returns The connection to the database.
 */
async function getConnection(){
    return connection;
}

//#region Reset table

/**
 * Drops the specified table from the database.
 * @param {*} tableName The name of the table to be dropped.
 */
 async function resetTable(tableName){
    try {
        const dropQuery = `DROP TABLE IF EXISTS $1`;
        await connection.query(dropQuery, [tableName]);

    } catch (error) {
        throw new DatabaseConnectionError();
    }
}
//#endregion

/**
 * Method used to add a project
 * @param {*} name 
 * @param {*} description 
 * @returns The id of the project that was just created
 */
 async function addProject(name, description){
    try {
        const insertStatement = `INSERT INTO Project (name, description) values ($1, $2) RETURNING projectId`;
        let projectId = await connection.query(insertStatement, [name, description]);
        return projectId.rows[0].projectid;
    }    
    catch (error) {
        throw new DatabaseConnectionError();
    }
}
/**
 * Method use to retrieve all projects created by a user
 * @param {*} username 
 * @returns Returns an array of projects created by the given user
 */
async function getAllProjects(username){
    try {
        let userId = await userModel.getUserByName(username);
        let query = `SELECT DISTINCT P.projectid, name, description FROM Project P INNER JOIN UsersProject U ON P.projectid = U.projectid AND U.id = $1;`;
        let results = await connection.query(query, [userId]);
        return results.rows;
    } 
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

async function checkProjectOwnership(projectId, userId){
    try {
        if (projectExists(projectId) && userModel.userExists(id)) {

            const query = `SELECT * UsersProject (projectId, id) values ($1, $2)`;
            let project = await connection.query(query, [projectId, id]);
            if (project.rows.length == 0)
                return false;
            return true;
        }
        else
            throw new DatabaseConnectionError();
    }
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

/**
 * Associates a part with a project
 * @param {*} projectId 
 * @param {*} partNumber 
 */
async function addPartToProject(projectId, partNumber){
    // Validates the partNumber of the car part
    if (!validUtils.isPartNumber(partNumber)){
        throw new InvalidInputError();
    }

    try {
        if (await projectExists(projectId) && await partModel.verifyCarPartExists(partNumber)) {
            if(!await partExistsInProject(projectId, partNumber)){
                const insertStatement = `INSERT INTO PartProject (projectId, partNumber) values ($1, $2)`;
                let results = await connection.query(insertStatement, [projectId, partNumber]);

                if(results.rows.length === 0){
                    return false;
                } 
                return true;
            }
        }
        else
            throw new DatabaseConnectionError();
    }
    catch (error) {
        throw new DatabaseConnectionError();
    }
}     

async function partExistsInProject(projectId, partNumber){
    // Validates the partNumber of the car part
    if (!validUtils.isPartNumber(partNumber)){
        throw new InvalidInputError();
    }

    try {
        let statement = `SELECT projectId FROM PartProject where projectId = $1 and partNumber = $2`;
        let result = await connection.query(statement, [projectId, partNumber]);
        if (result.rows.length != 0)
            return true;
        return false;
    }
    catch (error) {
        throw new DatabaseConnectionError();
    }
}
//#region Project operations
/**
 * Associates a user with a project
 * @param {*} projectId 
 * @param {*} partNumber 
 */
async function addUserToProject(projectId, id) {
    try {
        if (projectExists(projectId) && userModel.userExists(id)) {

            const insertStatement = `INSERT INTO UsersProject (projectId, id) values ($1, $2)`;
            await connection.query(insertStatement, [projectId, id]);
        }
        else
            throw new DatabaseConnectionError();
    }
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

/**
 * A helper method that determines if a project exists or not
 * @param {*} projectId 
 * @returns true if project exists, false otherwise
 */
async function projectExists(projectId){
    try {
        const selectStatement = `SELECT projectId from Project where projectId = $1`;
        let projectArray = await connection.query(selectStatement, [projectId]);
        if (projectArray.rows.length != 0)
            return true;
        return false;
    }
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

/**
 * Gets the project associated with the specified project id.
 * @param {*} projectId The project id of the project.
 * @returns The project associated with the specified project id.
 */
async function getProjectByProjectId(projectId){
    try {
        // Checks if the project exists first
        if(projectExists(projectId)){
            const selectStatement = `SELECT name, description FROM Project WHERE projectId = $1`;
            let projectArray = await connection.query(selectStatement, [projectId]);
            return projectArray.rows;
        }
        else
            throw new DatabaseConnectionError();
    } 
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

/**
 * Updates the project with the new specified information.
 * @param {*} newName The new name of the project.
 * @param {*} newDescription The new description of the project.
 * @param {*} projectId The project if of the project to update.
 * @returns The updated project.
 */
async function updateProject(newName, newDescription, projectId){
    try {
        // Checks if the project exists first
        if(await projectExists(projectId)){
            const selectStatement = `UPDATE Project SET name = $1, description = $2 WHERE projectId = $3;`;
            let updateProj = await connection.query(selectStatement, [newName, newDescription, projectId]);
            return updateProj.rows;
        }
        else
            throw new DatabaseConnectionError();
    } 
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

async function getProjectCarParts(projectId) {
    try {
        // Checks if the project exists first
        if(projectExists(projectId)){
            const selectStatement = `SELECT * FROM PartProject WHERE projectId = $1;`;
            let theProject = await connection.query(selectStatement, [projectId]);
            return theProject.rows;
        }
        else
            throw new DatabaseConnectionError();
    } 
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

/**
 * Deletes the specified project project.
 * @param {*} projectId The project id of the project to be deleted.
 */
async function deleteProject(projectId){
    try {
        // Checks if the project exists first
        if(projectExists(projectId)){
            // Delete from the PartsProject table first (clears all parts associated with this project)
            let selectStatement = `DELETE FROM PartProject WHERE projectId = $1;`;
            let deletedProj = await connection.query(selectStatement, [projectId]);

            // Delete from the UsersProject table (no foreign key constraints)
            selectStatement = `DELETE FROM UsersProject WHERE projectId = $1;`;
            deletedProj = await connection.query(selectStatement, [projectId]);

            // Delete the actual Project 
            selectStatement = `DELETE FROM Project WHERE projectId = $1;`;
            deletedProj = await connection.query(selectStatement, [projectId]);
        }
        else
            throw new DatabaseConnectionError();
    } 
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

async function deletePartFromProject(projectId, partNumber){
    try {
        // Checks if the project exists first
        if(projectExists(projectId)){
            // Delete from the PartsProject table first (clears all parts associated with this project)
            let selectStatement = `DELETE FROM PartProject WHERE partNumber = $1;`;
            let results = await connection.query(selectStatement, [projectId]);

            if(results.rows.rowsAffected === 0){
                return false;
            }
            return true;
        }
        else
            throw new DatabaseConnectionError();
    } 
    catch (error) {
        throw new DatabaseConnectionError();
    }
}

async function deletePartFromProjectWithNumber(partNumber){
    try {
        // Delete from the PartsProject table first (clears all parts associated with this project)
        let selectStatement = `DELETE FROM PartProject WHERE partNumber = $1;`;
        let results = await connection.query(selectStatement, [projectId]);

        if(results.rows.rowsAffected === 0){
            return false;
        }
        return true;
    } 
    catch (error) {
        throw new DatabaseConnectionError();
    }
}


/**
 * Error representing a databases connection error.
 */
 class DatabaseConnectionError extends Error {}

module.exports = {
    initializeProjectModel,
    addProject,
    addPartToProject,
    addUserToProject,
    getConnection,
    getAllProjects,
    getProjectByProjectId,
    updateProject,
    getProjectCarParts,
    deleteProject,
    deletePartFromProject,
    deletePartFromProjectWithNumber,
    checkProjectOwnership
}