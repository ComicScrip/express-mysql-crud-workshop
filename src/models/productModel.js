const db = require('../db');
const Joi = require('joi');

async function findMany({ max_price }) {
  let sql = 'SELECT * FROM products';
  const valuesToEscape = [];
  if (max_price) {
    sql += ' WHERE price <= ?';
    valuesToEscape.push(max_price);
  }

  const [products] = await db.promise().query(sql, valuesToEscape);
  return products;
}

async function findOne(id) {
  const [[product]] = await db
    .promise()
    .query('SELECT * FROM products WHERE id = ?', [id]);
  return product;
}

async function create({ name, price }) {
  const [{ insertId }] = await db
    .promise()
    .query('INSERT INTO products (name, price) VALUES (?, ?)', [name, price]);

  return { name, price, id: insertId };
}

function validate(data, forUpdate = false) {
  return Joi.object({
    name: Joi.string()
      .max(50)
      .presence(forUpdate ? 'optional' : 'required'),
    price: Joi.number()
      .min(0)
      .presence(forUpdate ? 'optional' : 'required'),
  }).validate(data, { abortEarly: false }).error;
}

module.exports = {
  findMany,
  findOne,
  create,
  validate,
};
