const express = require('express');
const mongoose = require('mongoose');
const dbURL = 'mongodb://localhost:27017/mtec';
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

mongoose.connect(dbURL);
const db = mongoose.connection;
db.on('error', (err) => console.error('Connection error:', err));
db.once('open', () => console.log('Connected to MongoDB'));

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
});