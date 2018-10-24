process.env.NODE_ENV='test'
const db = require("../../db");
const request = require("supertest");
const app = require("../../app");

const Company = require('../../models/companyModels')



const AAPL_DATA = {
  "handle": "AAPL",
  "name": "Apple Inc",
  "num_employees": 10000,
  "description": "Computer maker",
  "logo_url": "www.apple.com"
}

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
        AAPL_DATA,
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
        [AAPL_DATA]
      );
      expect(response.length).toBe(1)
  });

  // test all companies filtered by number of employees
  it("should generate a list of companies based off employees search parameter",
    async function () {

    const response = await Company.findAll(900);
    expect(response).toEqual(
      [AAPL_DATA]
    );
    expect(response.length).toBe(1)
  });
});


/***********************************/
/** TEST: getCompany() */

describe('getCompany()', () => {
  // test get company, with existing company handle
  it("Should return an object containing the selected company's details",
    async function() {
      let handle = 'aapl';
      const response = await Company.getCompany(handle);

      expect(response).toEqual(AAPL_DATA);
    }
  );

  // test get company, with not existing company handle
  it("Should return an object containing the selected company's details",
    async function() {
      let handle = 'something fake';
      Company.getCompany(handle)
      .then(res => {
        expect(res).toEqual(AAPL_DATA);
      })
      .catch(err => {
        expect(err.message).toEqual('Not Found')
      }); 
    }
  );
});


/***********************************/
/** TEST: createCompany() */

describe('createCompany()', () => {
  // test for create with valid data


  // test for create with missing data


  // test for create with invalid data
})



/***********************************/
/** TEST: updateCompany() */

describe('updateCompany()', () => {

  // test for ALL fields for company
  it("Should return JSON containing the new company data, updating all",
    async function() {
      let handle = 'aapl'
      let data = {
        "name": "Apple Inc.",
        "num_employees": 25000,
        "description": "Electronics and Computing company",
        "logo_url": "www.apple.com/logo.png"
      }

      Company.updateCompany(handle, data)
      .then(res => {
        expect(res).toEqual({
          "handle": "AAPL",
          "name": "Apple Inc.",
          "num_employees": 25000,
          "description": "Electronics and Computing company",
          "logo_url": "www.apple.com/logo.png"
        })
      })
      .catch(err => {
        expect(err.message).toEqual('Not Found')
      });
    }
  );

  // test SOME fields for company
  it("Should return JSON containing the new company data, updating some",
    async function() {
      let handle = 'aapl'
      let data = {
        "name": "Apple Corporation",
        "num_employees": 40000
      }

      Company.updateCompany(handle, data)
      .then(res => {
        expect(res).toEqual({
          "handle": "AAPL",
          "name": "Apple Corporation",
          "num_employees": 40000,
          "description": "Computer maker",
          "logo_url": "www.apple.com"
        })
      })
      .catch(err => {
        expect(err.message).toEqual('Not Found')
      });
    }
  );

  // test for not existing company handle
  it("Should return JSON containing the new company data, updating some",
    async function() {
      let handle = 'something fake'
      let data = {
        "name": "Apple Corporation",
        "num_employees": 40000
      }

      Company.updateCompany(handle, data)
      .then(res => {
        expect(res).toEqual({
          "handle": "AAPL",
          "name": "Apple Corporation",
          "num_employees": 40000,
          "description": "Computer maker",
          "logo_url": "www.apple.com"
        })
      })
      .catch(err => {
        expect(err.message).toEqual('Not Found')
      });
    }
  );
});




/***********************************/
/** TEST: deleteCompany() */

describe('deleteCompany()', () => {
  // test for delete with existing company handle
  it("Should return a message: \"Company deleted\"",
    async function() {
      let handle = 'aapl';

      Company.deleteCompany(handle)
      .then(res => {
        expect(res.message).toEqual(handle);
      })
      .catch(err => {
        expect(err.message).toEqual('Not Found');
      });
    }
  );

  // test for not existing company handle
  it("Should throw a 404 Not Found error",
    async function() {
      let handle = 'something fake';

      Company.deleteCompany(handle)
      .then(res => {
        expect(res).toEqual(handle);
      })
      .catch(err => {
        expect(err.message).toEqual('Not Found');
      });
    }
  );
});

