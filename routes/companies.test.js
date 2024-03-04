process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async () => {
  try {
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      ["apple", "Apple", "Alphabet"]
    );
    testCompany = results.rows[0];
  } catch (error) {
    console.error("Error inserting company:", error);
  }
});

//////////// test that the company has been created ///////////
describe("Test that company has been created", () => {
  test("Create new company", () => {
    console.log(testCompany);
    expect(testCompany).toEqual({
      code: "apple",
      name: "Apple",
      description: "Alphabet",
    });
  });
});

////////// test getting companies  /////////
describe("GET /companies", () => {
  test("Get a list of companies expect one", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      companies: [
        {
          code: "apple",
          name: "Apple",
        },
      ],
    });
  });
});
////////// test getting a company /////////
describe("GET /companies/:code", () => {
  test("Get a single company", async () => {
    const code = testCompany.code;
    const res = await request(app).get(`/companies/${code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ company: testCompany });
  });
});

////////// test getting a non existing company /////////
describe("GET /companies/:code", () => {
  test("Respond with 404 if invalid company", async () => {
    const code = "oxo";
    const res = await request(app).get(`/companies/${code}`);
    expect(res.statusCode).toBe(404);
  });
});

// ////////// test creating a company /////////
describe("POST /companies", () => {
  test("Create a single company", async () => {
    const res = await request(app).post("/companies").send({
      code: "google",
      name: "Google LLC",
      description: "Search",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "google",
        name: "Google LLC",
        description: "Search",
      },
    });
  });
});

////////// test updating a company /////////
describe("Patch /companies/:code", () => {
  test("Update a company", async () => {
    const code = testCompany.code;
    const res = await request(app).put(`/companies/${code}`).send({
      code: "apple",
      name: "Alphabet",
      description: "Mac Computers",
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: {
        code: "apple",
        name: "Alphabet",
        description: "Mac Computers",
      },
    });
  });
  test("Update a company", async () => {
    const code = "oxo";
    const res = await request(app).patch(`/companys/${code}`).send({
      code: "apple",
      name: "Alphabet",
      description: "Mac Computers",
    });
    expect(res.statusCode).toBe(404);
  });
});

// ////////// test deleting a company /////////
describe("DELETE /companies/:code", () => {
  test("Delete a company", async () => {
    const code = testCompany.code;
    const res = await request(app).delete(`/companies/${code}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "Deleted",
    });
  });
  test("Delete a NON existing company", async () => {
    const code = "oxo";
    const res = await request(app).delete(`/companies/${code}`);
    expect(res.statusCode).toBe(404);
  });
});

/////////////// run after each test //////////////
afterEach(async () => {
  try {
    await db.query("DELETE FROM companies;");
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
});

afterAll(async () => {
  try {
    await db.end(); // close db connection
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
});
