const res = require('express/lib/response');
const logger = require('../logger.js');
const model = require('../models/projectModel.js');
const users = require('../models/userModel');
const partModel = require("../models/carPartModelMysql.js")


var connection;

const projectData = [
    { name: 'First Project', description: 'Test Description' },
    { name: 'Second Project', description: 'Test Description' },
    { name: 'Third Project', description: 'Test Description' },
    { name: 'Fourth Project', description: 'Test Description' },
    { name: 'Fifth Project', description: 'Test Description'},
    { name: 'Sixth Project', description: 'Test Description' },
]

const dbName = "car_testDb";
var connection;
var partConnection;
var projectConnection;
beforeEach(async () => { 
    connection = await users.initializeUserModel(dbName, true); 
    partConnection = await partModel.initialize(dbName, true); 
    projectConnection = await model.initializeProjectModel(dbName, true) 
})

afterEach(async () => {
    if (connection)
        await connection.end();
    if (partConnection)
        await partConnection.end();
    if (projectConnection)
        await projectConnection.end();
})

/** addCar tests */
/* #region   */
test("addProject successfully wrote to table", async () => {
    let project1 = projectData.at(0);
    let project2 = projectData.at(5);
    let project3 = projectData.at(3);

    await model.addProject(project1.name, project1.description);
    await model.addProject(project2.name, project2.description);
    await model.addProject(project3.name, project3.description);

    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(3);
    expect(result[0][0].name).toBe(project1.name);
    expect(result[0][1].name).toBe(project2.name);
    expect(result[0][2].name).toBe(project3.name);

})

test("addProject with User successfully wrote to table", async () => {
    let project1 = projectData.at(0);
    let project2 = projectData.at(5);
    let project3 = projectData.at(3);

    let proj1 = await model.addProject(project1.name, project1.description);
    let proj2 = await model.addProject(project2.name, project2.description);
    let proj3 = await model.addProject(project3.name, project3.description);
    let userAddStatement = 'INSERT INTO Users (username, password) values ("FirstUser", "AVeryStrongPassword123!")';
    await connection.execute(userAddStatement);
    userAddStatement = 'INSERT INTO Users (username, password) values ("SecondUser", "AVeryStrongPassword123!")';
    await connection.execute(userAddStatement);
    userAddStatement = 'INSERT INTO Users (username, password) values ("ThirdUser", "AVeryStrongPassword123!")';
    await connection.execute(userAddStatement);

    await model.addUserToProject(proj1, 1);
    await model.addUserToProject(proj1, 2);
    await model.addUserToProject(proj1, 3);

    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(3);
    expect(result[0][0].name).toBe(project1.name);
    expect(result[0][1].name).toBe(project2.name);
    expect(result[0][2].name).toBe(project3.name);

    result = await connection.query("select id from UsersProject");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(3);
    expect(result[0][0].id).toBe(1);
    expect(result[0][1].id).toBe(2);
    expect(result[0][2].id).toBe(3);
})

test("addProject with User failed due to invalid projectId", async () => {

    let userAddStatement = 'INSERT INTO Users (username, password) values ("FirstUser", "AVeryStrongPassword123!")';
    await connection.execute(userAddStatement);
    try {
        await model.addUserToProject(1, 1)
    }
    catch (error){
        logger.error(error)
    }

    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(0);

    result = await connection.query("select id from UsersProject");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(0);
})

test("addProject with User failed due to invalid user id", async () => {
    let project1 = projectData.at(0);
    let threw = false

    let proj1 = await model.addProject(project1.name, project1.description);
    try {
        await model.addUserToProject(proj1, 1)
    }
    catch (error){
        threw = true;
    }

    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(1);
    expect(result[0][0].name).toBe(project1.name);

    result = await connection.query("select id from UsersProject");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(0);
    
    expect(threw).toBe(true);
})

test("addProject with Part successfully wrote to table", async () => {
    let project1 = projectData.at(0);
    let proj1 = await model.addProject(project1.name, project1.description);

    await partModel.addCarPart(1001, "Tire", "New");

    await model.addPartToProject(proj1, 1001);

    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(1);
    expect(result[0][0].name).toBe(project1.name);

    result = await connection.query("select projectId from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(1);
    expect(result[0][0].projectId).toBe(proj1);

    result = await connection.query("select partNumber from PartProject")
    expect(result[0].length).toBe(1);
    expect(result[0][0].partNumber).toBe(1001);
})


test("addProject with Part failed to add part due to inexistant part", async () => {
    let project1 = projectData.at(0);
    let threw = false

    let proj1 = await model.addProject(project1.name, project1.description);
    try {
        await model.addPartToProject(proj1, 1001);

    }
    catch (error){
        threw = true;
    }
 
    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(1);
    expect(result[0][0].name).toBe(project1.name);

    result = await connection.query("select partNumber from PartProject")
    expect(result[0].length).toBe(0);
    
    expect(threw).toBe(true);
})

test("addProject with Part failed to add part due to inexistant project", async () => {
    let project1 = projectData.at(0);
    let threw = false

    await partModel.addCarPart(1001, "Tire", "New");
    try {
        await model.addPartToProject(1, 1001);

    }
    catch (error){
        threw = true;
    }
 
    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(0);

    result = await connection.query("select partNumber from PartProject")
    expect(result[0].length).toBe(0);
    
    expect(threw).toBe(true);
})

test("addProject with User and Part successfully wrote to table", async () => {
    let project1 = projectData.at(0);
    let proj1 = await model.addProject(project1.name, project1.description);

    let userAddStatement = 'INSERT INTO Users (username, password) values ("FirstUser", "AVeryStrongPassword123!")';
    await connection.execute(userAddStatement)

    await partModel.addCarPart(1001, "Tire", "New");

    await model.addUserToProject(proj1, 1);
    await model.addPartToProject(proj1, 1001);

    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(1);
    expect(result[0][0].name).toBe(project1.name);

    result = await connection.query("select projectId from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(1);
    expect(result[0][0].projectId).toBe(proj1);

    result = await connection.query("select partNumber from PartProject")
    expect(result[0].length).toBe(1);
    expect(result[0][0].partNumber).toBe(1001);

    result = await connection.query("select id from UsersProject")
    expect(result[0].length).toBe(1);
    expect(result[0][0].id).toBe(1);
})

test("updateProject successfully updated project", async () => {
    let project1 = projectData.at(2);
    let project2 = projectData.at(5);

    let id = await model.addProject(project1.name, project1.description);
    await model.addProject(project2.name, project2.description);

    await model.updateProject("New Name", "New Description", id);


    let result = await connection.query("select name, description from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(2);
    expect(result[0][0].name).toBe("New Name");
    expect(result[0][1].name).toBe(project2.name);
    expect(result[0][0].description).toBe("New Description");
    expect(result[0][1].description).toBe(project2.description);


})

test("updateProject failed to update not existant project", async () => {
    let threw = false;

    try{
        await model.updateProject("New Name", "New Description", 1);
    }
    catch{
        threw = true;
    }
    



    let result = await connection.query("select name from Project");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(0);
    expect(threw).toBe(true);

})
