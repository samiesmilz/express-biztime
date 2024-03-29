const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");

/*
 routes 
*/

//////// Get all invoices //////
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (error) {
    return next(error);
  }
});

//////// Get invoice by id //////
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        invoices.*,
        companies.*
      FROM invoices
      JOIN companies ON invoices.comp_code = companies.code
      WHERE invoices.id = $1
    `;
    const results = await db.query(query, [id]);
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id: ${id}`, 404);
    }
    // Directly destructure fields into invoice object
    console.log(results.rows[0]);
    const { ...invoice } = results.rows[0];
    return res.json({ invoice });
  } catch (error) {
    return next(error);
  }
});

//////// Create new invoice //////
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;
    if (!comp_code || !amt) {
      throw new ExpressError("comp_code and amt must be provided", 400);
    }
    const results = await db.query(
      `INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`,
      [comp_code, amt]
    );
    return res.status(201).json({ invoice: results.rows[0] });
  } catch (error) {
    return next(error);
  }
});

//////// Update / replace invoice //////
router.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const { amt, paid } = req.body;
    if (!amt || !paid) {
      throw new ExpressError("amt and paid tag must be provided", 400);
    }
    const result = await db.query(`SELECT * FROM invoices where id=$1`, [id]);
    if (result.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id: ${id}`, 404);
    }
    let { paid_date } = result.rows[0];
    if (paid && !paid_date) {
      paid_date = new Date().toISOString();
    } else if (!paid) {
      paid_date = null;
    }
    const updatedResult = await db.query(
      `UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING *`,
      [amt, paid, paid_date, id]
    );
    return res.status(200).json({ invoice: updatedResult.rows[0] });
  } catch (error) {
    return next(error);
  }
});

//////// Delete invoice //////
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query(
      "DELETE FROM invoices WHERE id=$1 RETURNING *",
      [id]
    );
    if (results.rows.length === 0) {
      throw new ExpressError(`Can't find invoice with id: ${id}`, 404);
    }
    return res.json({ status: "Deleted" });
  } catch (error) {
    return next(error);
  }
});

//////// exports /////////
module.exports = router;
