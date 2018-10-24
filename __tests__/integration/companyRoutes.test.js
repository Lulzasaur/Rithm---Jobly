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

