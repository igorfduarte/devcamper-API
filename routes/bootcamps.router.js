const express = require("express");
const advancedResults = require("../middleware/advancedResults.middleware");
const Bootcamp = require("../models/bootcamp.model");
const {
  getBootcamp,
  getBootcamps,
  updateBootcamp,
  createBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  bootcampPhotoUpload,
} = require("../controllers/bootcamps.controller.js");

const { protect, authorize } = require("../middleware/auth.middleware");

//include other resource router
const courseRouter = require("./courses.router");
const reviewsRouter = require("./reviews.router");

const router = express.Router();

//re-route into other resource routers
router.use("/:bootcampId/courses", courseRouter);
router.use("/:bootcampId/reviews", reviewsRouter);

router
  .route("/")
  .get(advancedResults(Bootcamp, "courses"), getBootcamps)
  .post(protect, authorize("publisher", "admin"), createBootcamp);

router
  .route("/:id")
  .get(getBootcamp)
  .put(protect, authorize("publisher", "admin"), updateBootcamp)
  .delete(protect, authorize("publisher", "admin"), deleteBootcamp);

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

router.route("/:id/photo").put(protect, authorize("publisher", "admin"), bootcampPhotoUpload);

module.exports = router;
