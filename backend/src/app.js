const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./logger');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

// Error handler should be the last middleware
app.use(errorHandler);

module.exports = app;