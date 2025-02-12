const pg = require("pg");
const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const client = new pg.Client();

app.use(express.json());
app.use(require("morgan")("dev"));

app.get("/api/employees", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM employees;`;
    const { rows } = await client.query(SQL);
    console.log(rows);
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM departments;`;
    const { rows } = await client.query(SQL);
    console.log(rows);
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO employees (name, department_id) VALUES($1, $2) RETURNING *;`;
    const { rows } = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
    ]);
    console.log(rows);
    res.send({ msg: "success - created", result: rows[0] });
  } catch (err) {
    next(err);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM employees WHERE id=$1 RETURNING *`;
    const { rows } = await client.query(SQL, [req.params.id]);
    res.send({ msg: "success - deleted", result: rows[0] });
  } catch (err) {
    next(err);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.params);
    const SQL = `UPDATE employees SET name = $1, updated_at = NOW(), department_id = $2 WHERE ID = $3 RETURNING *`;
    const { rows } = await client.query(SQL, [
      req.body.name,
      req.body.department_id,
      req.params.id,
    ]);
    console.log(rows);
    res.send({ msg: "success - updated", result: rows[0] });
  } catch (err) {
    next(err);
  }
});

const init = async () => {
  try {
    await client.connect();
    let SQL = `
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;
    CREATE TABLE departments(id SERIAL PRIMARY KEY, name VARCHAR(127) NOT NULL);
    CREATE TABLE employees(id SERIAL PRIMARY KEY, name VARCHAR(127) NOT NULL, created_at TIMESTAMP DEFAULT now(), updated_at TIMESTAMP DEFAULT now(), department_id INTEGER NOT NULL REFERENCES departments(id));
    `;

    console.log("creating tables");
    await client.query(SQL);
    console.log("complete");
    SQL = `
    INSERT INTO departments(name) VALUES ('Sales');
    INSERT INTO departments(name) VALUES ('Engineering');
    INSERT INTO departments(name) VALUES ('Marketing');
      INSERT INTO employees(name, department_id) VALUES ('Bikna Huang', (SELECT id FROM departments WHERE name = 'Sales'));
     INSERT INTO employees(name, department_id) VALUES ('Jane Doe', (SELECT id FROM departments WHERE name = 'Engineering'));
      INSERT INTO employees(name, department_id) VALUES ('John Smith', (SELECT id FROM departments WHERE name = 'Marketing'));
      INSERT INTO employees(name, department_id) VALUES ('Justin Doe', (SELECT id FROM departments WHERE name = 'Marketing'));

    `;
    console.log("seeding data");
    await client.query(SQL);
    app.listen(PORT, () => {
      console.log(`Server on Port ${PORT}`);
    });
  } catch (err) {
    console.log(err);
  }
};
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message });
});

init();
