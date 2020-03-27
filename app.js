var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var session = require("express-session");
var flash = require("connect-flash");
var validator = require("express-validator");
var MongoStore = require("connect-mongo")(session);
var environment = require("./environment/config");

var indexRouter = require("./routes/index");
var dashboardRouter = require("./routes/dashboard");
var usersRouter = require("./routes/users");
var musicRouter = require("./routes/music");
var ll2Router = require("./routes/ll2");
var interviewRouter = require("./routes/interview");
var eventsRouter = require("./routes/events");
var apiRouter = require("./routes/api");
var productRouter = require("./routes/product");
var orderRouter = require("./routes/order");
var embedRouter = require("./routes/embed");

// using this file to create a admin
require("./seeds/user-seeder");

var app = express();

mongoose.connect(process.env.MONGO_URL, { useCreateIndex: true, useNewUrlParser: true });

// view engine setup
app.set("views", [
  path.join(__dirname, "views"),
  path.join(__dirname, "views/user/"),
  path.join(__dirname, "views/interview/"),
  path.join(__dirname, "views/music/"),
  path.join(__dirname, "views/ll2/"),
  path.join(__dirname, "views/event/"),
  path.join(__dirname, "views/embed/"),
  path.join(__dirname, "views/product/"),
  path.join(__dirname, "views/order")
]);
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(
  session({
    key: "user_sid",
    secret: "F)J@NcRfUjWnZr4u7x!A%D*G-KaPdSgVkYp2s5v8y/B?E(H+MbQeThWmZq4t6w9z",
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: { maxAge: 180 * 60 * 1000 } // 3 hours
  })
);
app.use(flash());

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie("user_sid");
  }
  next();
});

app.use("/", indexRouter);
app.use("/dashboard", dashboardRouter);
app.use("/user", usersRouter);
app.use("/music", musicRouter);
app.use("/ll2", ll2Router);
app.use("/interview", interviewRouter);
app.use("/events", eventsRouter);
app.use("/api", apiRouter);
app.use("/product", productRouter);
app.use("/order", orderRouter);
app.use("/embed", embedRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  //res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
