const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const slugify = require("slugify");

/*
 routes 
*/

//////// Get all companies //////
// router.get("/", async (req, res, next) => {
//   try {
//     const results = await db.query(`SELECT code, name FROM companies`);
//     return res.json({ companies: results.rows });
//   } catch (error) {
//     return next(error);
//   }
// });

router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`
      SELECT c.code, c.name, array_agg(i.industry) AS industries
      FROM companies c
      LEFT JOIN companies_industries ci ON c.code = ci.comp_code
      LEFT JOIN industries i ON ci.industry_code = i.code
      GROUP BY c.code, c.name
    `);
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
    const slug = slugify(code, "_");
    const results = await db.query(
      `INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`,
      [slug, name, description]
    );
    // console.log(results.rows[0]);
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
// inustries

// Add an industry
router.post("/industries", async (req, res, next) => {
  try {
    const { code, industry } = req.body;
    const result = await db.query(
      `INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING *`,
      [code, industry]
    );
    return res.status(201).json({ industry: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

// List all industries with associated company codes
router.get("/industries", async (req, res, next) => {
  try {
    const results = await db.query(`
      SELECT i.code, i.industry, array_agg(ci.comp_code) AS companies
      FROM industries i
      LEFT JOIN companies_industries ci ON i.code = ci.industry_code
      GROUP BY i.code, i.industry
    `);
    return res.json({ industries: results.rows });
  } catch (error) {
    return next(error);
  }
});

// Associate an industry with a company
router.post("/:comp_code/industries/:industry_code", async (req, res, next) => {
  try {
    const { comp_code, industry_code } = req.params;
    await db.query(
      `INSERT INTO companies_industries (comp_code, industry_code) VALUES ($1, $2)`,
      [comp_code, industry_code]
    );
    return res
      .status(201)
      .json({ message: "Industry associated with company successfully" });
  } catch (error) {
    return next(error);
  }
});

//////// exports /////////
module.exports = router;
