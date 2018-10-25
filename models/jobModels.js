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

        if(minSalary <0 || minEquity <0 || minEquity > 1){
          let err = new Error('Invalid parameters');
          err.status = 400;
          throw err;
        }

        let salaryRes;

        // let selectPrefix = "SELECT handle,name,num_employees,description,logo_url"

        companyRes = await db.query(
              `SELECT id,title,salary,equity,company_handle,date_posted
                  FROM jobs
                  WHERE salary > $1
                  AND minEquity > $1
              `,[minSalary,miEquity])

        return companyRes.rows;
  }

  // "slugs" "Apple Computer" "apple-computer" (slugify)
  static async createCompany(handle,name,numEmployees,description,logoURL) {
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
        `,[handle,name,numEmployees,description,logoURL])

      return company.rows[0]
    } catch(e){
      throw e
    }
  }

  static async getCompany(handle) {
    try{
      let company = await db.query(
        `SELECT handle,name,num_employees,description,logo_url
        FROM companies
        WHERE handle = $1
        `,[handle.toUpperCase()])
      
      Company.errIfNonexistent(company.rows[0])

      return company.rows[0]
    } catch(e){
      throw e
    }
  }

  static async updateCompany(handle, data) {
    try {
      let queryData = partialUpdate('companies', data, 'handle', handle.toUpperCase());

      let company = await db.query(
        queryData.query,queryData.values
      )

      Company.errIfNonexistent(company.rows[0])
 
      return company.rows[0];
    } catch (e) {
      throw e;
    }
  }

  static async deleteCompany(handle) {
    try {
      let company = await db.query(
        `DELETE FROM companies
        WHERE handle = $1
        RETURNING handle
        `,[handle.toUpperCase()]
      );

      Company.errIfNonexistent(company.rows[0])

      return company.rows[0]
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

module.exports = Company;
