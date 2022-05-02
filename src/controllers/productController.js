const Product = require('../models/productModel');

async function handleGetProducts(req, res) {
  const { max_price } = req.query;

  try {
    res.send(await Product.findMany({ max_price }));
  } catch (err) {
    console.error(err);
    res.status(500).send('something wrong happened');
  }
}

module.exports = {
  handleGetProducts,
};
