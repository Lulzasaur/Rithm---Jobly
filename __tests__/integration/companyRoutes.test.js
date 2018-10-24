process.env.NODE_ENV='test'
const db = require("../../db");
const request = require("supertest");
const app = require("../../app");

const Company = require('../../models/companyModels')

// set up table
beforeAll(async () => {
  await db.query(`CREATE TABLE companies (
    handle TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    num_employees INTEGER,
    description TEXT, 
    logo_url TEXT
  )`)
});

beforeEach(async () => {
// seed with some data
await db.query(`INSERT INTO companies (
   handle,
   name,
   num_employees,
   description,
   logo_url) 
  VALUES ('AAPL','Apple Inc','10000','Computer maker','www.apple.com') 
  `);

await db.query(`INSERT INTO companies (
  handle,
  name,
  num_employees,
  description,
  logo_url) 
 VALUES ('DPW','Digital Power Corp','10','Snake oil salesmen','www.dpw.com') 
 `);
});

afterEach(async () => {
await db.query("DELETE FROM companies");
});

afterAll(async () => {
await db.query("DROP TABLE companies");
db.end();
});

//test for handling main page for pulling all company info
describe("GET /", () => {
  test("It should respond with an array of companies", async () => {
    const response = await request(app).get("/companies");
    expect(response.body).toEqual(
      {
        "company": [
          {
            "description": "Computer maker", 
            "handle": "AAPL", 
            "logo_url": "www.apple.com", 
            "name": "Apple Inc", 
            "num_employees": 10000
          }, 
          {
            "description": "Snake oil salesmen", 
            "handle": "DPW", 
            "logo_url": "www.dpw.com", 
            "name": "Digital Power Corp", 
            "num_employees": 10
          }
        ]
      }
  );
    expect(response.statusCode).toBe(200);
  });
});

//test for adding a company
describe("POST /", () => {
  test("It should respond with the new company added", async () => {
    const response = await request(app).post("/companies").send(
          {
              "handle": "TSLA",
              "name":"Tesla, Inc.",
              "num_employees": 2000,
              "description": "FUNDING SECURED",
              "logo_url": "www.FUNDINGSECURED.com"
          }
    );
    expect(response.body).toEqual({
      "company": 
          {
            "handle": "TSLA",
            "name":"Tesla, Inc.",
            "num_employees": 2000,
            "description": "FUNDING SECURED",
            "logo_url": "www.FUNDINGSECURED.com"
          }
  });
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with an error for schema validation", async () => {
    const response = await request(app).post("/companies").send(
          {
            "handle": 2342342,
            "name":"Tesla, Inc.",
            "num_employees": 2000,
            "description": "FUNDING SECURED",
            "logo_url": "www.FUNDINGSECURED.com"
          }
    );
    expect(response.body).toEqual({"error": ["instance.handle is not of a type(s) string"]}
    );
    expect(response.statusCode).toBe(500);
  });

});

//test for viewing a single company
describe("GET /", () => {
  test("It should respond with an array of companies", async () => {
    const response = await request(app).get("/companies/aapl");
    expect(response.body).toEqual(
      {
        "company": 
          {
            "description": "Computer maker", 
            "handle": "AAPL", 
            "logo_url": "www.apple.com", 
            "name": "Apple Inc", 
            "num_employees": 10000
          }
      }
  );
    expect(response.statusCode).toBe(200);
  });
});

//test for updating several fields in a company
describe("PATCH /", () => {
  test("It should edit a company", async () => {
    const response = await request(app).patch("/companies/aapl").send(
          {
              "name":"FUNDING SECURED",
              "num_employees": 2000000,
              "description": "FUNDING SECURED",
              "logo_url": "www.FUNDINGSECURED.com"
          }
    );
    expect(response.body).toEqual({
      "company": 
          {
            "handle": "AAPL",
            "name":"FUNDING SECURED",
            "num_employees": 2000000,
            "description": "FUNDING SECURED",
            "logo_url": "www.FUNDINGSECURED.com"
          }
  });
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with an error for schema validation", async () => {
    const response = await request(app).patch("/companies/aapl").send(
          {
            "num_employees": "FIVEMILLION",
          }
    );
    expect(response.body).toEqual({"error": ["instance.num_employees is not of a type(s) integer"]}
    );
    expect(response.statusCode).toBe(500);
  });
});

//test for deleting a company
describe("DELETE /", () => {
  test("It should delete a company", async () => {
    const response = await request(app).delete("/companies/aapl");
    expect(response.body).toEqual({"message":"Company deleted"})
    expect(response.statusCode).toBe(200);
  });

  test("It should return invalid for unidentified company", async () => {
    const response = await request(app).delete("/companies/SADFSDF");
    expect(response.body).toEqual({"error": {"status": 404}, "message": "Not Found"})
    expect(response.statusCode).toBe(404);
  });
});