const express = require('express');
const db = require('./db');

const app = express();

app.get('/', (req, res) => res.send('hello'));

db.connect((err) => {
  if (err) console.error('error connecting to db');
});

module.exports.app = app;
