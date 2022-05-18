const app = require("../app"); 
const supertest = require("supertest");
const testRequest = supertest(app); 
const dbName = "car_testDb";
const model = require("../models/userModel.js");
const partModel = require("../models/carPartModelMysql.js")
const projectModel = require("../models/projectModel.js")

var connection;
var partConnection;
var projectConnection;
beforeEach(async () => { 
    connection = await model.initializeUserModel(dbName, true); 
    partConnection = await partModel.initialize(dbName, true); 
    projectConnection = await projectModel.initializeProjectModel(dbName, true) 
})

afterEach(async () => {
    if (connection)
        await connection.end();
    if (partConnection)
        await partConnection.end();
    if (projectConnection)
        await projectConnection.end();
})
const userData = [
    { username: 'username1', password: 'P@ssW0rd!'},
    { username: 'username2', password: '#@ijdsAd2'},
    { username: 'username3', password: 'T#E2ST!ss'},
    { username: 'username4', password: 'thisisAP@ssw0Rd'},
    { username: 'username5', password: 'testPassword#23'},
    { username: 'username6', password: 'H3||oW0rld'},
]

test("POST /users/login failure case, not a user", async () => {
    let randomUser = userData.at(Math.random() * 6);
    let testResponse = await testRequest.post('/users/login').send(randomUser);
    expect(testResponse.status).toBe(404);
})

test("POST /users/login success case", async () => {
    let randomUser = userData.at(Math.random() * 6);
    await model.addUser(randomUser.username, randomUser.password)
    let testResponse = await testRequest.post('/users/login').send(randomUser);
    expect(testResponse.status).toBe(302);
})

test("POST /users/login failure case, wrong username", async () => {
    let randomUser = userData.at(Math.random() * 6);
    await model.addUser(randomUser.username+"1", randomUser.password)
    let testResponse = await testRequest.post('/users/login').send(randomUser);
    expect(testResponse.status).toBe(404);
})

test("POST /users/login failure case, wrong password", async () => {
    let randomUser = userData.at(Math.random() * 6);
    await model.addUser(randomUser.username, randomUser.password+"1")
    let testResponse = await testRequest.post('/users/login').send(randomUser);
    expect(testResponse.status).toBe(404);
})


test("POST /users/login failure case due to dropped table", async () => {
    let randomUser = userData.at(Math.random() * 6);
    await model.addUser(randomUser.username, randomUser.password);
    await connection.execute("DROP TABLE UsersProject;");
    await connection.execute("DROP TABLE Users;");
    let testResponse = await testRequest.post('/users/login').send(randomUser);
    expect(testResponse.status).toBe(500);
})




