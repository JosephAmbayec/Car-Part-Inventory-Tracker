const res = require('express/lib/response');
const logger = require('../logger.js');
const model = require('../models/userModel.js');

var connection;

/* Data to be used to generate random pokemon for testing */
const userData = [
    { username: 'username1', password: 'P@ssW0rd!'},
    { username: 'username2', password: '#@ijdsAd2'},
    { username: 'username3', password: 'T#E2ST!'},
    { username: 'username4', password: 'thisisAP@ssw0Rd'},
    { username: 'username5', password: 'testPassword#23'},
    { username: 'username6', password: 'H3||oW0rld'},
]


/* Make sure the database is empty before each test.  This runs before each test.  See https://jestjs.io/docs/api */
beforeEach(async () => {
    try {
        connection = await model.initializeUserModel("car_testDb", true); // Passing true means it'll use the test table
    } catch (err) {  console.error(err) }
});

afterEach(async () => {
    connection = await model.getConnection();
    if (connection) {
        await connection.close();
    } 
});

/** addCar tests */
/* #region   */
test("addUser successfully wrote to table", async () => {
    let user1 = userData.at(0);
    let user2 = userData.at(5);
    let user3 = userData.at(3);

    await model.addUser(user1.username, user1.password)
    await model.addUser(user2.username, user2.password)
    await model.addUser(user3.username, user3.password)

    let result = await connection.query("select username from Users");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(3);
    expect(result[0][0].username).toBe(user1.username);
    expect(result[0][1].username).toBe(user2.username);
    expect(result[0][2].username).toBe(user3.username);

})

test("addUser failed to write to table due to username being too short", async () => {
    let user1 = userData.at(0);
    try {
        await model.addUser("test", user1.password)
    }
    catch (e){
        expect(e.message).toContain('Username must be between 6 and 15 characters');
    }
    let result = await connection.query("select username from Users");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(0);

})


test("addUser failed to write to table due to username being too long", async () => {
    let user1 = userData.at(0);
    try {
        await model.addUser("hithisisareallylongusernamethatshouldntbeallowed", user1.password)
    }
    catch (e){
        expect(e.message).toContain('Username must be between 6 and 15 characters');
    }
    let result = await connection.query("select username from Users");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(0);

})

test("addUser failed to write to table due to username already existing", async () => {
    let user1 = userData.at(0);
    try {
        await model.addUser(user1.username, user1.password)
        await model.addUser(user1.username, user1.password)
    }
    catch (e){
        expect(e.message).toContain('Username already exists');
    }
    let result = await connection.query("select username from Users");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(1);
    expect(result[0][0].username).toBe(user1.username);

})

test("addUser failed to write to table due to weak password", async () => {
    let user1 = userData.at(0);
    try {
        await model.addUser(user1.username, "password")
    }
    catch (e){
        expect(e.message).toContain('Password must be 8 or more characters');
    }
    let result = await connection.query("select username from Users");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(0);
})

test("Role Table has default roles", async () => {
    let result = await connection.query("select rolename from Roles");
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].length).toBe(2);
    expect(result[0][0].rolename).toContain("admin")
    expect(result[0][1].rolename).toContain("guest")
})

test("Successful login using valid credentials", async () => {
    let user1 = userData.at(0);
    await model.addUser(user1.username, user1.password);

    let result = await model.validateLogin(user1.username, user1.password)

    expect(result).toBe(true);
})

test("Unsuccessful login using invalid password", async () => {
    let user1 = userData.at(0);
    await model.addUser(user1.username, user1.password);

    let result = await model.validateLogin(user1.username, user1.password+"1")

    expect(result).toBe(false);
})

test("Unsuccessful login using invalid username", async () => {
    let user1 = userData.at(0);
    await model.addUser(user1.username, user1.password);

    let result = await model.validateLogin(user1.username+"1", user1.password)

    expect(result).toBe(false);
})

