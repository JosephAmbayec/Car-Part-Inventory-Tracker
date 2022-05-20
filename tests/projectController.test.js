const app = require("../app"); 
const supertest = require("supertest");
const testRequest = supertest.agent(app); 
const dbName = "car_testDb";
const model = require('../models/projectModel.js');
const users = require('../models/userModel');
const partModel = require("../models/carPartModelMysql.js")

const cookieParser = require('cookie-parser');
app.use(cookieParser())

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
const projectData = [
    { name: 'First Project', description: 'Test Description' },
    { name: 'Second Project', description: 'Test Description' },
    { name: 'Third Project', description: 'Test Description' },
    { name: 'Fourth Project', description: 'Test Description' },
    { name: 'Fifth Project', description: 'Test Description'},
    { name: 'Sixth Project', description: 'Test Description' },
]
const user = { 
    username: "Joseph",
    password: "TestPassword123!",
    confirmPassword: "TestPassword123!"
}

test("GET /projects success case", async () => {
    let registerResponse = await testRequest.post('/users/signup').send(user);
    expect(registerResponse.status).toBe(201);
    let loginResponse = await testRequest.post('/users/login').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();
    let testResponse = await testRequest.get('/projects');
    expect(testResponse.status).toBe(201);
})

test("POST /projects success case", async () => {
    let project = projectData.at(Math.random() * 6);
    let registerResponse = await testRequest.post('/users/signup').send(user);
    expect(registerResponse.status).toBe(201);
    let loginResponse = await testRequest.post('/users/login').send(user);
    expect(loginResponse.get('Set-Cookie')).toBeDefined();
    let testResponse = await testRequest.post('/projects').send(project);
    expect(testResponse.status).toBe(201);
})

test("POST /projects fail case due to no user", async () => {
    let project = projectData.at(Math.random() * 6);
    let testResponse = await testRequest.post('/projects').send(project);
    expect(testResponse.status).toBe(500);
})

test("GET /projects/:id success case", async () => {
    let project = projectData.at(Math.random() * 6);
    let projectResponse = await testRequest.post('/projects').send(project);
    let testResponse = await testRequest.get('/projects/1');
    expect(testResponse.status).toBe(201);
})

test("GET /projects/:id fail case", async () => {
    let testResponse = await testRequest.get('/projects/1');
    expect(testResponse.status).toBe(201);
})