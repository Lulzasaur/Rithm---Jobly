const db = require("../db");
const partialUpdate = require('../helpers/partialUpdate');

/** Collection of related methods for companies. */

class Company {

  /** Return all company data. Search parameters can be passed
   *  into the function for name, minEmp and maxEmp
   */

  static async getAll(minEmployees,maxEmployees,search) {        
        minEmployees = (minEmployees===undefined) ? 0 : minEmployees;
        maxEmployees = (maxEmployees===undefined) ? 2147483646 : maxEmployees;

        if(maxEmployees<minEmployees){
          let err = new Error('Max employees is greater than Min employees');
          err.status = 400;
          throw err;
        }

        let companyRes;

        // let selectPrefix = "SELECT handle,name,num_employees,description,logo_url"


        if(search){
          companyRes = await db.query(
              `SELECT handle,name,num_employees,description,logo_url
                  FROM companies
                  WHERE name LIKE $1                                     
                  AND num_employees > $2
                  AND num_employees < $3
              `,[`%${search}%`,minEmployees,maxEmployees])
        } else{
          companyRes = await db.query(
            `SELECT handle,name,num_employees,description,logo_url
                FROM companies
                WHERE num_employees > $1
                AND num_employees < $2
            `,[minEmployees,maxEmployees])
        }

        return companyRes.rows;

  }

  /** Create a new company with the given details */

  static async create(handle,name,numEmployees,description,logoURL) {
    try{
      if (handle === undefined || name === undefined) {
        let err = new Error('Incomplete or invalid data');
        err.status = 400;
        throw err;
      }

      let company = await db.query(
        `INSERT INTO companies (handle,name,num_employees,description,logo_url)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING handle,name,num_employees,description,logo_url
        `,[handle.toLowerCase(),name.toLowerCase(),numEmployees,description,logoURL.toLowerCase()])

      return company.rows[0]
    } catch(e){
      throw e
    }
  }

  /** Returns a single company with given company handle */

  static async getOne(handle) {
    try{
      let company = await db.query(
        `SELECT handle,name,num_employees,description,logo_url
        FROM companies
        WHERE handle = $1
        `,[handle.toLowerCase()])
      
      Company.errIfNonexistent(company.rows[0])

      return company.rows[0]
    } catch(e){
      throw e
    }
  }

  /** Update a company's details */

  static async update(handle, data) {
    try {
      let queryData = partialUpdate('companies', data, 'handle', handle.toLowerCase());

      let company = await db.query(
        queryData.query,queryData.values
      )

      Company.errIfNonexistent(company.rows[0])
 
      return company.rows[0];
    } catch (e) {
      throw e;
    }
  }

  /** Delete a company */

  static async delete(handle) {
    try {
      let company = await db.query(
        `DELETE FROM companies
        WHERE handle = $1
        RETURNING handle`,[handle.toLowerCase()]
      );

      Company.errIfNonexistent(company.rows[0])

      return company.rows[0]
    } catch (e) {
      throw e;
    }
  }

  /** Return array of jobs for given company */

  static async getJobs(handle) {
    try {
      let company = await db.query(
        `SELECT id, title, salary, equity, company_handle, date_posted
        FROM jobs
        JOIN companies ON companies.handle = jobs.company_handle
        WHERE company_handle = $1 
        `,[handle.toLowerCase()]
      );

      Company.errIfNonexistent(company.rows[0])

      return company.rows
    } catch (e) {
      throw e;
    }
  }

  /** Throw 404 if company handle does not exist */
  
  static errIfNonexistent(company){
    if(!company){
      let err = new Error('No such company')
      err.status = 404;
      throw err
    }
  }

}

module.exports = Company;
