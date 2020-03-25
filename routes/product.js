var multer = require("multer");
var csrf = require("csurf");
var express = require("express");
var router = express.Router();

var fileUpload = require("../functions/fileupload");

var upload = multer({
  dest: "temp_uploads/",
  fileFilter: fileUpload.fileFilterFunc
});
upload = upload.array("product_image", 4);

var csrfProtection = csrf();

var Product = require("../controllers/productController");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, Product.index);
router.get("/list", csrfProtection, authenticate.isLoggedIn, Product.list);
router.get("/add", csrfProtection, authenticate.isLoggedIn, Product.add).post("/add", upload, csrfProtection, authenticate.isLoggedIn, Product.save);
router.post("/ajax/list", authenticate.isLoggedIn, Product.ajaxProductList);
router.post("/delete/:id", authenticate.isLoggedIn, Product.delete);
router.get("/edit/:id", csrfProtection, authenticate.isLoggedIn, Product.edit).post("/edit/:id", upload, csrfProtection, authenticate.isLoggedIn, Product.update);



module.exports = router;