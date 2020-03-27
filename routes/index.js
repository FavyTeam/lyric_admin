var csrf = require("csurf");
var express = require("express");
var router = express.Router();

var csrfProtection = csrf({ cookie: true });

var auth = require("../functions/authenticate");
var Login = require("../controllers/loginController");

router.get("/favicon.ico", (req, res) => res.status(204));

router.get("/", csrfProtection, auth.session, Login.login).post("/", csrfProtection, Login.verifyLogin);

router.get("/logout", csrfProtection, auth.isLoggedIn, Login.logout);

router.get("/reset-password/:token", csrfProtection, Login.resetPassword).post("/reset-password/:token", csrfProtection, Login.updatePassword);

router.get("/thank-you", Login.thankYou);
// router.get("/thank-you", csrfProtection, Login.thankYou);



module.exports = router;
