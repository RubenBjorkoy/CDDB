require('dotenv').config();

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const mysql = require('mysql');

let mainWindow;

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
        },
    });

    mainWindow.loadFile('index.html');
});

ipcMain.handle('get-cds', (event, query) => {
    return new Promise((resolve, reject) => {
        connection.query(query, (error, results) => {
            if (error) reject(error.message);
            resolve(results);
        });
    });
});
  
ipcMain.handle('add-cd', (event, cd) => {
    const query = 'INSERT INTO CDs (album, artist, year, location, position) VALUES (?, ?, ?, ?, ?)';
    return new Promise((resolve, reject) => {
        connection.query(query, [cd.album, cd.artist, cd.year, cd.location, cd.position], (error, results) => {
        if (error) reject(error.message);
        resolve(results);
        });
    });
});
  
ipcMain.handle('update-cd', (event, cd) => {
    const query = 'UPDATE CDs SET album = ?, artist = ?, year = ?, location = ?, position = ? WHERE id = ?';
    return new Promise((resolve, reject) => {
        connection.query(query, [cd.album, cd.artist, cd.year, cd.location, cd.position, cd.id], (error, results) => {
        if (error) reject(error.message);
        resolve(results);
        });
    });
});

ipcMain.handle('delete-cd', (event, id) => {
    const query = 'DELETE FROM CDs WHERE id = ?';
    return new Promise((resolve, reject) => {
        connection.query(query, [id], (error, results) => {
        if (error) reject(error.message);
        resolve(results);
        });
    });
});

ipcMain.handle('get-env', (event, key) => {
    return process.env[key];
  });

app.on('window-all-closed', () => {
    connection.end();
    app.quit();
});