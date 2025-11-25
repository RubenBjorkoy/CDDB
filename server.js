require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

const db = new sqlite3.Database(path.resolve(__dirname, '../../db/CDDB.db'), (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

app.use(cors({
  //origin: 'http://192.168.1.43:8000', 
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());

app.get('/cds', (req, res) => {
  db.all('SELECT * FROM CDs', [], (err, rows) => {
    if (err) {
      console.error('Error fetching CDs:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

app.post('/cds', (req, res) => {
  const { album, artist, year, location, position } = req.body;
  const query = `
    INSERT INTO CDs (album, artist, year, location, position)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(query, [album, artist, year, location, position], function (err) {
    if (err) {
      console.error('Error adding CD:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ id: this.lastID });
  });
});

app.put('/cds/:id', (req, res) => {
  const { id } = req.params;
  const { album, artist, year, location, position } = req.body;
  const query = `
    UPDATE CDs SET album = ?, artist = ?, year = ?, location = ?, position = ?
    WHERE id = ?
  `;
  db.run(query, [album, artist, year, location, position, id], function (err) {
    if (err) {
      console.error('Error updating CD:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ affectedRows: this.changes });
  });
});

app.delete('/cds/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM CDs WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('Error deleting CD:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ affectedRows: this.changes });
  });
});

app.get('/config/lastfm-key', (req, res) => {
  res.json({ lastfmApiKey: process.env.LASTFM_API_KEY || '' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server listening on http://192.168.1.43:${port}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  db.close(() => {
    console.log('SQLite database closed.');
    process.exit(0);
  });
});
