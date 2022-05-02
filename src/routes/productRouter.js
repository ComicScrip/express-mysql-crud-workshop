const ProductController = require('../controllers/productController');
const productRouter = require('express').Router();

productRouter.get('/', ProductController.handleGetProducts);

module.exports = productRouter;
