const ProductController = require('../controllers/productController');
const productRouter = require('express').Router();

productRouter.get('/', ProductController.handleGetProducts);
productRouter.get('/:id', ProductController.handleGetOneProduct);

module.exports = productRouter;
