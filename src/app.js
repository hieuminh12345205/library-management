const path = require('path');
const express = require('express');
const { CATEGORIES } = require('./utils/validate');
const { apiNotFound, errorHandler } = require('./middleware/error');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));
app.get('/api/categories', (req, res) => res.json({ data: CATEGORIES }));
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/books', require('./routes/books').router);
app.use('/api/loans', require('./routes/loans').router);
app.use('/api/librarian', require('./routes/librarian').router);
app.use('/api/admin', require('./routes/admin').router);
app.use('/api/stats', require('./routes/stats').router);
app.use('/api', apiNotFound);

app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html')));

app.use(errorHandler);

module.exports = app;
