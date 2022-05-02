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

async function handleGetOneProduct(req, res) {
  try {
    const product = await Product.findOne(req.params.id);
    if (product) res.send(product);
    else res.sendStatus(404);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
}

module.exports = {
  handleGetProducts,
  handleGetOneProduct,
};
