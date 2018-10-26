process.env.NODE_ENV='test'
const db = require("../../db");
const request = require("supertest");
const app = require("../../app");



const AAPL_JOB = {
	id: 1,
	title: "ceo",
	salary: 210 * 1000,
	equity: 0.7,
	company_handle: "aapl"
};

const DPW_JOB = {
	id: 2,
	title: "cto",
	salary: 120 * 1000,
	equity: 0.3,
	company_handle: "dpw",
};


// set up table
beforeAll(async () => {
  
	await db.query(`CREATE TABLE companies (
		handle TEXT PRIMARY KEY,
		name TEXT NOT NULL UNIQUE,
		num_employees INTEGER,
		description TEXT, 
    logo_url TEXT)`
  );
  
	await db.query(`CREATE TABLE jobs (
			id SERIAL PRIMARY KEY,
			title TEXT NOT NULL,
			salary FLOAT NOT NULL,
			equity FLOAT NOT NULL CHECK (equity<1), 
			company_handle TEXT REFERENCES companies(handle) ON DELETE CASCADE,
			date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
	);
});


beforeEach(async () => {
  await db.query(`INSERT INTO companies (
    handle,
    name,
    num_employees,
    description,
    logo_url) 
    VALUES ('aapl','Apple Inc','10000','Computer maker','www.apple.com')`
  );

  await db.query(`INSERT INTO companies (
    handle,
    name,
    num_employees,
    description,
    logo_url) 
    VALUES ('dpw','Digital Power Corp','10','Snake oil salesmen','www.dpw.com')`
  );

  await db.query(
    `INSERT INTO jobs (id, title,salary,equity,company_handle)
    VALUES (2, $1, $2, $3, $4)`,
    [AAPL_JOB.title, AAPL_JOB.salary, AAPL_JOB.equity, AAPL_JOB.company_handle]
  );

  await db.query(
    `INSERT INTO jobs (id, title,salary,equity,company_handle)
    VALUES (3, $1, $2, $3, $4)`,
    [DPW_JOB.title, DPW_JOB.salary, DPW_JOB.equity, DPW_JOB.company_handle]
  );
});


afterEach(async () => {
  await db.query("DELETE FROM jobs");
  await db.query("DELETE FROM companies");
});

afterAll(async () => {
  await db.query("DROP TABLE jobs");
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
            "handle": "aapl", 
            "logo_url": "www.apple.com", 
            "name": "Apple Inc", 
            "num_employees": 10000
          }, 
          {
            "description": "Snake oil salesmen", 
            "handle": "dpw", 
            "logo_url": "www.dpw.com", 
            "name": "Digital Power Corp", 
            "num_employees": 10
          }
        ]
      }
    );
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with an error", async () => {
    const response = await request(app).get("/companies?minEmployees=100&maxEmployees=0");
    expect(response.body).toEqual(
      {"error": 
        {"status": 400},
        "message": "Max employees is greater than Min employees"
      }
  );
    expect(response.statusCode).toBe(400);
  });
});

//test for adding a company
describe("POST /", () => {
  test("It should respond with the new company added", async () => {
    const response = await request(app).post("/companies").send(
          {
              // "add_at": expect.any(Date),
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
            "handle": "tsla",
            "name":"tesla, inc.",
            "num_employees": 2000,
            "description": "FUNDING SECURED",
            "logo_url": "www.fundingsecured.com"
          }
    });
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with an error for schema validation", async () => {
    const response = await request(app).post("/companies").send(
          {
            "handle": 2342342,
            "name":"tesla, inc.",
            "num_employees": 2000,
            "description": "FUNDING SECURED",
            "logo_url": "www.fundingsecured.com"
          }
    );
    expect(response.body).toEqual({"error": ["instance.handle is not of a type(s) string"]}
    );
    expect(response.statusCode).toBe(500);
  });

  test("It should respond with an error", async () => {
    const response = await request(app).post("/companies").send(
      {
        "description": "Computer maker", 
        "handle": "aapl", 
        "logo_url": "www.apple.com", 
        "name": "Apple Inc", 
        "num_employees": 10000
      }
  );
    expect(response.body).toEqual(
      {"error": 
        {"code": "23505", 
        "constraint": "companies_pkey", 
        "detail": "Key (handle)=(aapl) already exists.", 
        "file": "nbtinsert.c", 
        "length": 199, 
        "line": "434", 
        "name": "error", 
        "routine": "_bt_check_unique", 
        "schema": "public", 
        "severity": "ERROR", 
        "table": "companies"
      }, 
        "message": "duplicate key value violates unique constraint \"companies_pkey\""
      }
  );
    expect(response.statusCode).toBe(500);
  });

});

//test for viewing a single company
describe("GET /:handle", () => {
  test("It should respond with a company", async () => {
    const response = await request(app).get("/companies/aapl");

    expect(response.body.company.handle).toEqual('aapl');
    expect(response.body.company.logo_url).toEqual('www.apple.com');
    expect(response.body.company.name).toEqual('Apple Inc');
    expect(response.body.company.jobs[0].company_handle).toEqual('aapl');
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with an error", async () => {
    const response = await request(app).get("/companies/DSFSD");
    expect(response.body).toEqual(
      {
        "error": {"status": 404}, 
        "message": "No such company"
      }
  );
    expect(response.statusCode).toBe(404);
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
            "handle": "aapl",
            "name":"FUNDING SECURED",
            "num_employees": 2000000,
            "description": "FUNDING SECURED",
            "logo_url": "www.FUNDINGSECURED.com"
          }
  });
    expect(response.statusCode).toBe(200);
  });

  test("It should respond with an error", async () => {
    const response = await request(app).patch("/companies/SDAF").send(
          {
              "name":"FUNDING SECURED",
              "num_employees": 2000000,
              "description": "FUNDING SECURED",
              "logo_url": "www.FUNDINGSECURED.com"
          }
    );
    expect(response.body).toEqual(
      {
        "error": {"status": 404}, 
        "message": "No such company"
    });
    expect(response.statusCode).toBe(404);
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
    expect(response.body).toEqual({"error": {"status": 404}, "message": "No such company"})
    expect(response.statusCode).toBe(404);
  });
});

//test for unhandled route
describe("/asdfasd", () => {
  test("It should throw an error", async () => {
    const response = await request(app).get("/asdfasfd");
    expect(response.body).toEqual(
      {
        "error": {"status": 404}, 
        "message": "Not Found"
      }
  );
    expect(response.statusCode).toBe(404);
  });
});