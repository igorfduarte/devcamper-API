const hpp = require("hpp");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const helmet = require("helmet");
const xss = require("xss-clean");
const express = require("express");
const rateLimit = require("express");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const mongoSanitize = require("express-mongo-sanitize");
const logger = require("./middleware/logger.middleware");
const errorHandler = require("./middleware/error.middleware");
//load vars
dotenv.config({ path: "./config/.env" });
//connect to DB
connectDB();

const app = express();
app.use(express.json());

//Routes
const bootcamps = require("./routes/bootcamps.router");
const courses = require("./routes/courses.router");
const auth = require("./routes/auth.router");
const users = require("./routes/users.router");
const reviews = require("./routes/reviews.router");

// DEV logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(logger);
}

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10min
  max: 100,
});

app.use(xss());
app.use(hpp());
app.use(cors());
app.use(limiter);
app.use(helmet());
app.use(fileUpload());
app.use(cookieParser());
app.use(mongoSanitize());
app.use(express.static(path.join(__dirname, "public")));

//Mount routes
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log("Server running"));

//handle unhancled promises rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
