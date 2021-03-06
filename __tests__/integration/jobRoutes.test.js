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

/***********************/
/** SETUP and TEARDOWN */

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
			company_handle TEXT REFERENCES companies(handle),
			date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
	);
});

beforeEach(async () => {
// seed with some data

  await db.query(`INSERT INTO companies (
    handle,
    name,
    num_employees,
    description,
    logo_url) 
    VALUES ('aapl','Apple Inc','10000','Computer maker','www.apple.com') `
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

/*****************/
/** GET all jobs */

//test for handling main page for pulling all company info
describe("GET /", () => {

	test("Sould respond with object with array of jobs", async() => {
		const response = await request(app).get('/jobs');


    expect(response.status).toEqual(200);
		expect(response.body.jobs.length).toEqual(2);
		expect(response.body.jobs[0].company_handle).toEqual(AAPL_JOB.company_handle);
		expect(response.body.jobs[1].company_handle).toEqual(DPW_JOB.company_handle);
	});
});

/****************/
/** GET a job */

describe("GET /jobs", () => {

	test("Should respond with an object of job details", async() => {
		let jobID = 2;
		const response = await request(app).get(`/jobs/${jobID}`);

		expect(response.status).toEqual(200);
		expect(response.body.job.id).toEqual(jobID);
		expect(response.body.job.company_handle).toEqual(AAPL_JOB.company_handle);
		expect(response.body.job.title).toEqual(AAPL_JOB.title);
  });
  

  test("Should respond with 404 Error: No such job", async() => {
    let jobID = 11111;
    const response = await request(app).get(`/jobs/${jobID}`);

    expect(response.status).toEqual(404);
    expect(response.body.message).toEqual('No such job');
  });
});

/*******************/
/** POST a new job */

describe('POST /jobs', () => {

	test("Should respond with the new job fields", async() => {
		let data = {
			title: "cfo",
			salary: 115000,
			equity: 0.4,
			company_handle: 'aapl'
		}

    const response = await request(app).post('/jobs').send(data);

		expect(response.status).toEqual(200);
		expect(response.body.job.title).toEqual(data.title);
		expect(response.body.job.salary).toEqual(data.salary);
		expect(response.body.job.equity).toEqual(data.equity);
		expect(response.body.job.company_handle).toEqual(data.company_handle);
  });
  
  test("Should respond with error 500 error", async() => {
    let data = {
      title: 4,
      salary: "no",
      equality: "of course"
    }

    const response = await request(app).post('/jobs').send(data);

    expect(response.status).toEqual(500);
  });
});

/*******************/
/** UPDATE a job */

describe('PATCH /jobs/:id', () => {
	test("Should respond with the updated job fields", async() => {
		let id = 2;
		let data = {
			title: 'Software engineer',
			salary: 90000
		};

    const response = await request(app).patch(`/jobs/${id}`).send(data);
    
		expect(response.status).toEqual(200);
		expect(response.body.job.title).toEqual(data.title);
		expect(response.body.job.salary).toEqual(data.salary);
  });


  test("Should respond with 500 error", async() => {
		let id = 2;
		let data = {
			titles: 'Software engineer',
			saladry: 90000
		};

    const response = await request(app).patch(`/jobs/${id}`).send(data);
    
		expect(response.status).toEqual(500);
	});
	

  test("Should respond with 400 error", async() => {
		let id = 2;
		let data = {
			titles: 100,
			_saladry: "90000"
		};

    const response = await request(app).patch(`/jobs/${id}`).send(data);
    
		expect(response.status).toEqual(500);
  });
});

/*******************/
/** DELETE a job */

describe('DELETE /jobs/:id', () => {
	test("Should respond with a message 'Job deleted'", async() => {
		let id = 2;

		const response = await request(app).delete(`/jobs/${id}`);

		expect(response.body.message).toEqual('Job deleted');
		expect(response.status).toEqual(200);
  });
  
  test("Should respond with a message 'No such job'", async() => {
		let id = 1;

		const response = await request(app).delete(`/jobs/${id}`);

		expect(response.body.message).toEqual('No such job');
		expect(response.status).toEqual(404);
	});
})
