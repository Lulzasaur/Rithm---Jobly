const db = require("../db");
const partialUpdate = require('../helpers/partialUpdate');

/** Collection of related methods for users. */

class User {

  /** Return all user data. 
   */

  static async getAll() {        
        let userRes = await db.query(
              `SELECT username, first_name, last_name, email
                  FROM users
              `)
        return userRes.rows;
  }

  /** Create a new user with the given details */

  static async create(username,password,first_name,last_name,email,photo_url,is_admin) {
    try{

      if (username === undefined || password === undefined || first_name === undefined
         || last_name === undefined || email === undefined || is_admin=== undefined) {
        let err = new Error('Incomplete or invalid data');
        err.status = 400;
        throw err;
      }

      let user = await db.query(
        `INSERT INTO users (username,password,first_name,last_name,email,photo_url,is_admin)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        RETURNING username,password,first_name,last_name,email,photo_url,is_admin
        `,[username.toLowerCase(),password,first_name.toLowerCase(),last_name.toLowerCase(),email.toLowerCase(),photo_url.toLowerCase(),is_admin])

      return user.rows[0]
    } catch(e){
      throw e
    }
  }

  /** Returns a single user with given username */

  static async getOne(username) {
    try{
      let user = await db.query(
        `SELECT username,first_name,last_name,email,photo_url,is_admin
        FROM users
        WHERE username = $1
        `,[username.toLowerCase()])
      
      User.errIfNonexistent(user.rows[0])

      return user.rows[0]
    } catch(e){
      throw e
    }
  }

  /** Update a user's details */

  static async update(username, data) {
    try {
      let queryData = partialUpdate('users', data, 'username', username.toLowerCase());

      let user = await db.query(
        queryData.query,queryData.values
      )

      User.errIfNonexistent(user.rows[0])
 
      return user.rows[0];
    } catch (e) {
      throw e;
    }
  }

  /** Delete a user */

  static async delete(username) {
    try {
      let user = await db.query(
        `DELETE FROM users
        WHERE username = $1
        RETURNING username`,[username.toLowerCase()]
      );

      User.errIfNonexistent(user.rows[0])

      return user.rows[0]
    } catch (e) {
      throw e;
    }
  }

  /** Throw 404 if company handle does not exist */
  
  static errIfNonexistent(username){
    if(!username){
      let err = new Error('No such user')
      err.status = 404;
      throw err
    }
  }

}

module.exports = User;
