var sanitize = require("mongo-sanitize");
var util = require("util");
var fs = require("fs");
var path = require("path");
var uuidV1 = require("uuid/v1");
var User = require("../models/user");
var async = require("async");
var jimp = require("jimp");

exports.index = function(req, res) {
  res.redirect("/user/list");
};

exports.list = function(req, res) {
  try {
    var errMsg = req.flash("error");
    var successMsg = req.flash("success");

    var data = {
      title: "User List",
      errors: errMsg,
      success: successMsg
    };
    res.render("user-list", data);
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/dashboard");
  }
};

exports.add = function(req, res) {
  try {
    var errMsg = req.flash("error");
    var successMsg = req.flash("success");
    var form = req.flash("form")[0] || null;

    var data = {
      title: "Add New User",
      errors: errMsg,
      success: successMsg,
      form,
      form,
      csrfToken: req.csrfToken()
    };
    res.render("user-add", data);
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/user/add");
  }
};

exports.edit = function(req, res) {
  try {
    if (!req.params.id || req.params.id == "") {
      throw new Error("Invalid request.");
    }
    User.find({ _id: req.params.id })
      .then(result => {
        var errMsg = req.flash("error");
        var successMsg = req.flash("success");
        var data = {
          title: "Edit User Information",
          errors: errMsg,
          success: successMsg,
          form: result[0],
          csrfToken: req.csrfToken()
        };
        return res.render("user-add", data);
      })
      .catch(err => {
        return res.json({
          success: false,
          error: err.message || err
        });
      });
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/user/edit/" + req.params.id);
  }
};

exports.update = function(req, res, next) {
  try {
    const _id = req.params.id;
    if (!_id || _id == "") {
      throw new Error("Invalid request.");
    }
    async.waterfall(
      [
        function(callback) {
          // function 1
          try {
            req.checkBody("first_name", "First name is required").notEmpty();
            req.checkBody("email", "Email address is required").isEmail();
            req.checkBody("password", "Password is required").notEmpty();
            var errors = req.validationErrors();
            if (errors && errors.length) {
              var messages = [];
              errors.forEach(function(error) {
                messages.push(error.msg);
              });
              throw messages;
            }
            callback(null); // call function 2
          } catch (err) {
            callback(err); // call final function
          }
        },
        function(callback) {
          // function 2
          try {
            if (req.file) {
              var file = req.file;
              var generateNewName = uuidV1();
              var fileExt = path.extname(file.originalname);
              var newFileName = generateNewName + fileExt;
              var newFile = "public/users_image/" + newFileName;
              var thumbnailFile = "public/users_image/thumb/" + newFileName;
              const old_filepath = `public/users_image/${req.body.image}`;
              const old_thumbpath = `public/users_image/thumb/${req.body.image}`;
              if (fs.existsSync(old_filepath)) {
                //file exists
                fs.unlinkSync(old_filepath);
              }
              if (fs.existsSync(old_thumbpath)) {
                //file exists
                fs.unlinkSync(old_thumbpath);
              }

              fs.renameSync(file.path, newFile);
              jimp
                .read(newFile)
                .then(result => {
                  result
                    .resize(150, jimp.AUTO) // resize
                    .write(thumbnailFile); // save

                  req.body.image = newFileName;
                  callback(null); // call function 3
                })
                .catch(jimp_error => {
                  callback(jimp_error); // call final function
                });
            } else {
              callback(null); // call function 3
            }
          } catch (err) {
            callback(err); // call final function
          }
        },
        function(callback) {
          // function 3
          User.findByIdAndUpdate(_id, req.body, { new: true }, function(err, model) {
            if (err) {
              if (err.code && err.code === 11000) {
                callback(err.errmsg); // call final function
              }
            }
            callback(null, model);
          });
        }
      ],
      function(err, result) {
        // final function
        if (err) {
          req.flash("form", req.body);
          req.flash("error", err.message || err);
          return res.redirect(`/user/list`);
        }
        req.flash("success", "User update successfully!");
        return res.redirect(`/user/list`);
      }
    );
  } catch (err) {
    req.flash("form", req.body);
    req.flash("error", err.message || err);
    return res.redirect(`/user/list`);
  }
};

