var csrf = require("csurf");
var express = require("express");
var router = express.Router();

var csrfProtection = csrf();

var Dashboard = require("../controllers/dashboardController");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, Dashboard.view);

module.exports = router;
