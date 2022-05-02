const productRouter = require('../routes/productRouter');

module.exports = (app) => {
  app.use('/products', productRouter);
};
