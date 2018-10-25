const db = require("../db");
const partialUpdate = require('../helpers/partialUpdate');

/** Collection of related methods for Jobs. */

class Job {

  /** Return all job data. Search parameters can be passed
   *  into the function for minSalary,minEquity,search
   */

  static async getAll(minSalary,minEquity,search) {        
    minSalary = (minSalary===undefined) ? 0 : minSalary;
    minEquity = (minEquity===undefined) ? 0 : minEquity;

    let sqlQuery =`SELECT title,company_handle
    FROM jobs
    WHERE salary > $1
    AND equity > $2`,
        sqlSearchLine =``,
        sqlParams= [minSalary,minEquity];

    if(minSalary <0 || minEquity <0 || minEquity > 1){
      let err = new Error('Invalid parameters');
      err.status = 400;
      throw err;
    }

    if(search){
      sqlSearchLine = `AND title ILIKE $3`
      sqlParams.push(`%${search}%`)
      sqlQuery+=sqlSearchLine
    }

    let jobRes = await db.query(
          sqlQuery,sqlParams)

    return jobRes.rows;
  }

  static async create(title,salary,equity,company_handle) {
    try{

      //check if data is complete. However, should also be handled in schema
      if (title === undefined || salary === undefined || equity === undefined || company_handle === undefined) {
        let err = new Error('Incomplete or invalid data');
        err.status = 400;
        throw err;
      }

      let job = await db.query(
        `INSERT INTO jobs (title,salary,equity,company_handle)
        VALUES ($1,$2,$3,$4)
        RETURNING title,salary,equity,company_handle
        `,[title,salary,equity,company_handle])

      return job.rows[0]
    } catch(e){
      throw e
    }
  }

  static async getOne(id) {
    try{
      let job = await db.query(
        `SELECT id,title,salary,equity,company_handle
        FROM jobs
        WHERE id = $1
        `,[id])

      Job.errIfNonexistent(job.rows[0])

      return job.rows[0]
    } catch(e){
      throw e
    }
  }

  static async update(id, data) {
    try {
      let queryData = partialUpdate('jobs', data, 'id', id);

      let job = await db.query(
        queryData.query,queryData.values
      )

      Job.errIfNonexistent(job.rows[0])
 
      return job.rows[0];
    } catch (e) {
      throw e;
    }
  }

  static async delete(id) {
    try {
      let job = await db.query(
        `DELETE FROM jobs
        WHERE id = $1
        RETURNING id
        `,[id]
      );

      Job.errIfNonexistent(job.rows[0])

      return job.rows[0]
    } catch (e) {
      throw e;
    }
  }

  static errIfNonexistent(job){
    if(!job){
      let err = new Error('No such job')
      err.status = 404;
      throw err
    }
  }

}

module.exports = Job;
