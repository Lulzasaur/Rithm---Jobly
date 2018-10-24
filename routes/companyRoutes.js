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
    let {handle,name,numEmployees,description,logoURL} = req.body
    const companyResp = await Company.createCompany(handle,name,numEmployees,description,logoURL);
    return res.json({ company:companyResp });
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
    let { handle } = req.params;
    console.log('route', handle, req.body);

  } catch (err) {
    next(err);
  }
})

module.exports = router;
