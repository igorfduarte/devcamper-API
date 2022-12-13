const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse.utils");
const sendEmail = require("../utils/sendEmail.utils");
const User = require("../models/user.model");
const crypto = require("crypto");
//post register user at /api/v1/auth/register
//access public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  //create token
  sendTokenResponse(user, 200, res);
});

//post login user at /api/v1/auth/login
//access public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //validate email and pass
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  //check user
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorResponse("invalid credentials", 401));
  }

  //check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse("invalid credentials", 401));
  }

  sendTokenResponse(user, 200, res);
});

//@desc   Get current logged in user
//@route  POST /api/v1/auth/me
//@access private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({ sucess: true, data: user });
});

//@desc   Update user details
//@route  POST /api/v1/auth/updatedetails
//@access private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ sucess: true, data: user });
});

//@desc   update password
//@route  PUT /api/v1/auth/updatepassword
//@access private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  //check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("incorrect password", 401));
  }

  user.password = req.body.newPassword;

  user.save();

  sendTokenResponse(user, 200, res);
});

//@desc  Forgot password
//@route  POST /api/v1/auth/forgotpassword
//@access public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("no user with that email", 404));
  }

  const resetToken = user.getResetToken();

  await user.save({ validateBeforeSave: false });

  //create reset url
  const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/resetpassword/${resetToken}`;

  const message = ` request password reset to ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (error) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent", 500));
  }

  res.status(200).json({ sucess: true, data: user });
});

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.resettoken).digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

//@desc   Logout current logged in user
//@route  GET /api/v1/auth/logout
//@access private
exports.logout = asyncHandler(async (req, res, next) => {

  res.cookie('token','none',{
    expires: new Date(Date.now()+10*1000),
    httpOnly:true
  })
  

  res.status(200).json({ sucess: true, data: {} });
});

// get token from model,create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({ sucess: true, token });
};
