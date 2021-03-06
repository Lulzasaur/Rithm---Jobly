process.env.NODE_ENV='test';
const db = require("../../db");

const Company = require('../../models/companyModels')



const AAPL_DATA = {
  "handle": "AAPL",
  "name": "Apple Inc",
  "num_employees": 10000,
  "description": "Computer maker",
  "logo_url": "www.apple.com",
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

  await db.query(`CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    salary FLOAT NOT NULL,
    equity FLOAT NOT NULL CHECK (equity<1), 
    company_handle TEXT REFERENCES companies(handle),
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
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

  await db.query(`INSERT INTO jobs (
    id,
    title,
    salary,
    equity,
    company_handle,
    date_posted)
    VALUES (2,'ceo','500000','.5','AAPL','2018-10-26T04:16:17.759Z') 
  `);

  await db.query(`INSERT INTO jobs (
    id,
    title,
    salary,
    equity,
    company_handle,
    date_posted)
    VALUES (3,'janitor','900000','0.9','DPW','2018-10-26T04:16:17.759Z') 
  `);

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


/***********************************/
/** TEST: getAll() */

describe("getAll()", () => {
  it("should return a list of all companies",
    async function () {

    const response = await Company.getAll();
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

  it("should return a list of companies filtered by search query 'pple'",
    async function () {
      const response = await Company.getAll(0,99000,'pple');
      expect(response).toEqual(
        [AAPL_DATA]
      );
      expect(response.length).toBe(1)
  });

  it("should return a list of companies filtered by number of employees",
    async function () {

    const response = await Company.getAll(900);
    expect(response).toEqual(
      [AAPL_DATA]
    );
    expect(response.length).toBe(1)   // DEC desn't have employees
  });

  it("Should throw a 400 error when max_employees < min_employees",
    async function() {
      Company.getAll(1000,20)
      .then(res => {
        console.log("This should have returned an error");
      })
      .catch(err => {
        expect(err.status).toEqual(400);
      })
    }  
  )
});


/***********************************/
/** TEST: getOne() */

describe('getOne()', () => {
  // test get company, with existing company handle
  it("Should return an object containing the selected company's details",
    async function() {
      let handle = 'aapl';
      const response = await Company.getOne(handle);

      expect(response).toEqual(AAPL_DATA);
    }
  );

  // test get company, with not existing company handle
  it("Should return a 404 error",
    async function() {
      let handle = 'something fake';
      Company.getOne(handle)
      .then(res => {
        expect(res).toEqual(AAPL_DATA);
      })
      .catch(err => {
        expect(err.status).toBe(404);
      }); 
    }
  );
});


/***********************************/
/** TEST: create() */

describe('create()', () => {
  it("Should insert a new company in database and return the newly created company details",
    async function() {

      //create(handle,name,numEmployees,description,logoURL)
      let data = {
        "handle": "SKIS",
        "name": "Peak Resorts Inc.",
        "num_employees": 650,
        "description": "Snowsports Resort Corporation",
        "logo_url": "https://www.newenglandskihistory.com/skiareamanagement/logopeakresorts.jpg"
      };

      let { handle, name, num_employees, description, logo_url } = data;

      Company.create(handle, name, num_employees, description, logo_url)
      .then(res => {
        expect(res).toEqual(data);
      })
      .catch(err => {
        expect(err.status).toBe(404);
      })
    } 
  );


  // test for create with missing non-required data
  it("Should insert a new company with missing values as null",
    async function() {
      let data = {
        "handle": "DELT",
        "name": "Delta Technology Holdings Ltd",
      };

      let { handle, name, num_employees, description, logo_url } = data;

      Company.create(handle, name, num_employees, description, logo_url)
      .then(res => {
        expect(res).toEqual({
          "handle": "DELT",
          "name": "Delta Technology Holdings Ltd",
          "num_employees": null,
          "description": null,
          "logo_url": null
        });
      })
      .catch(err => {
        expect(err.status).toBe(404);
      })
      //create(handle,name,numEmployees,description,logoURL) 
    } 
  );

  // test for create with invalid data
  it("Should throw 400 because of invalid data",
    async function() {
      let data = {
        "handle": "AAPL",
        "invalid": "This field does not hav a valid key"
      };

      let { handle, name, num_employees, description, logo_url } = data;

      Company.create(handle, name, num_employees, description, logo_url)
      .then(res => {
        console.log("This should have thrown an error", res);
      })
      .catch(err => {
        expect(err.status).toEqual(400);
      })
    }
  )
})



/***********************************/
/** TEST: update() */

describe('update()', () => {

  // test for ALL fields
  it("Should return JSON containing the new company data, updating ALL fields",
    async function() {
      let handle = 'aapl'
      let data = {
        "name": "Apple Inc.",
        "num_employees": 25000,
        "description": "Electronics and Computing company",
        "logo_url": "www.apple.com/logo.png"
      }

      Company.update(handle, data)
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
        expect(err.status).toBe(404);
      });
    }
  );

  // test SOME fields for company
  it("Should return JSON containing the new company data, updating SOME fields",
    async function() {
      let handle = 'aapl'
      let data = {
        "name": "Apple Corporation",
        "num_employees": 40000
      }

      Company.update(handle, data)
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
        expect(err.status).toEqual(404);
      });
    }
  );

  // test for not existing company handle
  it("Should return 404 error",
    async function() {
      let handle = 'something fake'
      let data = {
        "name": "Apple Corporation",
        "num_employees": 40000
      }

      Company.update(handle, data)
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
        expect(err.status).toBe(404);
      });
    }
  );

  it("Should throw a 404 error",
  async function() {
    let handle = 'aapl';
    let data = {
      "_name": "Apple Corporation",
      "_num_employees": 40000
    };

    Company.update(handle, data)
    .then(res => {
      console.log('This should throw an error');
    })
    .catch(err => {
      expect(err.status).toEqual(400);
    })
  })
});




/*******************/
/** TEST: delete() */

describe('delete()', () => {
  // test for delete with existing company handle
  it("Should return the handle that was deleted",
    async function() {
      let handle = 'AAPL';

      Company.delete(handle)
      .then(res => {
        expect(res).toEqual({handle});
      })
      .catch(err => {
        expect(err.status).toBe(404);
      });
    }
  );

  // test for not existing company handle
  it("Should throw a 404 error",
    async function() {
      let handle = 'something fake';

      Company.delete(handle)
      .then(res => {
        expect(res).toEqual(handle);
      })
      .catch(err => {
        expect(err.status).toBe(404);
      });
    }
  );
});


/*******************/
/** TEST: getJobs() */

describe('getJobs()', () => {
  it("Should return an array of jobs for AAPL",
    async function() {
      let handle = 'AAPL';

      Company.getJobs(hanlde)
      .then(res => {
        console.log(res);
        expect(res.status).toEqual(200);
      })
      .catch(err) {
        expect(err.status).toEqual(404);
      }
    }  
  )
});