const express = require('express');
const db = require('./db');

const app = express();

app.get('/', (req, res) => res.send('hello'));

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

db.connect((err) => {
  if (err) console.error('error connecting to db');
});

module.exports.app = app;
