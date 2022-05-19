const app = require("../app"); 
const supertest = require("supertest");
const testRequest = supertest(app); 
const dbName = "car_testDb";
const model = require("../models/carPartModelMysql.js");
const projectModel = require("../models/projectModel.js");

var connection;
beforeEach(async () => { connection = await model.initialize(dbName, true); connection2 = await projectModel.initializeProjectModel(dbName, true);});
afterEach(async () => {
    if (connection)
        await connection.end();
    if (connection2)
        await connection2.end();
})

/* Data to be used to generate random car for testing */
const carData = [
    { partNumber: 1, name: 'Muffler'},
    { partNumber: 2, name: 'Windshield'},
    { partNumber: 3, name: 'Mirror'},
    { partNumber: 4, name: 'Spoiler'},
    { partNumber: 5, name: 'Hubcap'},
    { partNumber: 6, name: 'Tires'}
]
    
test("GET / success case", async () => {
    let testResponse = await testRequest.get('/');
    expect(testResponse.status).toBe(200);
}) 

test("GET random endpoint error case", async () => {
    let testResponse = await testRequest.get('/randomIncorrectEndpoint');
    expect(testResponse.status).toBe(404);
})

test("POST /parts success case", async () =>{
    let randomPart = carData.at(Math.random() * 6);
    let testResponse = await testRequest.post('/parts').send(randomPart);
    expect(testResponse.status).toBe(201);

    let result = await connection.execute("select partNumber, name from carPart;")
    expect(result[0].length).toBe(1);
    expect(result[0][0]).toEqual(randomPart);
})

test("POST /parts fail case", async () =>{
    let testCarPart = carData.at(Math.random() * 6);
    let oldName = testCarPart.name;
    testCarPart.name = "3*(&784723749as";
    let testResponse = await testRequest.post('/parts').send(testCarPart);
    expect(testResponse.status).toBe(404);
    
    let result = await connection.execute("select partNumber, name from carPart;")
    expect(result[0].length).toBe(0);

    // Reset model
    testCarPart.name = oldName;
})

test("GET /parts specific success case", async () => {
    let randomPart = carData.at(Math.random() * 6);
    let specificPart = { partNumber: 30000001, name: "Specific" }
    await model.addCarPart(randomPart.partNumber, randomPart.name);
    await model.addCarPart(specificPart.partNumber, specificPart.name);

    let result = await connection.execute("select partNumber, name from carPart;")
    expect(result[0].length).toBe(2);
    

    let testResponse = await testRequest.get(`/parts/${specificPart.partNumber}`);
    expect(testResponse.status).toBe(200)
})

test("GET /parts specific fail case invalid input", async () => {
    let randomPart = carData.at(Math.random() * 6);
    await model.addCarPart(randomPart.partNumber, randomPart.name);

    let result = await connection.execute("select partNumber, name from carPart;")
    expect(result[0].length).toBe(1);
    
    let testResponse = await testRequest.get("/parts/NotANumber");
    expect(testResponse.status).toBe(404)
})

test("GET /parts specific fail case no parts", async () => {
    let result = await connection.execute("select partNumber, name from carPart;")
    expect(result[0].length).toBe(0);
    
    let testResponse = await testRequest.get("/parts/2002");
    expect(testResponse.status).toBe(404)
})

test("GET /parts collection success case", async () => {
    let randomCar1 = carData.at(0);
    let randomCar2 = carData.at(1);
    let randomCar3 = carData.at(2);

    await model.addCarPart(randomCar1.partNumber, randomCar1.name)
    await model.addCarPart(randomCar2.partNumber, randomCar2.name)
    await model.addCarPart(randomCar3.partNumber, randomCar3.name)

    let result = await connection.execute("select partNumber, name  from carPart;");
    expect(result[0].length).toBe(3);

    let testResponse = await testRequest.get("/parts");
    expect(testResponse.status).toBe(200);
    expect(testResponse.text).toContain(`${randomCar1.partNumber}`);
    expect(testResponse.text).toContain(`${randomCar1.name}`);
    expect(testResponse.text).toContain(`${randomCar2.partNumber}`);
    expect(testResponse.text).toContain(`${randomCar2.name}`);
    expect(testResponse.text).toContain(`${randomCar3.partNumber}`);
    expect(testResponse.text).toContain(`${randomCar3.name}`);
})

test("GET /parts collection fail case", async () => {
    let result = await connection.execute("select partNumber, name from carPart;");
    expect(result[0].length).toBe(0);

    let testResponse = await testRequest.get("/parts");
    expect(testResponse.status).toBe(201);
})

test("PUT /parts/id success case", async () => {
    let randomPart = carData.at(Math.random() * 6);
    await model.addCarPart(randomPart.partNumber, randomPart.name);

    let before = await connection.execute("select partNumber, name from carPart;");
    expect(before[0].length).toBe(1);

    let testResponse = await testRequest.put(`/parts/${randomPart.partNumber}`).send({ name: "NewName" } );
    expect(testResponse.status).toBe(200);

    let after = await connection.execute("select partNumber, name from carPart;");
    expect(after[0].length).toBe(1);
    expect(after[0][0].name).toBe("NewName");
})

test("PUT /parts/id fail case", async () => {
    let randomPart = carData.at(Math.random() * 6);
    await model.addCarPart(randomPart.partNumber, randomPart.name);

    let before = await connection.execute("select partNumber, name from carPart;");
    expect(before[0].length).toBe(1);

    let testResponse = await testRequest.put(`/parts/9999999`).send({ name: "NewName" } );
    expect(testResponse.status).toBe(404);

    let after = await connection.execute("select partNumber, name from carPart;");
    expect(after[0].length).toBe(1);
    expect(after[0][0].name).toBe(randomPart.name);
})

test("DELETE /parts/id success case", async () =>{
    let randomCar1 = carData.at(3);
    let randomCar2 =  carData.at(5);

    await model.addCarPart(randomCar1.partNumber, randomCar1.name);
    await model.addCarPart(randomCar2.partNumber, randomCar2.name);

    let before = await connection.execute("select partNumber, name from carPart;");
    expect(before[0].length).toBe(2);

    let testResponse = await testRequest.post(`/parts/delete/${randomCar1.partNumber}`);
    expect(testResponse.status).toBe(200);
    // expect(testResponse.status).toBe(202);
    
    let after = await connection.execute("select partNumber, name from carPart;");
    expect(after[0].length).toBe(1);
    expect(after[0][0]).toEqual(randomCar2);
})

test("DELETE /parts/id fail case", async () =>{
    let randomCar1 = carData.at(0);
    let randomCar2 =  carData.at(2);

    await model.addCarPart(randomCar1.partNumber, randomCar1.name);
    await model.addCarPart(randomCar2.partNumber, randomCar2.name);

    let before = await connection.execute("select partNumber, name from carPart;");
    expect(before[0].length).toBe(2);

    let testResponse = await testRequest.post('/parts/delete/999999');
    expect(testResponse.status).toBe(404);
    
    let after = await connection.execute("select partNumber, name from carPart;");
    expect(after[0].length).toBe(2);
})