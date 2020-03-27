var jwt = require("jsonwebtoken");

// After login redirect to dashboard
exports.session = function(req, res, next) {
  if (req.session.user && req.cookies.user_sid) {
    res.redirect("/dashboard");
  } else {
    return next();
  }
};

// Validate login
exports.isLoggedIn = function(req, res, next) {
  if (!req.session.user || !req.cookies.user_sid) {
    res.redirect("/");
  } else {
    next();
  }
};

// Verify API token
exports.verifyToken = function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers["x-access-token"];
  // verifies secret and checks exp
  jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err) {
      return res.json({
        success: false,
        message: "Failed to authenticate token."
      });
    }
    next();
  });
};

// Generate token for API
exports.generateJwtToken = function(payloadData, callback) {
  const payload = payloadData;
  var token = jwt.sign(payload, process.env.JWT_SECRET, {
     expiresIn: "1h" // 1 hours
     // expiresIn:   // 60 * 60 * 24 * 365 * 10 // expires in 10 years
    // expiresIn: 60 // expires in 1 minute
  });
  callback(false, token);
};

// decode token
exports.getTokenDetail = function (token, callback) {
  var payload = jwt.decode(token);
  callback(false, payload)
}

