const express = require("express");
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviews.controller");

const Review = require("../models/review.model");

const router = express.Router({ mergeParams: true });

const advancedResults = require("../middleware/advancedResults.middleware");
const { protect, authorize } = require("../middleware/auth.middleware");

router.route("/").get(
  advancedResults(Review, {
    path: "bootcamp",
    select: "name description",
  }),
  getReviews
).post(protect,authorize('user','admin'),addReview);

router.route('/:id').get(getReview).put(protect,authorize('user','admin'),updateReview).delete(protect,authorize('user','admin'),deleteReview)

module.exports = router;