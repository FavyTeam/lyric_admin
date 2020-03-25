var multer = require("multer");
var csrf = require("csurf");
var express = require("express");
var router = express.Router();

var fileUpload = require("../functions/fileupload");

var upload = multer({
  dest: "temp_uploads/",
  fileFilter: fileUpload.fileFilterFunc
});
upload = upload.single("interviewImg");

var csrfProtection = csrf();

var Interview = require("../controllers/interviewController");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, Interview.index);
router.get("/list", csrfProtection, authenticate.isLoggedIn, Interview.list);
router.get("/add", csrfProtection, authenticate.isLoggedIn, Interview.add).post("/add", upload, csrfProtection, authenticate.isLoggedIn, Interview.save);
router.post("/ajax/list", authenticate.isLoggedIn, Interview.ajaxInterviewList);
router.post("/delete/:id", authenticate.isLoggedIn, Interview.delete);
router.get("/edit/:id", csrfProtection, authenticate.isLoggedIn, Interview.edit).post("/edit/:id", upload, csrfProtection, authenticate.isLoggedIn, Interview.update);



module.exports = router;