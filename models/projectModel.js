'use strict';
const {Client} = require('pg');
const mysql = require('mysql2/promise');
const validUtils = require('../validateUtils.js');
const logger = require('../logger');
const model = require('../models/carPartModelMysql');
const userModel = require('../models/userModel');
const partModel = require('../models/carPartModelMysql');
const { DatabaseConnectionError } = require('./carPartModelMysql.js');
var connection = model.getConnection();

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
            
    
        if (reset) {
            await resetTable("PartProject");
            await resetTable("UsersProject");
            await resetTable("Project");
        }
        let createTableStatement = `CREATE TABLE IF NOT EXISTS Users(id int SERIAL, username VARCHAR(15), password varchar(128), roleID int, PRIMARY KEY (id), FOREIGN KEY (roleID) REFERENCES Roles(roleID))`;
        await connection.query(createTableStatement);
        logger.info("Users table created/exists");

        createTableStatement = 'CREATE TABLE IF NOT EXISTS carPart(partNumber int, name VARCHAR(100), `condition` VARCHAR(50), image VARCHAR(2000), PRIMARY KEY (partNumber))';
        await connection.query(createTableStatement);
        logger.info("Car part table created/exists");

        createTableStatement = 'CREATE TABLE IF NOT EXISTS Project(projectId int SERIAL, name VARCHAR(50), description VARCHAR(255), PRIMARY KEY (projectId))';
        await connection.query(createTableStatement);
        logger.info("Project table created/exists");

        createTableStatement = 'CREATE TABLE IF NOT EXISTS PartProject(projectId int, partNumber int,  FOREIGN KEY (partNumber) REFERENCES carPart(partNumber), FOREIGN KEY (projectId) REFERENCES Project(projectId), PRIMARY KEY (projectId, partNumber))';
        await connection.query(createTableStatement);
        logger.info("PartProject table created/exists");

        createTableStatement = 'CREATE TABLE IF NOT EXISTS UsersProject(projectId int, id int,  FOREIGN KEY (id) REFERENCES Users(id), FOREIGN KEY (projectId) REFERENCES Project(projectId), PRIMARY KEY (projectId, id))';
        await connection.query(createTableStatement);
        logger.info("UsersProject table created/exists");

        
        connection.connect()
        return connection;
    
    } catch (err) {
        logger.error(err);
        throw new DatabaseConnectionError();
    }
}

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
        const dropQuery = `DROP TABLE IF EXISTS $1}`;
        await connection.query(dropQuery, [tableName]);
        logger.info(`${tableName} table dropped`);

    } catch (error) {
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}

/**
 * Method used to add a project
 * @param {*} name 
 * @param {*} description 
 * @returns The id of the project that was just created
 */
 async function addProject(name, description){
    try {
        const insertStatement = `INSERT INTO Project (name, description) values ('$1', '$2')`;
        let projectId = await connection.query(insertStatement, [name, description]);
        return projectId[0].insertId;
    }    
    catch (error) {
        logger.error(error);
        throw new DatabaseConnectionError();
    }
}
/**
 * Method use to retrieve all projects created by a user
 * @param {*} username 
 * @returns Returns an array of projects created by the given user
 */
async function getAllProjects(username){
    let userId = await userModel.getUserByName(username);
    let query = `SELECT name, description FROM Project, UsersProject as U where U.id = $1`;
    let results = await connection.query(query, [username]);
    return results[0];
}

/**
 * Associates a part with a project
 * @param {*} projectId 
 * @param {*} partNumber 
 */
async function addPartToProject(projectId, partNumber){
    try {
        if (projectExists(projectId) && partModel.verifyCarPartExists(partNumber)) {

            const insertStatement = `INSERT INTO PartProject (projectId, partNumber) values ($1, $2})`;
            await connection.query(insertStatement, [projectId, partNumber]);
        }
        else
            throw new DatabaseConnectionError();
    }
    catch (error) {
        logger.error(error);
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
        logger.error(error);
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
        if (projectArray[0].length != 0)
            return true;
        return false;
    }
    catch (error) {
        logger.error(error);
        throw new DatabaseConnectionError();
    }

}


module.exports = {
    initializeProjectModel,
    addProject,
    addPartToProject,
    addUserToProject,
    getConnection,
    getAllProjects
}