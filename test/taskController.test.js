require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const { EventEmitter } = require("events");

const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");

let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();

  user1 = await prisma.User.create({
    data: {
      name: "Bob",
      email: "bob@sample.com",
      hashedPassword: "nonsense",
    },
  });

  user2 = await prisma.User.create({
    data: {
      name: "Alice",
      email: "alice@sample.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(() => {
  prisma.$disconnect();
});
describe("testing task creation", () => {
  it("14. cant create a task without a user id", async () => {
    expect.assertions(1);

    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });

    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
});
it("15. cant create a task with a bogus user id", async () => {
  expect.assertions(1);

  const req = httpMocks.createRequest({
    method: "POST",
    body: { title: "first task" },
  });

  req.user = { id: 99999 }; // user inexistente

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  try {
    await waitForRouteHandlerCompletion(create, req, saveRes);
  } catch (e) {
    expect(e.name).toBe("PrismaClientKnownRequestError");
  }
});
it("16. create succeeds with a valid user id", async () => {
  const req = httpMocks.createRequest({
    method: "POST",
    body: { title: "first task" },
  });

  req.user = { id: user1.id }; // user válido

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(create, req, saveRes);

  expect(saveRes.statusCode).toBe(201);
});
it("17. returned object has expected title", () => {
  saveData = saveRes._getJSONData(); //reutlizamos saveRes de la prueba anterior

  expect(saveData.title).toBe("first task");
});
it("18. returned object has correct isCompleted value", () => {
  expect(saveData.isCompleted).toBe(false);
});
it("19. returned object has correct userId", () => {
  expect(saveData.userId).toBeUndefined(); // por seguridad no devolvemos el userId
  saveTaskId = saveData.id; // guardamos el id para las siguientes pruebas
});
it("20. cant get tasks without a user id", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
  });

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(index, req, saveRes);

  expect(saveRes.statusCode).not.toBe(200);
});
it("21. with a valid user id, index returns 200", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
  });

  req.user = { id: user1.id }; // user válido

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(index, req, saveRes);

  expect(saveRes.statusCode).toBe(200);
});
it("22. returned object is an array of length 1", () => {
  saveData = saveRes._getJSONData();
  expect(saveData.length).toBe(1);
});
it("23. first task has expected title", () => {
  expect(saveData[0].title).toBe("first task");
});
it("24. first task does not include userId", () => {
  expect(saveData[0].userId).toBeUndefined();
});
it("25. user2 cannot access user1 tasks", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
  });

  req.user = { id: user2.id }; // usuario distinto

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(index, req, saveRes);

  expect(saveRes.statusCode).toBe(404);
});
it("26. user1 can retrieve the created task", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
  });

  req.user = { id: user1.id };
  req.params = { id: saveTaskId.toString() };

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(show, req, saveRes);

  expect(saveRes.statusCode).toBe(200);
});
it("27. user2 cannot retrieve this task", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
  });

  req.user = { id: user2.id };
  req.params = { id: saveTaskId.toString() };

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(show, req, saveRes);

  expect(saveRes.statusCode).toBe(404);
});
it("28. user1 can update task to isCompleted true", async () => {
  const req = httpMocks.createRequest({
    method: "PATCH",
    body: { isCompleted: true },
  });

  req.user = { id: user1.id };
  req.params = { id: saveTaskId.toString() };

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(update, req, saveRes);

  expect(saveRes.statusCode).toBe(200);
});
it("29. user2 cannot update this task", async () => {
  const req = httpMocks.createRequest({
    method: "PATCH",
    body: { isCompleted: false },
  });

  req.user = { id: user2.id };
  req.params = { id: saveTaskId.toString() };

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(update, req, saveRes);

  expect(saveRes.statusCode).toBe(404);
});
it("30. user2 cannot delete this task", async () => {
  const req = httpMocks.createRequest({
    method: "DELETE",
  });

  req.user = { id: user2.id };
  req.params = { id: saveTaskId.toString() };

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(deleteTask, req, saveRes);

  expect(saveRes.statusCode).toBe(404);
});
it("31. user1 can delete this task", async () => {
  const req = httpMocks.createRequest({
    method: "DELETE",
  });

  req.user = { id: user1.id };
  req.params = { id: saveTaskId.toString() };

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(deleteTask, req, saveRes);

  expect(saveRes.statusCode).toBe(200);
});
it("32. after deletion, user1 has no tasks", async () => {
  const req = httpMocks.createRequest({
    method: "GET",
  });

  req.user = { id: user1.id };

  saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });

  await waitForRouteHandlerCompletion(index, req, saveRes);

  expect(saveRes.statusCode).toBe(404);
});
