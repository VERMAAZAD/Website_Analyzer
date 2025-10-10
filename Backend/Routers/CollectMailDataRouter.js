const express = require("express");
const router = express.Router();
const {
  subscribeUser,
  getAllUsers,
  deleteUser
} = require("../Controllers/CollectMailDataControllder");
const ensureAuthenticated = require("../Middlewares/Auth");

// Routes
router.post("/subscribe", subscribeUser);
router.get("/users", ensureAuthenticated, getAllUsers);
router.delete("/users/:id", ensureAuthenticated, deleteUser);

module.exports = router;
