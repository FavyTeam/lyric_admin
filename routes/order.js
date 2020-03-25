var csrf = require("csurf");
var express = require("express");
var router = express.Router();


var csrfProtection = csrf();

var Order = require("../controllers/orderController");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, Order.index);
router.get("/list", csrfProtection, authenticate.isLoggedIn, Order.list);
router.post("/ajax/list", authenticate.isLoggedIn, Order.ajaxOrderList);
router.get("/list/user/:userId", csrfProtection, authenticate.isLoggedIn, Order.list)
router.get("/list/product/:productId", csrfProtection, authenticate.isLoggedIn, Order.list)

module.exports = router;