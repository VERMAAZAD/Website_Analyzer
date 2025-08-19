const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../Middlewares/Auth");
const { addHostingInfo, getHostingList, updateHostingInfoEverywhere } = require("../Controllers/HostingController");

router.post("/add-hostingInfo", ensureAuthenticated, addHostingInfo);
router.get("/get-hostingInfo", ensureAuthenticated, getHostingList);
router.put("/update-hosting", ensureAuthenticated, updateHostingInfoEverywhere);
module.exports = router;
