var sanitize = require("mongo-sanitize");
var util = require("util");
var fs = require("fs");
var path = require("path");
var uuidV1 = require("uuid/v1");
var Embed = require("../models/embed");
var async = require("async");
var jimp = require("jimp");

exports.index = function(req, res) {
  res.redirect("/embed/list");
};

exports.list = function(req, res) {
  try {
    var errMsg = req.flash("error");
    var successMsg = req.flash("success");

    var data = {
      title: "Embed Video List",
      errors: errMsg,
      success: successMsg
    };
    res.render("embed-list", data);
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
      title: "Add New YouTube Video",
      errors: errMsg,
      success: successMsg,
      form,
      form,
      csrfToken: req.csrfToken()
    };
    res.render("embed-add", data);
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/embed/add");
  }
};

exports.edit = function(req, res) {
  try {
    if (!req.params.id || req.params.id == "") {
      throw new Error("Invalid request.");
    }
    Embed.find({ _id: req.params.id })
      .then(result => {
        var errMsg = req.flash("error");
        var successMsg = req.flash("success");
        var data = {
          title: "Edit Video Information",
          errors: errMsg,
          success: successMsg,
          form: result[0],
          csrfToken: req.csrfToken()
        };
        return res.render("embed-add", data);
      })
      .catch(err => {
        return res.json({
          success: false,
          error: err.message || err
        });
      });
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/embed/edit/" + req.params.id);
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
            req.checkBody("youtube_url", "Youtube url is required").notEmpty();
            req.checkBody("title", "Title is required").notEmpty();
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
              var newFile = "public/uploads/" + newFileName;
              var thumbnailFile = "public/uploads/thumb/" + newFileName;
              const old_filepath = `public/uploads/${req.body.image}`;
              const old_thumbpath = `public/uploads/thumb/${req.body.image}`;
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
          Embed.findByIdAndUpdate(_id, req.body, { new: true }, function(err, model) {
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
          return res.redirect(`/embed/list`);
        }
        req.flash("success", "Embed Video update successfully!");
        return res.redirect(`/embed/list`);
      }
    );
  } catch (err) {
    req.flash("form", req.body);
    req.flash("error", err.message || err);
    return res.redirect(`/embed/list`);
  }
};

exports.save = function(req, res) {
  try {
    async.waterfall(
      [
        function(callback) {
          req.checkBody("title", "Title is required").notEmpty();
          req.checkBody("youtube_url", "Youtube url is required").notEmpty();
          console.log("req.body", req.body);
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
          if (!req.file) {
            callback(null);
          } else {
            var file = req.file;
            var generateNewName = uuidV1();
            var fileExt = path.extname(file.originalname);
            var newFileName = generateNewName + fileExt;
            var newFile = "public/uploads/" + newFileName;
            var thumbnailFile = "public/uploads/thumb/" + newFileName;
            fs.renameSync(file.path, newFile);
            jimp
              .read(newFile)
              .then(result => {
                result
                  .resize(250, jimp.AUTO) // resize
                  .write(thumbnailFile); // save
                req.body.image = newFileName;
                callback(null); // 3rd function
              })
              .catch(jimp_error => {
                callback(jimp_error);
              });
          }
        },
        function(callback) {
          // 3rd function

          var embed = new Embed();
          embed.title = sanitize(req.body.title.trim());
          embed.youtube_url = sanitize(req.body.youtube_url.trim());
          embed.image = req.body.image ? sanitize(req.body.image.trim()) : "";
          embed.save((err, result) => {
            callback(err); // call final function
          });
        }
      ],
      function(err, result) {
        // final function
        if (err) {
          req.flash("form", req.body);
          req.flash("error", err.message || err);
          return res.redirect(`/embed/add`);
        }
        req.flash("success", "New YouTube Video added successfully!");
        return res.redirect(`/embed/list`);
      }
    );
  } catch (error) {
    req.flash("form", req.body);
    req.flash("error", error.message || error);
    return res.redirect(`/embed/add`);
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
          Embed.findById(req.params.id, { image: 1 })
            .then(result => {
              const old_filepath = `public/uploads/${result.image}`;
              const old_thumbpath = `public/uploads/thumb/${result.image}`;
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
          Embed.deleteOne({ _id: req.params.id })
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
          message: "successfully delete selected record",
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

exports.ajaxEmbedList = function(req, res) {
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
          title: { $regex: req.body["search[value]"], $options: "ig" }
        }
      ];
    }
    Embed.aggregate()
      //.match({ type: "user" })
      .facet({
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [
          {
            $project: {
              _id: 0,
              title: 1,
              youtube_url: 1,
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
        return res.status(400).json({
          success: false,
          error: err.message || err
        });
      });
  } catch (Err) {
    return res.status(500).json({
      success: false,
      error: Err.message || Err
    });
  }
};
