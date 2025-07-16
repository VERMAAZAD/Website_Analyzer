const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();
require('./Models/database');

const AuthRouter = require('./Routers/AuthRouter');
const ScraperRouter = require("./Routers/ScraperRouter");
const AdminRouter = require('./Routers/AdminRouter');





const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

app.use('/auth', AuthRouter)
app.use('/api/scraper', ScraperRouter);
app.use('/admin', AdminRouter);

app.listen(PORT, () => {
    console.log('Server is Running');
})