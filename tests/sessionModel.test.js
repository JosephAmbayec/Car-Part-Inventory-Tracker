const model = require('../models/sessionModel');

const userData = [
    { username: 'username1', password: 'P@ssW0rd!'},
    { username: 'username2', password: '#@ijdsAd2'},
    { username: 'username3', password: 'T#E2ST!ss'},
    { username: 'username4', password: 'thisisAP@ssw0Rd'},
    { username: 'username5', password: 'testPassword#23'},
    { username: 'username6', password: 'H3||oW0rld'},
]

test("createSession successfully returns sessionId", async () => {
    let username = userData.at(Math.random() * 6).username;
    let numMinutes = Math.random() * 20

    let result = await model.createSession(username, numMinutes)

    expect(result.length).toEqual(36);
});

