const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./logger');

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = app;