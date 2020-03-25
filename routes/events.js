var multer = require("multer");
var csrf = require("csurf");
var express = require("express");
var router = express.Router();

var fileUpload = require("../functions/fileupload");

var upload = multer({
  dest: "temp_uploads/",
  fileFilter: fileUpload.fileFilterFunc
});
upload = upload.single("eventImg");

var csrfProtection = csrf();

var Events = require("../controllers/eventController");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, Events.index);
router.get("/list", csrfProtection, authenticate.isLoggedIn, Events.list);
router.post("/ajax/eventslist", authenticate.isLoggedIn, Events.ajaxEventList);
router.get("/add", csrfProtection, authenticate.isLoggedIn, Events.add).post("/add", upload, csrfProtection, authenticate.isLoggedIn, Events.save);
router.get("/edit/:id", csrfProtection, authenticate.isLoggedIn, Events.edit).post("/edit/:id", upload, csrfProtection, authenticate.isLoggedIn, Events.update);
router.post("/delete/:id", authenticate.isLoggedIn, Events.delete);

module.exports = router;