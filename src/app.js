const express = require('express');
const Joi = require('joi');
const db = require('./db');

const app = express();

app.get('/', (req, res) => res.send('hello'));

app.use(express.json());

app.post('/products', async (req, res) => {
  try {
    const { name, price } = req.body;
    const { error: validationErrors } = Joi.object({
      name: Joi.string().max(50).required(),
      price: Joi.number().min(0).required(),
    }).validate({ name, price }, { abortEarly: false });

    if (validationErrors) {
      return res.status(422).json({ errors: validationErrors.details });
    }

    const [{ insertId }] = await db
      .promise()
      .query('INSERT INTO products (name, price) VALUES (?, ?)', [name, price]);

    res.status(201).send({ id: insertId, name, price });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/products', async (req, res) => {
  const { max_price } = req.query;
  let sql = 'SELECT * FROM products';
  const valuesToEscape = [];
  if (max_price) {
    sql += ' WHERE price <= ?';
    valuesToEscape.push(max_price);
  }

  try {
    const [products] = await db.promise().query(sql, valuesToEscape);
    res.send(products);
  } catch (err) {
    console.error(err);
    res.status(500).send('something wrong happened');
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const [[product]] = await db
      .promise()
      .query('SELECT * FROM products WHERE id = ?', [req.params.id]);

    if (product) res.send(product);
    else res.sendStatus(404);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.patch('/products/:id', async (req, res) => {
  try {
    const [[product]] = await db
      .promise()
      .query('SELECT * FROM products WHERE id = ?', [req.params.id]);

    if (!product) return res.sendStatus(404);

    const { name, price } = req.body;
    const { error: validationErrors } = Joi.object({
      name: Joi.string().max(50),
      price: Joi.number().min(0),
    }).validate({ name, price }, { abortEarly: false });

    if (validationErrors) {
      return res.status(422).json({ errors: validationErrors.details });
    }

    await db
      .promise()
      .query('UPDATE products SET ? WHERE id = ?', [req.body, req.params.id]);

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const [{ affectedRows }] = await db
      .promise()
      .query('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (affectedRows !== 0) res.sendStatus(204);
    else res.sendStatus(404);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

db.connect((err) => {
  if (err) console.error('error connecting to db');
});

module.exports.app = app;
