const express = require("express");
const router = new express.Router();
const { validate } = require('jsonschema');
const jobSchema = require(`../schema/jobSchema.json`);
const updateJobSchema = require(`../schema/updateJobSchema.json`)
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

router.post('/', async function(req, res, next) {
  try {
    let result = validate(req.body, jobSchema);

    if (!result.valid)
      return next(result.errors.map(e => e.stack));

    let { title, salary, equity, company_handle } = req.body;
    const job = await Job.create(title, salary, equity, company_handle);

    return res.json({job});
  } catch(err) {
    next(err);
  }
});

router.get('/:id', async function(req, res, next) {
  try {
    let { id } = req.params;
    const job = await Job.getOne(id);
    return res.json({job});
  } catch (err) {
    next(err);
  }
});


router.patch('/:id', async function(req, res, next) {
  try {
    let { id } = req.params;

    let result = validate(req.body, updateJobSchema);

    if (!result.valid)
      return next(result.errors.map(e => e.stack));

    const data = req.body;
    const job = await Job.update(id, data);

    return res.json({job})
  } catch (err) {
    next(err);
  }
})


router.delete('/:id', async function(req, res, next) {
  try{
    let { id } = req.params;

    await Job.delete(id);

    return res.json({message: 'Job deleted'})
  } catch (err) {
    next(err);
  }
});

module.exports = router;
