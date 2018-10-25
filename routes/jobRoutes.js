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

router.get("/", async function (req, res, next) {
  try {
    let {minSalary, minEquity, search} = req.body;

    const results = await Job.getAll(minSalary, minEquity, search);
    const jobs = results.rows;

    return res.json(jobs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;