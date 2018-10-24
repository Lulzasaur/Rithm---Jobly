const express = require("express");
const router = new express.Router();
const { validate } = require('jsonschema');
const companySchema = require(`../schema/companySchema.json`)
const editCompanySchema = require(`../schema/editCompanySchema.json`)
const Company = require('../models/companyModels')

router.get("/", async function (req, res, next) {
  try {
    let {minEmployees,maxEmployees,search} = req.query

    const companyResp = await Company.findAll(minEmployees,maxEmployees,search);
    return res.json({ company:companyResp });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
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
});

router.get("/:handle", async function (req, res, next) {
  try {
    let handle = req.params.handle
    const companyResp = await Company.getCompany(handle);
    return res.json({ company:companyResp });
  } catch (err) {
    return next(err);
  }
});

router.patch('/:handle', async function(req, res, next) {
  try {
    const result = validate(req.body, editCompanySchema);

    if(!result.valid){
      return next(result.errors.map(error => error.stack));
    } else{   
      let { handle } = req.params;
      const companyResp = await Company.updateCompany(handle,req.body)
      return res.json({ company: companyResp })
    }
  } catch (err) {
    next(err);
  }
})

router.delete('/:handle', async function(req, res, next) {
  try {
    let { handle } = req.params;
    const companyResp = await Company.deleteCompany(handle)
    return res.json({message:"Company deleted"})
  } catch (err) {
    next(err);
  }
})

module.exports = router;
