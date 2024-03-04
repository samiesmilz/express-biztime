const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

/*
 routes 
*/

//////// Get all companies //////
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT code, name FROM companies`);
    return res.json({ companies: results.rows });
  } catch (error) {
    return next(error);
  }
});

////// Get company by code //////
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(`SELECT * FROM companies WHERE code=$1`, [
      code,
    ]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with code: ${code}`, 404);
    }
    return res.json({ company: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});
//////// Create new company //////
router.post("/", async (req, res, next) => {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) {
      throw new ExpressError("Name and Code must be provided", 400);
    }
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      [code, name, description]
    );
    console.log(results.rows[0]);
    return res.status(201).json({ company: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

//////// Update / replace company //////
router.put("/:code", async (req, res, next) => {
  try {
    const code = req.params.code;
    const { name, description } = req.body;
    if (!code || !name) {
      throw new ExpressError("Name and Code must be provided", 400);
    }
    const results = await db.query(
      `UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
      [name, description, code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with code: ${code}`, 404);
    }
    return res.status(201).json({ company: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});
//////// Delete company //////
router.delete("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query(
      "DELETE FROM companies WHERE code=$1 RETURNING *",
      [code]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find company with code: ${code}`, 404);
    }
    return res.json({ status: "Deleted" });
  } catch (error) {
    return next(error);
  }
});

//////// Get company by code //////
router.get("/:code", async (req, res, next) => {
  try {
    const { code } = req.params;
    const query = `
      SELECT 
          companies.code,
          companies.name,
          companies.description,
          json_agg(invoices.id) AS invoices
      FROM 
          companies
      LEFT JOIN 
          invoices ON companies.code = invoices.comp_code
      WHERE 
          companies.code = $1
      GROUP BY 
          companies.code, companies.name, companies.description
    `;
    const results = await db.query(query, [code]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Company with code ${code} not found`, 404);
    }
    const { comp_code, name, description, invoices } = results.rows[0];
    return res.json({
      company: { comp_code, name, description, invoices },
    });
  } catch (error) {
    return next(error);
  }
});

//////// exports /////////
module.exports = router;
