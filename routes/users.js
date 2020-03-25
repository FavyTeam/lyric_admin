var multer = require("multer");
var csrf = require("csurf");
var express = require("express");
var router = express.Router();

var fileUpload = require("../functions/fileupload");

var upload = multer({
  dest: "temp_uploads/users_image",
  fileFilter: fileUpload.fileFilterFunc
});
upload = upload.single("User_img");

var csrfProtection = csrf();

var Users = require("../controllers/usersController");
var authenticate = require("../functions/authenticate");

router.get("/", csrfProtection, authenticate.isLoggedIn, Users.index);
router.get("/list", csrfProtection, authenticate.isLoggedIn, Users.list);
router.get("/add", csrfProtection, authenticate.isLoggedIn, Users.add).post("/add", upload, csrfProtection, authenticate.isLoggedIn, Users.save);
router.post("/change-status/:id", authenticate.isLoggedIn, Users.changeStatus);
router.post("/delete/:id", authenticate.isLoggedIn, Users.delete);
router.post("/ajax/userlist", authenticate.isLoggedIn, Users.ajaxUserList);
router.get("/edit/:id", csrfProtection, authenticate.isLoggedIn, Users.edit).post("/edit/:id", upload, csrfProtection, authenticate.isLoggedIn, Users.update);


module.exports = router;
