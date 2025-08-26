const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../Middlewares/Auth");
const { addHostingInfo, getHostingList, updateHostingInfoEverywhere, catheServerData, updateServerInfo, updateServerEverywhere, getExpiringServers, renewServer, deleteServer } = require("../Controllers/HostingController");

router.post("/add-hostingInfo", ensureAuthenticated, addHostingInfo);
router.get("/get-hostingInfo", ensureAuthenticated, getHostingList);
router.put("/update-hosting", ensureAuthenticated, updateHostingInfoEverywhere);
router.put("/update-server/:id", ensureAuthenticated, updateServerInfo);
router.get("/by-server/:server", ensureAuthenticated, catheServerData);
router.put("/update-server-everywhere", ensureAuthenticated, updateServerEverywhere);
router.get("/server-expire", ensureAuthenticated, getExpiringServers);
router.post("/server-renew", ensureAuthenticated, renewServer);
router.delete("/delete-server/:id", ensureAuthenticated, deleteServer);


module.exports = router;
