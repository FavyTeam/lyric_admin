var sanitize = require("mongo-sanitize");
var util = require("util");
var fs = require("fs");
var path = require("path");
var uuidV1 = require("uuid/v1");
var jimp = require("jimp");
var async = require("async");
var moment = require("moment");

var Eventtable = require("../models/events");

exports.index = function(req, res) {
  res.redirect("/event/list");
};

exports.list = function(req, res) {
  try {
    var errMsg = req.flash("error");
    var successMsg = req.flash("success");

    var data = {
      title: "Event List",
      errors: errMsg,
      success: successMsg
    };
    res.render("event-list", data);
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
      title: "Add New Events",
      errors: errMsg,
      success: successMsg,
      form,
      form,
      csrfToken: req.csrfToken(),
      moment: moment
    };
    res.render("event-add", data);
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/events/add");
  }
};

exports.save = function(req, res) {
  try {
    async.waterfall(
      [
        function(callback) {
          req.checkBody("event_title", "Title is required").notEmpty();
          //req.checkBody("event_date", "Event Date is required").notEmpty();
          req.checkBody("event_time", "Event Time is required").notEmpty();
          req.checkBody("destination", "Destination is required").notEmpty();
          req.checkBody("category", "Category date is required").notEmpty();

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
            callback("Please upload event image.");
          }
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
        },
        function(callback) {
          // 3rd function
          try {
            var event = new Eventtable();
            event.event_title = sanitize(req.body.event_title.trim());
            event.event_date = sanitize(req.body.event_date.trim());
            event.destination = sanitize(req.body.destination.trim());
            event.event_time = sanitize(req.body.event_time.trim());
            event.organized_by = sanitize(req.body.organized_by.trim());
            event.image = sanitize(req.body.image.trim());
            event.category = sanitize(req.body.category.trim());
            event.description = sanitize(req.body.description.trim());
            event.save((err, result) => {
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
          return res.redirect(`/events/add`);
        }
        req.flash("success", "New Event added successfully!");
        return res.redirect(`/events/list`);
      }
    );
  } catch (error) {
    req.flash("form", req.body);
    req.flash("error", error.message || error);
    return res.redirect(`/events/add`);
  }
};

exports.ajaxEventList = function(req, res) {
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
          event_title: { $regex: req.body["search[value]"], $options: "ig" }
        }
      ];
    }
    Eventtable.aggregate()
      //.match({ type: "user" })
      .facet({
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [
          {
            $project: {
              _id: 0,
              event_title: 1,
              event_date: 1,
              event_time: 1,
              organized_by: 1,
              description: 1,
              destination: 1,
              category: 1,
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
        console.log("events", result[0]);
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

exports.edit = function(req, res) {
  try {
    if (!req.params.id || req.params.id == "") {
      throw new Error("Invalid request.");
    }
    Eventtable.find({ _id: req.params.id })
      .then(result => {
        var errMsg = req.flash("error");
        var successMsg = req.flash("success");
        var data = {
          title: "Edit Event",
          errors: errMsg,
          success: successMsg,
          form: result[0],
          csrfToken: req.csrfToken(),
          moment: moment
        };
        return res.render("event-add", data);
      })
      .catch(err => {
        return res.status(400).json({
          success: false,
          error: err.message || err
        });
      });
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/events/list");
  }
};

exports.update = function(req, res) {
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
            req.checkBody("event_title", "Title is required").notEmpty();
            //req.checkBody("event_date", "Event Date is required").notEmpty();
            req.checkBody("event_time", "Event Time is required").notEmpty();
            req.checkBody("destination", "Destination is required").notEmpty();
            req.checkBody("category", "Category date is required").notEmpty();
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
                    .resize(250, jimp.AUTO) // resize
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
          Eventtable.findByIdAndUpdate(_id, req.body, { new: true }, function(err, model) {
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
          return res.redirect(`/events/list`);
        }
        req.flash("success", "Event update successfully!");
        return res.redirect(`/events/list`);
      }
    );
  } catch (err) {
    req.flash("form", req.body);
    req.flash("error", err.message || err);
    return res.redirect(`/events/list`);
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
          Eventtable.findById(req.params.id, { image: 1 })
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
          Eventtable.deleteOne({ _id: req.params.id })
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
