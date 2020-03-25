var User = require("../models/user");
var assert = require("assert");
var environment = require("../environment/config");
var sanitize = require("mongo-sanitize");

var mongoose = require("mongoose");

try {
 const admin_email = "admin@lyricallemonade.com";
  User.findOne({ email: sanitize(admin_email.trim()), type: "admin", status: true })
      .then(result => {
        if (!result) {
          console.log("admin account not found");
          mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });

          var password = "Test1234";
        
          var adminUser = new User();
          adminUser.email = admin_email;
          adminUser.first_name = "admin";
          adminUser.last_name = "Lyrical lemonde";
          adminUser.password = adminUser.encryptPassword(password);
          adminUser.type = "admin";
          adminUser.created_at = new Date();
          adminUser.updated_at = new Date();
        
          var error = adminUser.validateSync();
          assert.equal(error, null);
          adminUser.save(function(err, result) {
            if (err) {
              console.log(err);
              throw err;
            } else {
              console.log("First user created successfully!!");
              mongoose.disconnect();
            }
          });
        }
      })

} catch (err) {
  console.log("Err >>>", err.message || err);
}
