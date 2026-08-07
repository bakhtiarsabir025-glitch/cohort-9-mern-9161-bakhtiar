require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});