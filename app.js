/** Express app for jobly. */


const express = require("express");
const app = express();
app.use(express.json());

const companyRoutes = require('./routes/companyRoutes');
app.use('/companies', companyRoutes)

const jobRoutes = require('./routes/jobRoutes');
app.use('/jobs', jobRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes);

// add logging system

const morgan = require("morgan");
app.use(morgan("tiny"));


/** 404 handler */

app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use(function (err, req, res, next) {
  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message
  });
});


module.exports = app;
