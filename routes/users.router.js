const express = require("express");
const User = require("../models/user.model");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/users.controller.js");
const advancedResults = require("../middleware/advancedResults.middleware");
const { protect, authorize } = require("../middleware/auth.middleware");

const router = express.Router({ mergeParams: true });

router.use(protect)
router.use(authorize('admin'))

router.route("/")
.get(advancedResults(User),getUsers)
.post(advancedResults(User),createUser)

router.route("/:id")
.get(getUser)
.put(updateUser)
.delete(deleteUser)

module.exports = router;
