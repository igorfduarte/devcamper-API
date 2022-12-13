const Course = require("../models/course.model");
const Bootcamp = require("../models/bootcamp.model");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse.utils");

// GET all courses at /api/v1/courses
// GET all courses within a bootcamp /api/v1/bootcamps/:bootcampId/courses
//access public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// GET single course at /api/v1/courses/:id
//access public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    return next(new ErrorResponse("No course with the id of: " + req.params.id), 404);
  }

  res.status(200).json({
    success: true,
    data: course,
  });
});

// POST course at /api/v1/bootcamps/:bootcampId/courses
//access private
exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(new ErrorResponse("No bootcamp with the id of: " + req.params.bootcampId), 404);
  }

  //check if user is the bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to add course to this bootcamp`, 401)
    );
  }

  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data: course,
  });
});

// PUT course at /api/v1/courses/:id
//access private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse("No course with the id of: " + req.params.id), 404);
  }

  //check if user is the bootcamp owner
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update course`, 401));
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: course,
  });
});

// DELETE course at /api/v1/courses/:id
//access private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(new ErrorResponse("No course with the id of: " + req.params.id), 404);
  }
  //check if user is the bootcamp owner
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete course`, 401));
  }

  await course.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
