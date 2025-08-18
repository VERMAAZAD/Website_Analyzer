const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../Middlewares/Auth");
const auth = require("../Middlewares/Auth");
const { addHostingInfo, getHostingList, updateHostingInfoEverywhere, catchByServer } = require("../Controllers/HostingController");

router.post("/add-hostingInfo", auth, ensureAuthenticated, addHostingInfo);
router.get("/get-hostingInfo", auth, ensureAuthenticated, getHostingList);
router.put("/update-hosting", auth, ensureAuthenticated, updateHostingInfoEverywhere);
module.exports = router;
