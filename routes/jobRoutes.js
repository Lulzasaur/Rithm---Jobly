const express = require("express");
const router = new express.Router();
const { validate } = require('jsonschema');
const jobSchema = require(`../schema/jobSchema.json`)
const Job = require('../models/jobModels');

/* 
Job Model:
.getall(minSalary, minEquity, search)
.getOne(id)
.create(title, salary, equity, company_handle)
.update(id, data)
.delete(id)

*/

router.get('/', async function(req, res, next) {
  try {
    let {minSalary, minEquity, search} = req.body;

    const jobs = await Job.getAll(minSalary, minEquity, search);

    return res.json({jobs});
  } catch (err) {
    next(err);
  }
});


router.get('/:id', async function(req, res, next) {
  try {
    let { id } = req.params;
    console.log('job',id);
    const job = await Job.getOne(id);
    
    return res.json({job});
  } catch (err) {
    next(err);
  }
})

module.exports = router;


/*

try {
  const result = validate(req.body, companySchema);

  if(!result.valid){
    return next(result.errors.map(error => error.stack));
  } else{
    let {handle,name,num_employees,description,logo_url} = req.body
    const companyResp = await Company.createCompany(handle,name,num_employees,description,logo_url);
    return res.json({ company:companyResp });
  }
} catch (err) {
  return next(err);
}

*/