const express = require("express");
const { checkTraffic, GetallUniqueDomains, domainTraffic, GetLast7DaysTraffic, GetTopCountries, GetLast7DaysByDomain, GetCountriesByDomain, addOrUpdateNote, getNote, getAllNotes, deleteNote } = require("../Controllers/TrafficCheckerController");
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');


// Routes
router.post("/traffic-check", checkTraffic);
router.get('/unique/domains', ensureAuthenticated, GetallUniqueDomains);
router.get('/stats/domain/:domain', ensureAuthenticated, domainTraffic);
router.get("/unique/domains/last7days", ensureAuthenticated, GetLast7DaysTraffic);
router.get("/stats/top-countries", ensureAuthenticated, GetTopCountries);
router.get("/stats/domains/:domain", ensureAuthenticated, GetLast7DaysByDomain);
router.get("/stats/domain/:domain/countries", ensureAuthenticated, GetCountriesByDomain);

router.post("/notes/add", ensureAuthenticated, addOrUpdateNote);
router.get("/notes/:domain", ensureAuthenticated, getNote);
router.get("/notes", ensureAuthenticated, getAllNotes);
router.delete("/notes/:domain", ensureAuthenticated, deleteNote);

module.exports = router;