var createError = require("http-errors");
var sanitize = require("mongo-sanitize");
var User = require("../models/user");

exports.login = function(req, res, next) {
  var messages = req.flash("error");
  var form = req.flash("form")[0] || null;
  var data = {
    title: "Login",
    errors: messages,
    form: form,
    csrfToken: req.csrfToken()
  };
  res.render("index", data);
};

exports.verifyLogin = function(req, res, next) {
  try {
    req.checkBody("email", "Email is required").notEmpty();
    req.checkBody("password", "Password is required").notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      var messages = [];
      errors.forEach(function(error) {
        messages.push(error.msg);
      });
      req.flash("form", req.body);
      throw messages;
    }
    var messages = [];
    User.findOne({ email: sanitize(req.body.email) })
      .then(function(user) {
        if (!user) {
          messages.push("Invalid login");
          throw messages;
        } else if (!user.validPassword(sanitize(req.body.password))) {
          messages.push("Invalid login");
          throw messages;
        } else if (user.type !== 'admin') {
          throw new Error('You are not autorized to access admin section')
        }
         else {
          req.session.user = user;
          res.redirect("/dashboard");
        }
      })
      .catch(err => {
        req.flash("error", err.message || err);
        return res.redirect("/");
      });
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/");
  }
};

exports.logout = function(req, res, next) {
  if (req.session.user && req.cookies.user_sid) {
    res.clearCookie("user_sid");
    res.redirect("/");
  } else {
    res.redirect("/");
  }
};

exports.resetPassword = function(req, res, next) {
  try {
    var errorMsg = req.flash("error");
    var successMsg = req.flash("success");

    var token = req.params.token;
    if (!token || token == "") {
      throw new Error("The page you are looking for might have been removed or had its name changed or is temporarily unavailable.");
    }
    User.findOne({ reset_token: sanitize(token) }, function(err, result) {
      try {
        if (err) {
          throw new Error("There is someting went wrong. Please try again with new forgot password request.");
        }
        if (!result) {
          throw new Error("The page you are looking for might have been removed or had its name changed or is temporarily unavailable.");
        }
        data = {
          title: "Reset Password",
          error: errorMsg,
          success: successMsg,
          csrfToken: req.csrfToken()
        };
        return res.render("resetPassword", data);
      } catch (Err) {
        next(createError(404, Err));
      }
    });
  } catch (Err) {
    next(createError(404, Err));
  }
};

exports.updatePassword = function(req, res) {
  try {
    var token = req.params.token;
    if (!token || token.trim() == "") {
      next(createError(404, "The page you are looking for might have been removed or had its name changed or is temporarily unavailable."));
    }

    req.checkBody("newPassword", "New password field is required.").notEmpty();
    req.checkBody("confirmPassword", "Confirm Password field is required.").notEmpty();

    var errors = req.validationErrors();

    if (errors) {
      var messages = [];
      errors.forEach(function(error) {
        messages.push(error.msg);
      });
      throw messages;
    }

    var newPassword = req.body.newPassword.trim();
    var confirmPassword = req.body.confirmPassword.trim();

    if (newPassword !== confirmPassword) {
      throw new Error("New password and Confirm password didn't matched.");
    }

    User.findOne({ reset_token: sanitize(token) }, function(err, user) {
      try {
        if (err) {
          throw new Error("The page you are looking for might have been removed or had its name changed or is temporarily unavailable.");
        }

        var updateUser = new User();

        user.password = updateUser.encryptPassword(sanitize(req.body.newPassword));
        user.reset_token = "";
        user.save(function(saveErr, result) {
          if (saveErr) {
            req.flash("error", "Password didn't updated successfully. Please try again.");
            return res.redirect("/reset-password/" + req.params.token);
          }
          return res.redirect("/thank-you/");
        });
      } catch (Err) {
        next(createError(404, Err));
      }
    });
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/reset-password/" + req.params.token);
  }
};

exports.thankYou = function(req, res) {
  data = {
    title: "Thank You",
    message: "Your password has been updated successfully."
  };
  return res.render("thank-you", data);
};
