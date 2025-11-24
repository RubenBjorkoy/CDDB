// server.js
require('dotenv').config();

const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// MySQL connection
const connection = mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL');
});

// Middleware
app.use(cors());          // allow your frontend origin
app.use(express.json());  // parse JSON bodies

// Routes matching your previous IPC handlers
app.get('/cds', (req, res) => {
  const query = 'SELECT * FROM CDs';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching CDs:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/cds', (req, res) => {
  const { album, artist, year, location, position } = req.body;
  const query =
    'INSERT INTO CDs (album, artist, year, location, position) VALUES (?, ?, ?, ?, ?)';
  connection.query(
    query,
    [album, artist, year, location, position],
    (error, results) => {
      if (error) {
        console.error('Error adding CD:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: results.insertId });
    },
  );
});

app.put('/cds/:id', (req, res) => {
  const { id } = req.params;
  const { album, artist, year, location, position } = req.body;
  const query =
    'UPDATE CDs SET album = ?, artist = ?, year = ?, location = ?, position = ? WHERE id = ?';
  connection.query(
    query,
    [album, artist, year, location, position, id],
    (error, results) => {
      if (error) {
        console.error('Error updating CD:', error);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ affectedRows: results.affectedRows });
    },
  );
});

app.delete('/cds/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM CDs WHERE id = ?';
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Error deleting CD:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ affectedRows: results.affectedRows });
  });
});

// Optional: expose Last.fm key via backend instead of directly in frontend
app.get('/config/lastfm-key', (req, res) => {
  res.json({ lastfmApiKey: process.env.LASTFM_API_KEY || '' });
});

// Start server
app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  connection.end(() => {
    process.exit(0);
  });
});
