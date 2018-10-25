process.env.NODE_ENV='test';
const db = require("../../db");

const Job = require('../../models/jobModels')

const DPW =  [
  {
    "company_handle": "dpw",
    "title": "janitor"
  }
]

const DPWfull = {
  "company_handle": "dpw", 
  "equity": 0.9, 
  "id": 3, 
  "salary": 900000, 
  "title": "janitor"
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
    VALUES ('aapl','Apple Inc','10000','Computer maker','www.apple.com') 
  `);

  await db.query(`INSERT INTO companies (
    handle,
    name,
    num_employees,
    description,
    logo_url) 
    VALUES ('dpw','Digital Power Corp','10','Snake oil salesmen','www.dpw.com') 
  `);

  await db.query(`INSERT INTO jobs (
    id,
    title,
    salary,
    equity,
    company_handle,
    date_posted)
    VALUES (2,'ceo','500000','.5','aapl','2018-10-26T04:16:17.759Z') 
  `);

  await db.query(`INSERT INTO jobs (
    id,
    title,
    salary,
    equity,
    company_handle,
    date_posted)
    VALUES (3,'janitor','900000','0.9','dpw','2018-10-26T04:16:17.759Z') 
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
/** TEST: findAll() */

describe("getAll()", () => {
  it("should return a list of all jobs",
    async function () {
    const response = await Job.getAll();
    expect(response).toEqual(
      [
        {
          "company_handle": "aapl", 
          "title": "ceo"
        }, 
        {
          "company_handle": "dpw",
          "title": "janitor"
        }
      ]
    );
    expect(response.length).toBe(2)
  });

  it("should return a list of jobs filtered by search query 'anit'",
    async function () {
      const response = await Job.getAll(0,0,'anit');
      expect(response).toEqual(
        DPW
      );
      expect(response.length).toBe(1)
  });

  it("should return a list of jobs filtered by salary",
    async function () {

    const response = await Job.getAll(600000);
    expect(response).toEqual(
      DPW
    );
    expect(response.length).toBe(1)   // DEC desn't have employees
  });

  it("Should throw a 400 error when salary is less than 0",
    async function() {
      Job.getAll(-1000)
      .then(res => {
        console.log("This should have returned an error");
      })
      .catch(err => {
        expect(err.status).toEqual(400);
      })
    }  
  )

  it("should return a list of jobs filtered by equity",
    async function () {

    const response = await Job.getAll(0,0.6);
    expect(response).toEqual(
      DPW
    );
    expect(response.length).toBe(1)   // DEC desn't have employees
  });

  it("Should throw a 400 error when equity is less than 0",
    async function() {
      Job.getAll(0,-0.1)
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
/** TEST: getCompany() */

describe('getOne()', () => {
  // test get job, with existing job id
  it("Should return an object containing the selected job's details",
    async function() {
      let id = 3;
      const response = await Job.getOne(id);

      expect(response).toEqual(DPWfull);
    }
  );

  // test get job, with not existing job id
  it("Should return a 404 error",
    async function() {
      let id = 192;
      Job.getOne(id)
      .then(res => {
        expect(res).toEqual();
      })
      .catch(err => {
        expect(err.status).toBe(404);
      }); 
    }
  );
});


/***********************************/
/** TEST: createCompany() */

describe('create()', () => {
  it("Should insert a new job in database and return the newly created job details",
    async function() {

        //create(title, salary, equity, company_handle)
        let data = {
          title: "BROGRAMMER",
          salary: 40,
          equity: .2,
          company_handle: "aapl"
        };

        let { title, salary, equity, company_handle } = data;
     
        Job.create(title, salary, equity,company_handle)
        .then(res => {
          expect(res).toEqual({ 
            title: 'brogrammer',
            salary: 40,
            equity: 0.2,
            company_handle: 'aapl' 
          });
        })
        .catch(err => {
          expect(err.status).toBe(404);
        })
      } 
    );

  // test for create with missing non-required data
  it("Should insert a new job with missing values as null",
    async function() {
      let data = {
        title: 'brogrammer',
        salary: 40,
        equity: 0.2,
      };

      let { title,salary } = data;

      Job.create(title,salary)
      .then(res => {
        expect(res).toEqual({
          title: 'brogrammer',
          salary: 40,
          equity: 0.2,
        });
      })
      .catch(err => {
        expect(err.status).toBe(400);
      })
    } 
  );

  // test for create with invalid data
  it("Should throw 400 because of TOTALLY invalid data",
    async function() {
      let data = {
        "handle": "AAPL",
        "invalid": "This field does not hav a valid key"
      };

      let { handle, name, num_employees, description, logo_url } = data;

      Job.create(handle, name, num_employees, description, logo_url)
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
/** TEST: updateCompany() */

describe('update()', () => {

  // test for ALL fields
  it("Should return JSON containing the new job data, updating ALL fields",
    async function() {
      let id = 3
      let data = {
        "company_handle": "aapl", 
        "equity": 0.2, 
        "salary": 400, 
        "title": "marketing janitor",
        "date_posted":'2018-10-26T11:16:17.759Z'
      }

      Job.update(id, data)
      .then(res => {
        expect(res.company_handle).toEqual(data.company_handle)
        expect(res.equity).toEqual(data.equity)
        expect(res.salary).toEqual(data.salary)
        expect(res.title).toEqual(data.title)
      })
    }
  );

  // test SOME fields for job
  it("Should return JSON containing the new job data, updating SOME fields",
    async function() {
      let id = 3
      let data = {
        "company_handle": "aapl"
      }

      Job.update(id, data)
      .then(res => {
        expect(res.id).toEqual(id)
        expect(res.company_handle).toEqual(data.company_handle)
      })
    }
  );

  // test for not existing job id
  it("Should return 404 error",
    async function() {
      let id = 9999
      let data = {
        "company_handle": "aapl"
      }

      Job.update(id, data)
      .then(res => {
        expect(res).toEqual('there should be an error')
      })
      .catch(err => {
        expect(err.status).toBe(404);
      });
    }
  );
});

// /***********************************/
// /** TEST: deleteCompany() */

describe('deleteJob()', () => {
  // test for delete with existing job id
  it("Should return the id that was deleted",
    async function() {
      let id = 2;

      Job.delete(id)
      .then(res => {
        expect(res).toEqual({id});
      })
      .catch(err => {
        expect(err.status).toBe(404);
      });
    }
  );

  // test for not existing company handle
  it("Should throw a 404 error",
    async function() {
      let id = 8347;

      Job.delete(id)
      .then(res => {
        expect(res).toEqual(id);
      })
      .catch(err => {
        expect(err.status).toBe(404);
      });
    }
  );
});
