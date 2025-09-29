const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();
require('./Models/database');

const AuthRouter = require('./Routers/AuthRouter');
const ScraperRouter = require("./Routers/ScraperRouter");
const AdminRouter = require('./Routers/AdminRouter');
const ScraperGameRouter = require('./Routers/ScraperGameRouter')
const ScraperDatingRouter = require('./Routers/ScraperDatingRouter')
const HostingRouter = require('./Routers/HostingRouter')
const CollectMailDataRouter = require('./Routers/CollectMailDataRouter')

const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
const corsOptions = {
  origin: [
    "https://monitorchecker.com", 
    "http://localhost:5173"      
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};
app.use(cors(corsOptions));

app.use('/auth', AuthRouter)
app.use('/api/scraper', ScraperRouter);
app.use('/admin', AdminRouter);
app.use('/casino/scraper', ScraperGameRouter);
app.use('/dating/scraper', ScraperDatingRouter);
app.use("/api/hosting", HostingRouter)
app.use("/collectmail", CollectMailDataRouter)

app.listen(PORT, () => {
    console.log('Server is Running');
})
require('./cron/autoUpdater'); 