const express = require("express");
const router = express.Router();
const {
  subscribeUser,
  getAllUsers
} = require("../Controllers/CollectMailDataControllder");

// Routes
router.post("/subscribe", subscribeUser);
router.get("/users", getAllUsers);

module.exports = router;
