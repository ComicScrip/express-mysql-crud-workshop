const db = require('../src/db');

afterAll(async () => {
  await db.promise().end();
});
