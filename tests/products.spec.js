const request = require('supertest');
const { app } = require('../src/app');
const db = require('../src/db');

describe('products', () => {
  let res;
  beforeEach(() => {
    return db.promise().query('TRUNCATE table products');
  });
  describe('GET /products', () => {
    describe('without filters', () => {
      beforeEach(async () => {
        await db
          .promise()
          .query(
            "INSERT INTO products (name, price) VALUES ('laptop', 1500), ('socks', 5.95)"
          );
        res = await request(app).get('/products');
      });

      it('should return a 200 status code', async () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return all products in DB', async () => {
        expect(res.body.length).toBe(2);
      });

      it('should return objects with correct properties', async () => {
        res.body.forEach((item) => {
          expect(item.id).toBeDefined();
          expect(item.name).toBeDefined();
          expect(item.price).toBeDefined();
        });
      });
    });

    describe('with a valid max_price filter', () => {
      it('should return only the products which price is below a given value', async () => {
        await db
          .promise()
          .query(
            "INSERT INTO products (name, price) VALUES ('laptop', 1500), ('socks', 5.95), ('usb fan', 19.99)"
          );
        res = await request(app).get('/products?max_price=20');
        expect(res.body.length).toBe(2);
      });
    });

    describe('with a malicious max_price filter', () => {
      it('should be protected against SQL injections', async () => {
        await db
          .promise()
          .query(
            "INSERT INTO products (name, price) VALUES ('laptop', 1500), ('socks', 5.95), ('usb fan', 19.99)"
          );
        res = await request(app).get(
          '/products?max_price=20;DROP%20TABLE%20products'
        );
        expect(res.body.length).toBe(2);
        const [products] = await db.promise().query('SELECT * FROM products');

        expect(products.length).toBe(3);
      });
    });
  });

  describe('GET /products/:id', () => {
    describe('with an existing product in DB', () => {
      let product;
      beforeEach(async () => {
        product = { name: 'laptop', price: 999.99 };

        const [{ insertId }] = await db
          .promise()
          .query(
            `INSERT INTO products (name, price) VALUES ('${product.name}', ${product.price})`
          );

        product.id = insertId;

        res = await request(app).get(`/products/${product.id}`);
      });

      it('should return a 200 status code', async () => {
        expect(res.statusCode).toBe(200);
      });

      it('should return the product with correct properties', async () => {
        expect(res.body.id).toBe(product.id);
        expect(res.body.name).toBe(product.name);
        expect(res.body.price).toBe(product.price);
      });
    });

    describe('without an existing product in DB', () => {
      it('should return a 404 status code and no body', async () => {
        res = await request(app).get('/products/999999');
        expect(res.statusCode).toBe(404);
        expect(Object.keys(res.body).length).toBe(0);
      });
    });
  });

  xdescribe('POST /products', () => {
    describe('with valid attributes', () => {
      const payload = { name: 'computer', price: 500 };

      beforeEach(async () => {
        res = await request(app).post('/products').send(payload);
      });

      xit('should return a 201 status code', async () => {
        // TODO
      });

      it('should return the created product in DB', async () => {
        expect(res.body.id).toBeDefined();
        expect(res.body.name).toBe(payload.name);
        expect(res.body.price).toBe(payload.price);
      });
    });

    describe('with invalid attributes', () => {
      describe('empty name', () => {
        const payload = { name: '', price: 18 };
        beforeEach(async () => {
          res = await request(app).post('/products').send(payload);
        });

        it('should return a 422 status code', async () => {
          expect(res.statusCode).toBe(422);
        });

        it('should return an error message', async () => {
          expect(
            res.body.errors.some(
              ({ message }) =>
                message.includes('name') && message.includes('empty')
            )
          ).toBe(true);
        });
      });

      describe('name too big', () => {
        const payload = {
          name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          price: 18,
        };
        beforeEach(async () => {
          res = await request(app).post('/products').send(payload);
        });

        it('should return a 422 status code', async () => {
          expect(res.statusCode).toBe(422);
        });

        it('should return an error message', async () => {
          expect(
            res.body.errors.some(
              ({ message }) =>
                message.includes('name') &&
                message.includes(
                  'must be less than or equal to 50 characters long'
                )
            )
          ).toBe(true);
        });
      });

      describe('empty price', () => {
        const payload = { name: 'test' };
        beforeEach(async () => {
          res = await request(app).post('/products').send(payload);
        });

        it('should return a 422 status code', async () => {
          expect(res.statusCode).toBe(422);
        });

        it('should return an error message', async () => {
          expect(
            res.body.errors.some(
              ({ message }) =>
                message.includes('price') && message.includes('required')
            )
          ).toBe(true);
        });
      });

      describe('negative price', () => {
        const payload = { name: 'test', price: -1 };
        beforeEach(async () => {
          res = await request(app).post('/products').send(payload);
        });

        it('should return a 422 status code', async () => {
          expect(res.statusCode).toBe(422);
        });

        it('should return an error message', async () => {
          expect(
            res.body.errors.some(
              ({ message }) =>
                message.includes('price') &&
                message.includes('must be greater than or equal to 0')
            )
          ).toBe(true);
        });
      });

      describe('NaN price', () => {
        const payload = { name: 'test', price: 'notanumber' };
        beforeEach(async () => {
          res = await request(app).post('/products').send(payload);
        });

        it('should return a 422 status code', async () => {
          expect(res.statusCode).toBe(422);
        });

        it('should return an error message', async () => {
          expect(
            res.body.errors.some(
              ({ message }) =>
                message.includes('price') &&
                message.includes('must be a number')
            )
          ).toBe(true);
        });
      });
    });
  });

  xdescribe('PATCH /products/:id', () => {
    describe('with an existing product in DB', () => {
      let product;
      beforeEach(async () => {
        product = { name: 'laptop', price: 999.99 };

        const [{ insertId }] = await db
          .promise()
          .query(
            `INSERT INTO products (name, price) VALUES ('${product.name}', ${product.price})`
          );

        product.id = insertId;
      });

      describe('with valid attributes', () => {
        beforeEach(async () => {
          res = await request(app)
            .patch(`/products/${product.id}`)
            .send({ name: 'testupdate' });
        });

        it('should return a 200 status code', async () => {
          expect(res.statusCode).toBe(200);
        });

        it('should have updated the record in DB', async () => {
          const [[productInDB]] = await db
            .promise()
            .query('SELECT * FROM products WHERE id = ?', [product.id]);
          expect(productInDB.name).toBe('testupdate');
          expect(productInDB.price).toBe(product.price);
        });
      });

      describe('with invalid attributes', () => {
        describe('empty name', () => {
          const payload = { name: '', price: 18 };
          beforeEach(async () => {
            res = await request(app)
              .patch(`/products/${product.id}`)
              .send(payload);
          });

          it('should return a 422 status code', async () => {
            expect(res.statusCode).toBe(422);
          });

          it('should return an error message', async () => {
            expect(
              res.body.errors.some(
                ({ message }) =>
                  message.includes('name') && message.includes('empty')
              )
            ).toBe(true);
          });
        });

        describe('name too big', () => {
          const payload = {
            name: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            price: 18,
          };
          beforeEach(async () => {
            res = await request(app)
              .patch(`/products/${product.id}`)
              .send(payload);
          });

          it('should return a 422 status code', async () => {
            expect(res.statusCode).toBe(422);
          });

          it('should return an error message', async () => {
            expect(
              res.body.errors.some(
                ({ message }) =>
                  message.includes('name') &&
                  message.includes(
                    'must be less than or equal to 50 characters long'
                  )
              )
            ).toBe(true);
          });
        });

        describe('negative price', () => {
          const payload = { name: 'test', price: -1 };
          beforeEach(async () => {
            res = await request(app)
              .patch(`/products/${product.id}`)
              .send(payload);
          });

          it('should return a 422 status code', async () => {
            expect(res.statusCode).toBe(422);
          });

          it('should return an error message', async () => {
            expect(
              res.body.errors.some(
                ({ message }) =>
                  message.includes('price') &&
                  message.includes('must be greater than or equal to 0')
              )
            ).toBe(true);
          });
        });

        describe('NaN price', () => {
          const payload = { name: 'test', price: 'notanumber' };
          beforeEach(async () => {
            res = await request(app).post('/products').send(payload);
          });

          it('should return a 422 status code', async () => {
            expect(res.statusCode).toBe(422);
          });

          it('should return an error message', async () => {
            expect(
              res.body.errors.some(
                ({ message }) =>
                  message.includes('price') &&
                  message.includes('must be a number')
              )
            ).toBe(true);
          });
        });
      });
    });

    describe('without an existing product in DB', () => {
      it('should return a 404 status code and no body', async () => {
        res = await request(app).patch('/products/99999');
        expect(res.statusCode).toBe(404);
        expect(Object.keys(res.body).length).toBe(0);
      });
    });
  });

  xdescribe('DELETE /products/:id', () => {
    describe('with an existing product in DB', () => {
      let product;
      beforeEach(async () => {
        product = { name: 'laptop', price: 999.99 };

        const [{ insertId }] = await db
          .promise()
          .query(
            `INSERT INTO products (name, price) VALUES ('${product.name}', ${product.price})`
          );

        product.id = insertId;

        res = await request(app).delete(`/products/${product.id}`);
      });

      it('should return a 204 status code', async () => {
        expect(res.statusCode).toBe(204);
      });

      xit('should delete the product in DB', async () => {
        // TODO
      });
    });

    describe('without an existing product in DB', () => {
      it('should return a 404 status code and no body', async () => {
        res = await request(app).delete('/products/99999');
        expect(res.statusCode).toBe(404);
        expect(Object.keys(res.body).length).toBe(0);
      });
    });
  });
});
