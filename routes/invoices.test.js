process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async () => {
  try {
    const company = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      ["apple", "Apple", "Apple Computers"]
    );
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt`,
      ["apple", 217]
    );
    testInvoice = results.rows[0];
  } catch (error) {
    console.error("Error inserting invoice:", error);
  }
});

//////////// test that the invoice has been created ///////////
describe("Test that invoice has been created", () => {
  test("Create new invoice", () => {
    expect(testInvoice).toEqual({
      id: expect.any(Number),
      comp_code: "apple",
      amt: 217,
    });
  });
});

////////// test getting invoices  /////////
describe("GET /invoices", () => {
  test("Get a list of invoices expect one", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoices: [
        {
          amt: 217,
          comp_code: "apple",
          add_date: expect.any(String),
          id: expect.any(Number),
          paid: expect.any(Boolean),
          paid_date: null,
        },
      ],
    });
  });
});

// ////////// test getting a invoice /////////
describe("GET /invoices/:id", () => {
  test("Get a single invoice", async () => {
    const id = testInvoice.id;
    const res = await request(app).get(`/invoices/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      invoice: {
        amt: 217,
        comp_code: "apple",
        add_date: expect.any(String),
        id: expect.any(Number),
        paid: expect.any(Boolean),
        paid_date: null,
        name: "Apple",
        code: "apple",
        description: "Apple Computers",
      },
    });
  });
});

// ////////// test getting a non existing invoice /////////
describe("GET /invoices/:id", () => {
  test("Respond with 404 if invalid invoice", async () => {
    const id = 0;
    const res = await request(app).get(`/invoices/${id}`);
    expect(res.statusCode).toBe(404);
  });
});

// // ////////// test creating a invoice /////////
describe("POST /invoices", () => {
  test("Create a single invoice", async () => {
    const res = await request(app).post("/invoices").send({
      comp_code: "apple",
      amt: 318,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        amt: 318,
        comp_code: "apple",
        add_date: expect.any(String),
        id: expect.any(Number),
        paid: expect.any(Boolean),
        paid_date: null,
      },
    });
  });
});

// ////////// test updating a invoice /////////
describe("Patch /invoices/:id", () => {
  test("Update a invoice", async () => {
    const id = testInvoice.id;
    const res = await request(app).put(`/invoices/${id}`).send({
      amt: 221,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      invoice: {
        amt: 221,
        comp_code: "apple",
        add_date: expect.any(String),
        id: expect.any(Number),
        paid: expect.any(Boolean),
        paid_date: null,
      },
    });
  });
  test("Update a invoice", async () => {
    const id = 0;
    const res = await request(app).patch(`/invoices/${id}`).send({
      comp_code: "apple",
      amt: 203,
    });
    expect(res.statusCode).toBe(404);
  });
});

// // ////////// test deleting a invoice /////////
describe("DELETE /invoices/:id", () => {
  test("Delete a invoice", async () => {
    const id = testInvoice.id;
    const res = await request(app).delete(`/invoices/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      status: "Deleted",
    });
  });
  test("Delete a NON existing invoice", async () => {
    const id = 0;
    const res = await request(app).delete(`/invoices/${id}`);
    expect(res.statusCode).toBe(404);
  });
});

/////////////// run after each test //////////////
afterEach(async () => {
  try {
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
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
