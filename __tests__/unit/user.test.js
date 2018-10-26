process.env.NODE_ENV='test';
const db = require("../../db");

const User = require('../../models/userModels')

const penguinFull = {
  "email": "penguins@penguin.com",
  "first_name": "penguin", 
  "is_admin": false, 
  "last_name": "man", 
  "photo_url": "penguin.photo.com", 
  "username": "penguin_man"
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
    company_handle TEXT REFERENCES companies(handle) ON DELETE CASCADE,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
  )`)

  await db.query(`CREATE TABLE users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    photo_url TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT false
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

  await db.query(`INSERT INTO users (
    username,
    password,
    first_name,
    last_name,
    email,
    photo_url,
    is_admin)
    VALUES ('penguin_man','penguin','penguin','man','penguins@penguin.com','penguin.photo.com',false)
  `);

  await db.query(`INSERT INTO users (
    username,
    password,
    first_name,
    last_name,
    email,
    photo_url,
    is_admin)
    VALUES ('kiwi_man','kiwi','kiwi','man','kiwis@penguin.com','kiwi.photo.com',false)
  `);

});

afterEach(async () => {
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM jobs");
  await db.query("DELETE FROM companies");
});

afterAll(async () => {
  await db.query("DROP TABLE users");
  await db.query("DROP TABLE jobs");
  await db.query("DROP TABLE companies");
  db.end();
});


/***********************************/
/** TEST: getAll() */

describe("getAll()", () => {
  it("should return a list of all users",
    async function () {
    const response = await User.getAll();
    expect(response).toEqual(
      [
          {
            "email": "penguins@penguin.com", 
            "first_name": "penguin", 
            "last_name": "man", 
            "username": "penguin_man"
        }, 
        {
            "email": "kiwis@penguin.com", 
            "first_name": "kiwi", 
            "last_name": "man", 
            "username": "kiwi_man"
        }
      ]
    );
    expect(response.length).toBe(2)
  });
});


/***********************************/
/** TEST: individual user */

describe('getOne()', () => {
  // test get user, with existing username
  it("Should return an object containing the selected user's details",
    async function() {
      let username = 'penguin_man';
      const response = await User.getOne(username);

      expect(response).toEqual(penguinFull);
    }
  );

  // test get user, with not existing user id
  it("Should return a 404 error",
    async function() {
      let username = 'noonebody';
     User.getOne(username)
      .then(res => {
        expect(res).toEqual();
      })
      .catch(err => {
        expect(err.status).toBe(404);
      }); 
    }
  );
});


// /***********************************/
// /** TEST: create a user */

describe('create()', () => {
  it("Should insert a new user in database and return the newly created user details",
    async function() {

        //create(title, salary, equity, company_handle)
        let data = {
          username: "BROGRAMMER",
          password:'bros',
          first_name:'bro',
          last_name: 'grammer',
          email:'brogrammer@penguin.com',
          photo_url:'brogrammer.com',
          is_admin:'true'
        };

        let { username,password,first_name,last_name,email,photo_url,is_admin } = data;
     
      await User.create(username,password,first_name,last_name,email,photo_url,is_admin)
        .then(res => {
          expect(res).toEqual({ 
            username: "brogrammer",
            password:'bros',
            first_name:'bro',
            last_name: 'grammer',
            email:'brogrammer@penguin.com',
            photo_url:'brogrammer.com',
            is_admin:true
          });
        })
      } 
    );

  // test for create with missing non-required data
  it("Should throw an error as we have missing data",
    async function() {
      let data = {
          username: "BROGRAMMER",
          password:'bros',
          first_name:'bro',
          email:'brogrammer@penguin.com',
          photo_url:'brogrammer.com',
          is_admin:'true'
      };

      let { username,password,first_name,email,photo_url,is_admin } = data;

      await User.create(username,password,first_name,email,photo_url,is_admin)
        .then(res => 
          'Should throw an error')      
        .catch(err => {
          expect(err.status).toEqual(400);
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

    await User.create(handle, name, num_employees, description, logo_url)
      .then(res => {
        console.log("This should have thrown an error", res);
      })
      .catch(err => {
        expect(err.status).toEqual(400);
      })
    }
  )
})

// /***********************************/
// /** TEST: update user */

describe('update()', () => {

  // test for ALL fields
  it("Should return JSON containing the new user data, updating ALL fields",
    async function() {
      let username = 'kiwi_man'
      let data = {
        username: "not_kiwi",
        password:'bros',
        first_name:'bro',
        last_name: 'grammer',
        email:'brogrammer@penguin.com',
        photo_url:'brogrammer.com',
        is_admin:true
      }

      User.update(username, data)
      .then(res => {
        expect(res).toEqual(data)
      })
    }
  );

//   // test SOME fields for user
  it("Should return JSON containing the new user data, updating SOME fields",
    async function() {
      let username = 'kiwi_man'
      let data = {
        last_name: 'kiwi_bro'
      }

      User.update(username, data)
      .then(res => {
        expect(res.username).toEqual(username)
        expect(res.last_name).toEqual(data.last_name)
      })
    }
  );

//   // test for not existing user id
  it("Should return 404 error",
    async function() {
      let username = 'blabhlabhalb'
      let data = {
        username: "aapl"
      }

      User.update(username, data)
      .then(res => {
        expect(res).toEqual('there should be an error')
      })
      .catch(err => {
        expect(err.status).toBe(404);
      });
    }
  );
});

// // /***********************************/
// // /** TEST: delete user */

describe('delet user()', () => {
  // test for delete with existing username
  it("Should return the username that was deleted",
    async function() {
      let username = 'kiwi_man';

      User.delete(username)
      .then(res => {
        expect(res).toEqual({username});
      })
      .catch(err => {
        expect(err.status).toBe(404);
      });
    }
  );

  // test for not existing username
  it("Should throw a 404 error",
    async function() {
      let username = 'asdkfljasdflk';

      User.delete(username)
      .then(res => {
        expect(res).toEqual(username);
      })
      .catch(err => {
        expect(err.status).toBe(404);
      });
    }
  );
});
