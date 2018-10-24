process.env.NODE_ENV='test'
const db = require("../../db");
const request = require("supertest");
const app = require("../../app");

const Company = require('../../models/companyModels')

/***********************************/
/** setup and teardown */

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

// seed with some data
beforeEach(async () => {
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

/***********************************/
/** TEST: findAll() */

describe("findAll()", () => {
  // test find all companies
  it("should generate a list of all companies",
    async function () {

    const response = await Company.findAll();
    expect(response).toEqual(
      [
        {
          "description": "Computer maker",
          "handle": "AAPL",
          "logo_url": "www.apple.com",
          "name": "Apple Inc",
          "num_employees": 10000,
        },
        {
          "description": "Snake oil salesmen",
          "handle": "DPW",
          "logo_url": "www.dpw.com",
          "name": "Digital Power Corp",
          "num_employees": 10,
        }
      ]
    );
    expect(response.length).toBe(2)
  });

  // test find all companies filtered by search query
  it("should generate a list of companies based off 'pple' search parameter",
    async function () {
      const response = await Company.findAll(0,99000,'pple');
      expect(response).toEqual(
        [{
          "description": "Computer maker",
          "handle": "AAPL",
          "logo_url": "www.apple.com",
          "name": "Apple Inc",
          "num_employees": 10000,
        }]
      );
      expect(response.length).toBe(1)
  });

  // test all companies filtered by number of employees
  it("should generate a list of companies based off employees search parameter",
    async function () {

    const response = await Company.findAll(900);
    expect(response).toEqual(
      [{
        "description": "Computer maker",
         "handle": "AAPL",
        "logo_url": "www.apple.com",
         "name": "Apple Inc",
        "num_employees": 10000,
       }]
    );
    expect(response.length).toBe(1)
  });
});


/***********************************/
/** TEST: updateCompany() */

describe('updateCompany()', () => {
  // test updating all fields for company
  it("Should return JSON containing the new company data, updating all",
    async function() {
      let handle = 'aapl'
      let data = {
        "name": "Apple Inc.",
        "num_employees": 25000,
        "description": "Electronics and Computing company",
        "logo_url": "www.apple.com/logo.png"
      }

      const response = await Company.updateCompany(handle, data);
      expect(response).toEqual({
        "handle": "AAPL",
        "name": "Apple Inc.",
        "num_employees": 25000,
        "description": "Electronics and Computing company",
        "logo_url": "www.apple.com/logo.png"
      });
    }
  );

  // test updating some fields for company
  it("Should return JSON containing the new company data, updating some",
    async function() {
      let handle = 'aapl'
      let data = {
        "name": "Apple Corporation",
        "num_employees": 40000
      }

      const response = await Company.updateCompany(handle, data);
      expect(response).toEqual({
        "handle": "AAPL",
        "name": "Apple Corporation",
        "num_employees": 40000,
        "description": "Computer maker",
        "logo_url": "www.apple.com"
      });
    }
  );
})