exports.save = async function(req, res) {
  try {
    async.waterfall(
      [
        function(callback) {
          req.checkBody("first_name", "First name is required").notEmpty();
          req.checkBody("email", "Email address is required").notEmpty();
          req.checkBody("password", "Password is required").notEmpty();

          var errors = req.validationErrors();
          if (errors) {
            var messages = [];
            errors.forEach(function(error) {
              messages.push(error.msg);
            });
            callback(messages); // call final function if error occur
          }
          callback(null); // call 2nd function
        },
        function(callback) {
          // 2nd function
          User.find({ email: req.body.email }, { $exists: true }, (error, emailExists) => {
            if (error) {
              callback(error);
            } else if (emailExists && emailExists.length) {
              callback("Email already exists");
            } else {
              callback(null);
            }
          });
        },
        function(callback) {
          // 3rd function
          if (!req.file) {
            callback("Please upload user image.");
          }
          var file = req.file;
          var generateNewName = uuidV1();
          var fileExt = path.extname(file.originalname);
          var newFileName = generateNewName + fileExt;
          var newFile = "public/users_image/" + newFileName;
          var thumbnailFile = "public/users_image/thumb/" + newFileName;
          fs.renameSync(file.path, newFile);
          jimp
            .read(newFile)
            .then(result => {
              result
                .resize(250, jimp.AUTO) // resize
                .write(thumbnailFile); // save
              req.body.image = newFileName;
              callback(null); // 4th function
            })
            .catch(jimp_error => {
              callback(jimp_error); // 4th function
            });
        },
        function(callback) {
          // 4th function
          try {
            var password = sanitize(req.body.password.trim());

            var user = new User();
            user.first_name = sanitize(req.body.first_name.trim());
            user.last_name = sanitize(req.body.last_name.trim()) || "";
            user.email = sanitize(req.body.email.trim());
            user.password = user.encryptPassword(password);
            user.image = sanitize(req.body.image.trim());
            user.status = true;
            user.save((err, result) => {
              if (err) {
                callback(err); // call final function
              }
              callback(null, result); // call final function
            });
          } catch (error) {
            callback(error); // call final function
          }
        }
      ],
      function(err, result) {
        // final function
        if (err) {
          req.flash("form", req.body);
          req.flash("error", err.message || err);
          return res.redirect(`/user/add`);
        }
        req.flash("success", "New User added successfully!");
        return res.redirect(`/user/list`);
      }
    );
  } catch (error) {
    req.flash("form", req.body);
    req.flash("error", error.message || error);
    return res.redirect(`/user/add`);
  }
};

exports.delete = function(req, res) {
  try {
    if (!req.params.id || req.params.id == "") {
      throw new Error("Invalid request.");
    }
    async.waterfall(
      [
        function(callback) {
          User.findById(req.params.id, { image: 1 })
            .then(result => {
              const old_filepath = `public/users_image/${result.image}`;
              const old_thumbpath = `public/users_image/thumb/${result.image}`;
              if (fs.existsSync(old_filepath)) {
                //file exists
                fs.unlinkSync(old_filepath);
              }
              if (fs.existsSync(old_thumbpath)) {
                //file exists
                fs.unlinkSync(old_thumbpath);
              }
              callback(null);
            })
            .catch(err => {
              callback(err);
            });
        },
        function(callback) {
          User.deleteOne({ _id: req.params.id })
            .then(result => {
              callback(null, result);
            })
            .catch(err => {
              callback(err);
            });
        }
      ],
      function(err, result) {
        // final function
        if (err) {
          return res.status(400).json({
            success: false,
            error: err.message || err
          });
        }
        return res.status(200).json({
          success: true,
          message: "successfully delete selected user",
          data: result
        });
      }
    );
  } catch (Err) {
    return res.status(500).json({
      success: false,
      error: Err.message || Err
    });
  }
};

exports.changeStatus = function(req, res) {
  try {
    if (!req.params.id || req.params.id == "") {
      throw new Error("Invalid request.");
    }
    if (!req.body.status || req.body.status.trim() === "") {
      throw new Error("Post data is missing.");
    }

    const updateData = {
      status: req.body.status.trim() == "Active" ? true : false
    };
    User.updateOne({ _id: req.params.id }, updateData)
      .then(result => {
        return res.json({
          success: true,
          message: "Status changed successfully!!"
        });
      })
      .catch(err => {
        return res.json({
          success: false,
          error: err.message || err
        });
      });
  } catch (Err) {
    return res.json({
      success: false,
      error: Err.message || Err
    });
  }
};

exports.ajaxUserList = function(req, res) {
  try {
    const limit = parseInt(req.body.length);
    const skip = parseInt(req.body.start);
    let matchQry = {};

    let sortQry = {};
    var columnOrderNo = req.body["order[0][column]"];
    var columnName = req.body["columns[" + columnOrderNo + "][data]"];
    var isOrderable = req.body["columns[" + columnOrderNo + "][orderable]"];
    if (isOrderable == "true") {
      sortQry[columnName] = req.body["order[0][dir]"] == "asc" ? 1 : -1;
    }

    if (req.body["search[value]"] != "") {
      matchQry["$or"] = [
        {
          first_name: { $regex: req.body["search[value]"], $options: "ig" }
        },
        {
          last_name: { $regex: req.body["search[value]"], $options: "ig" }
        },
        {
          email: { $regex: req.body["search[value]"], $options: "ig" }
        }
      ];
    }
    User.aggregate()
      .match({ type: "user" })
      .facet({
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [
          {
            $project: {
              _id: 0,
              first_name: 1,
              last_name: 1,
              email: 1,
              status: 1,
              id: "$_id"
            }
          },
          { $match: matchQry },
          { $sort: sortQry },
          { $skip: skip },
          { $limit: limit }
        ]
      })
      .unwind("$stage1")
      .project({
        recordsTotal: "$stage1.count",
        data: "$stage2",
        draw: req.body.draw,
        recordsFiltered: "$stage1.count"
      })
      .exec()
      .then(result => {
        if (result.length > 0) {
          if (req.body["search[value]"] != "") {
            result[0].recordsFiltered = result[0].data.length;
          }
        } else {
          result[0] = { recordsTotal: 0, data: [], draw: "1", recordsFiltered: 0 };
        }
        res.json(result[0]);
      })
      .catch(err => {
        return res.json({
          success: false,
          error: err.message || err
        });
      });
  } catch (Err) {
    return res.json({
      success: false,
      error: Err.message || Err
    });
  }
};
