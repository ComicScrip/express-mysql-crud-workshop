const db = require('../db');

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

module.exports = {
  findMany,
  findOne,
};
