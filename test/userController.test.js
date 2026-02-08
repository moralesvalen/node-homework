/*
require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");

const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

const { register, logon, logoff } = require("../controllers/userController");

let saveRes;
let saveData;

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
});

afterAll(() => {
  prisma.$disconnect();
});

describe("user controller basic tests", () => {
  it("33. can register a user", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        name: "Bob",
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(register, req, saveRes);

    expect(saveRes.statusCode).toBe(201);
  });

  it("34. can logon with valid credentials", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(logon, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  it("35. logoff clears authentication", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(logoff, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });
});
*/
require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");

const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

const { register, logon, logoff } = require("../controllers/userController");

let saveRes;

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
});

afterAll(() => {
  prisma.$disconnect();
});

describe("user controller basic tests", () => {
  it("33. can register a user", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      headers: {
        "X-Recaptcha-Test": process.env.RECAPTCHA_BYPASS, // ✅ bypass for tests
      },
      body: {
        name: "Bob",
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(register, req, saveRes);

    expect(saveRes.statusCode).toBe(201);
  });

  it("34. can logon with valid credentials", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: {
        email: "bob@sample.com",
        password: "Pa$$word20",
      },
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(logon, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  it("35. logoff clears authentication", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    await waitForRouteHandlerCompletion(logoff, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });
});
