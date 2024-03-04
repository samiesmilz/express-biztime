/** BizTime express application. */

const express = require("express");
const companies = require("./routes/companies");
const invoices = require("./routes/invoices");
const ExpressError = require("./expressError");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes midware
app.use("/companies", companies);
app.use("/invoices", invoices);

/** 404 handler */

app.use(function (req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err.status,
    message: err.message,
  });
});

/////////// exports /////////
module.exports = app;
