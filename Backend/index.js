const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

require('./Models/database');

const AuthRouter = require('./Routers/AuthRouter');
const SubUserRoutes = require('./Routers/SubUserRoutes');
const ScraperRouter = require("./Routers/ScraperRouter");
const AdminRouter = require('./Routers/AdminRouter');
const ScraperGameRouter = require('./Routers/ScraperGameRouter')
const ScraperDatingRouter = require('./Routers/ScraperDatingRouter')
const HostingRouter = require('./Routers/HostingRouter')
const CollectMailDataRouter = require('./Routers/CollectMailDataRouter')
const ClickTrackRouter = require('./Routers/ClickTrackRouter')
const TrafficCheckerRouter = require('./Routers/TrafficCheckerRouter')
const AdsWebsiteRouter = require('./Routers/AdsWebsiteRouter')
const NautraWebsiteRouter = require('./Routers/NautraWebsiteRouter')
const CasinoTrafficRouter = require('./Routers/CasinoTrafficRouter');
const PbnWebsiteRouter = require('./Routers/PbnWebsiteRouter');

const CreatelinkRoutes = require('./Routers/CreatelinkRoutes');
const { redirect } = require("./Controllers/LinkController");

const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

const corsOptions = {
    origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"]
};
app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.send('🚀 Server is up and running!');
});
app.use('/auth', AuthRouter)
app.use('/api/subusers', SubUserRoutes)
app.use('/api/scraper', ScraperRouter);
app.use('/admin', AdminRouter);
app.use('/casino/scraper', ScraperGameRouter);
app.use('/dating/scraper', ScraperDatingRouter);
app.use("/api/hosting", HostingRouter)
app.use("/collectmail", CollectMailDataRouter)
app.use("/trackweb", ClickTrackRouter)
app.use("/traffic", TrafficCheckerRouter)
app.use("/adswebsite", AdsWebsiteRouter)
app.use("/natural", NautraWebsiteRouter)
app.use("/casinotraffic", CasinoTrafficRouter)
app.use("/pbntraffic", PbnWebsiteRouter)


app.use("/api", CreatelinkRoutes);
app.get("/:slug", redirect);

app.listen(PORT, () => {
    console.log('Server is Running');
})
require('./cron/autoUpdater');