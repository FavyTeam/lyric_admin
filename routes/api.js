var express = require("express");
var jwt = require("jsonwebtoken");
var router = express.Router();
var multer = require("multer");

var fileUpload = require("../functions/fileupload");

var upload = multer({
  dest: "temp_uploads/",
  fileFilter: fileUpload.fileFilterFunc
});
upload = upload.single("img");


var Login = require("../api/controllers/loginController");
var authenticate = require("../functions/authenticate");
var Music = require("../api/controllers/musicController");
var Interview = require("../api/controllers/interviewController");
var Events = require("../api/controllers/eventController");
var Products = require("../api/controllers/productController");
var Payment = require("../api/controllers/paymentController");
var User = require("../api/controllers/userController");
var Categories = require("../controllers/filterCategories");
var Embed = require("../api/controllers/embedController");
var LL2 = require("../api/controllers/ll2Controller");

// Login
router.post("/signup", Login.signup);
router.post("/login", Login.login);
router.post("/updateProfile", authenticate.verifyToken, Login.updateProfile);
router.post("/updateProfileImage", authenticate.verifyToken, upload, Login.updateProfileImage);
router.post("/forgot-password", Login.forgotPassword);
router.post("/deleteProfileImage", authenticate.verifyToken, Login.deleteProfileImage);
// Music
router.get("/get_musics", Music.getAllMusic);
// Interview
router.get("/get_interviews", Interview.getAllInterview);
// Events
router.get("/get_events", authenticate.verifyToken, Events.getAllEvents);
//Embed
router.get("/get_embeds", authenticate.verifyToken, upload, Embed.getAllEmbedVideos);
//ll2
router.get("/get_ll2", LL2.getAllLL2);

// products
router.get("/get_products", authenticate.verifyToken, Products.getAllProducts);
router.get("/get_products_new", authenticate.verifyToken, Products.getAllProduct);
router.post("/add_removefavourite", authenticate.verifyToken, Products.addRemoveFavourite);
router.get("/get_favouriteProduct", authenticate.verifyToken, Products.getFavourite);

// payments
router.post("/payment/create_token", authenticate.verifyToken, Payment.createToken);
router.post("/payment/addCard", authenticate.verifyToken, Payment.addCard);
router.get("/payment/cardlist", authenticate.verifyToken, Payment.cardList);
router.post("/payment/createCharge", authenticate.verifyToken, Payment.createCharge);
router.post("/payment/removeCard", authenticate.verifyToken, Payment.removeCard);
router.post("/payment/createOrders", authenticate.verifyToken, Payment.createOrder);
router.get("/get_pastOrder", authenticate.verifyToken, Payment.OrderHistory);

// shiping
router.post("/shipping/add", authenticate.verifyToken, User.addShippingAddress);
router.get("/shipping/get", authenticate.verifyToken, User.getShippingAddress);
router.delete("/shipping/remove", authenticate.verifyToken, User.removeShippingAddress);

// search by all category
router.get("/getCategories", authenticate.verifyToken, Categories.getAllCategories);

module.exports = router;
