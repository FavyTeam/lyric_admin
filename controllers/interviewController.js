var sanitize = require("mongo-sanitize");
var util = require("util");
var fs = require("fs");
var path = require("path");
var uuidV1 = require("uuid/v1");
var jimp = require("jimp");
var async = require("async");
var moment = require("moment");
var request = require('request');

var Interview = require("../models/interview");

exports.index = function(req, res) {
  res.redirect("/interview/list");
};

exports.list = function(req, res) {
  //  request('https://www.googleapis.com/youtube/v3/playlistItems?playlistId=PLfvpqdsXvlf5PDuQtD7q34IiW8elYLOBO&part=snippet,id&maxResults=50&key=AIzaSyDatqaJO9Q6EdeJXPJ7whIE1Kbya3AeFN8', function (error, response, body) {
  //     if (!error && response.statusCode == 200) {
  //       var tmp = JSON.parse(body);
  //       var lists = tmp.items;
  //       for (var i = 0 ; i <= lists.length - 1; i++) {
  //           var item = lists[i];
  //           const thumbnails = item.snippet.thumbnails;
  //           const imageUrl = thumbnails.high.url;   
  //           const videoId = item.snippet.resourceId.videoId;
  //           const playlistId = item.snippet.playlistId;
  //           const releasedAt = item.snippet.publishedAt;
  //           var title = item.snippet.title;
  //           title = title.split(" | ");

  //           interviewer_name = title[0];
  //           interview_title = title[1];

  //           const description = item.snippet.description;  
  //           var videoTitle = title;
  //           var author = "";
            
  //           var interview = new Interview();
  //           interview.title = interview_title;
  //           interview.interviewer_name = interviewer_name;
  //           interview.interview_release = releasedAt;
  //           interview.youtube_url = videoId;
  //           interview.image = imageUrl;
  //           interview.description = description;

  //           interview.save((err, result) => {
  //             // if (err) {
  //             //   callback(err); // call final function
  //             // }
  //             callback(err); // call final function
  //           });
  //        } 
  //      }
  // })

  try {
    var errMsg = req.flash("error");
    var successMsg = req.flash("success");

    var data = {
      title: "Interview List",
      errors: errMsg,
      success: successMsg
    };
    res.render("interview-list", data);
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
      title: "Add New Interview Video",
      errors: errMsg,
      success: successMsg,
      form,
      form,
      csrfToken: req.csrfToken(),
      moment: moment
    };
    res.render("interview-add", data);
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/interview/add");
  }
};

exports.edit = function(req, res) {
  try {
    if (!req.params.id || req.params.id == "") {
      throw new Error("Invalid request.");
    }
    Interview.find({ _id: req.params.id })
      .then(result => {
        var errMsg = req.flash("error");
        var successMsg = req.flash("success");
        var data = {
          title: "Edit Interview",
          errors: errMsg,
          success: successMsg,
          form: result[0],
          csrfToken: req.csrfToken(),
          moment: moment
        };
        return res.render("interview-add", data);
      })
      .catch(err => {
        return res.json({
          success: false,
          error: err.message || err
        });
      });
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/interview/edit/" + req.params.id);
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
            if (!_id || _id == "") {
              throw new Error("Invalid request.");
            }
            req.checkBody("title", "Title is required").notEmpty();
            req.checkBody("interviewer_name", "Interviewer Name is required").notEmpty();
            //req.checkBody("interview_release", "Interview date is required").notEmpty();
            req.checkBody("youtube_url", "Youtube url is required").notEmpty();
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
          Interview.findByIdAndUpdate(_id, req.body, { new: true }, function(err, model) {
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
          return res.redirect(`/interview/list`);
        }
        req.flash("success", "interview update successfully!");
        return res.redirect(`/interview/list`);
      }
    );
  } catch (err) {
    req.flash("form", req.body);
    req.flash("error", err.message || err);
    return res.redirect(`/interview/list`);
  }
};

exports.save = function(req, res) {
  try {
    async.waterfall(
      [
        function(callback) {
          req.checkBody("title", "Title is required").notEmpty();
          req.checkBody("interviewer_name", "Interviewer Name is required").notEmpty();
          //req.checkBody("interview_release", "Interview date is required").notEmpty();
          req.checkBody("youtube_url", "Youtube url is required").notEmpty();

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
          var interview = new Interview();
          interview.title = sanitize(req.body.title.trim());
          interview.interviewer_name = sanitize(req.body.interviewer_name.trim());
          interview.interview_release = sanitize(req.body.interview_release.trim());
          interview.youtube_url = sanitize(req.body.youtube_url.trim());
          interview.image = req.body.image ? sanitize(req.body.image.trim()) : "";
          interview.description = sanitize(req.body.interviewDescription.trim());
          interview.save((err, result) => {
            // if (err) {
            //   callback(err); // call final function
            // }
            callback(err); // call final function
          });
        }
      ],
      function(err) {
        // final function
        if (err) {
          req.flash("form", req.body);
          req.flash("error", err.message || err);
          return res.redirect(`/interview/add`);
        }
        req.flash("success", "New Interview added successfully!");
        return res.redirect(`/interview/list`);
      }
    );
  } catch (error) {
    req.flash("form", req.body);
    req.flash("error", error.message || error);
    return res.redirect(`/interview/add`);
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
          Interview.findById(req.params.id, { image: 1 })
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
          Interview.deleteOne({ _id: req.params.id })
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

exports.ajaxInterviewList = function(req, res) {
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
        },
        {
          name: { $regex: req.body["search[value]"], $options: "ig" }
        },
        {
          interview_release: { $regex: req.body["search[value]"], $options: "ig" }
        }
      ];
    }
    Interview.aggregate()
      //.match({ type: "user" })
      .facet({
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [
          {
            $project: {
              _id: 0,
              title: 1,
              youtube_url: 1,
              interview_release: 1,
              description: 1,
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
