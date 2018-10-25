const db = require("../db");
const partialUpdate = require('../helpers/partialUpdate');

/** Collection of related methods for companies. */

class Company {

  /** Return all company data. Search parameters can be passed
   *  into the function for name, minEmp and maxEmp
   */

  static async findAll(minEmployees,maxEmployees,search) {        
        minEmployees = minEmployees || 0;
        maxEmployees = maxEmployees || 2147483646;

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

  static errIfNonexistent(company){
    if(!company){
      let err = new Error('No such company')
      err.status = 404;
      throw err
    }
  }

}

module.exports = Company;
