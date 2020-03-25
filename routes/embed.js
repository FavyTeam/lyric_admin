var multer = require("multer");
var csrf = require("csurf");
var express = require("express");
var router = express.Router();

var fileUpload = require("../functions/fileupload");

var upload = multer({
  dest: "temp_uploads/",
  fileFilter: fileUpload.fileFilterFunc
});
upload = upload.single("embedImg");

var csrfProtection = csrf();

var Embed = require("../controllers/embedController");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, Embed.index);
router.get("/list", csrfProtection, authenticate.isLoggedIn, Embed.list);
router.get("/add", csrfProtection, authenticate.isLoggedIn, Embed.add).post("/add", upload, csrfProtection, authenticate.isLoggedIn, Embed.save);
router.post("/ajax/list", authenticate.isLoggedIn, Embed.ajaxEmbedList);
router.post("/delete/:id", authenticate.isLoggedIn, Embed.delete);
router
  .get("/edit/:id", csrfProtection, authenticate.isLoggedIn, Embed.edit)
  .post("/edit/:id", upload, csrfProtection, authenticate.isLoggedIn, Embed.update);

module.exports = router;
