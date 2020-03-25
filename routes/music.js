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

var Music = require("../controllers/musicController");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, Music.index);
router.get("/list", csrfProtection, authenticate.isLoggedIn, Music.list);
router.get("/add", csrfProtection, authenticate.isLoggedIn, Music.add).post("/add", upload, csrfProtection, authenticate.isLoggedIn, Music.save);
router.post("/ajax/list", authenticate.isLoggedIn, Music.ajaxMusicList);
router.post("/delete/:id", authenticate.isLoggedIn, Music.delete);
router.get("/edit/:id",csrfProtection, authenticate.isLoggedIn, Music.edit).post("/edit/:id",upload,csrfProtection,authenticate.isLoggedIn,Music.update);


module.exports = router;
