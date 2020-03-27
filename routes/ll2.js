var multer = require("multer");
var csrf = require("csurf");
var express = require("express");
var router = express.Router();

var fileUpload = require("../functions/fileupload");

var upload = multer({
  dest: "temp_uploads/",
  fileFilter: fileUpload.fileFilterFunc
});
upload = upload.single("img");

var csrfProtection = csrf();

var LL2 = require("../controllers/ll2Controller");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, LL2.index);
router.get("/list", csrfProtection, authenticate.isLoggedIn, LL2.list);
router.get("/add", csrfProtection, authenticate.isLoggedIn, LL2.add).post("/add", upload, csrfProtection, authenticate.isLoggedIn, LL2.save);
router.post("/ajax/list", authenticate.isLoggedIn, LL2.ajaxLL2List);
router.post("/delete/:id", authenticate.isLoggedIn, LL2.delete);
router.get("/edit/:id",csrfProtection, authenticate.isLoggedIn, LL2.edit).post("/edit/:id",upload,csrfProtection,authenticate.isLoggedIn,LL2.update);


module.exports = router;
