const express = require("express");
const router = express.Router();
const {
  subscribeUser,
  getAllUsers,
  deleteUser
} = require("../Controllers/CollectMailDataControllder");

// Routes
router.post("/subscribe", subscribeUser);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

module.exports = router;
