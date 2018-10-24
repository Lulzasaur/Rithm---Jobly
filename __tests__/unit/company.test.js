process.env.NODE_ENV='test'
const db = require("../../db");
const request = require("supertest");
const app = require("../../app");

const Company = require('../../models/companyModels')

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

describe("findAll()", () => {
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

  it("should generate a list of companies based off empoyees search parameter",
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

