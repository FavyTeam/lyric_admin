var sanitize = require("mongo-sanitize");
var util = require("util");
var fs = require("fs");
var path = require("path");
var uuidV1 = require("uuid/v1");
var jimp = require("jimp");
var moment = require("moment");
var async = require("async");
const https = require('https');
var request = require('request');

var Music = require("../models/music");

exports.index = function(req, res) {
  res.redirect("/music/list");
};

exports.list = async function(req, res) {
  // request('https://www.googleapis.com/youtube/v3/playlistItems?playlistId=PLfvpqdsXvlf4vqsRWglvSPplpKkEsBI7E&part=snippet,id&maxResults=50&key=AIzaSyDatqaJO9Q6EdeJXPJ7whIE1Kbya3AeFN8', function (error, response, body) {
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
  //           const title = item.snippet.title;
  //           const description = item.snippet.description;
  //           const position = item.snippet.position;
  //           var titleArr = title.split('(');
  //           var videoTitle = titleArr[0];
  //           var tmpArr1 = titleArr[1];

  //           if(tmpArr1 == 'undefined' || tmpArr1.length > 1) {
  //               var tmpArr2 = tmpArr1.split('@_');
  //           }
  //           if(tmpArr2.length > 1){
  //               var tmpArr3 = tmpArr2[1].split('_');
  //               var author = tmpArr3[0];
  //           }else{
  //               var author = '';
  //           }
            
  //           var music = new Music();
  //           music.title = title;
  //           music.singer = author;
  //           music.music_release = releasedAt;
  //           music.youtube_url = videoId;
  //           music.position = position;
  //           music.description = description;
  //           music.image = imageUrl;

  //           music.save((err, result) => {
  //             try {
  //               if (err) {
  //                 throw err;
  //               }
  //             } catch (Err) {
                
  //             }
  //           });
  //        } 
  //      }
  // })

  
  // music.title = title;
  // music.singer = singer;
  // music.music_release = releaseDate;
  // music.youtube_url = youtubeURL;
  // music.position = position;
  // music.description = description;
  // music.save((err, result) => {
  //   try {
  //     if (err) {
  //       throw err;
  //     }
      
  //   } catch (Err) {
      
  //   }
  // });

  try {
    var errMsg = req.flash("error");
    var successMsg = req.flash("success");

    var data = {
      title: "Music List",
      errors: errMsg,
      success: successMsg
    };
    res.render("music-list", data);
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
      title: "Add New Music Video",
      errors: errMsg,
      success: successMsg,
      form,
      form,
      csrfToken: req.csrfToken(),
      moment: moment
    };
    res.render("music-add", data);
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/music/add");
  }
};

exports.save = function(req, res) {
   try {
    req.checkBody("title", "Title is required").notEmpty();
    req.checkBody("singer", "Singer name is required").notEmpty();
    req.checkBody("youtube_url", "youtube Url is required ");

    var errors = req.validationErrors();
    if (errors) {
      var messages = [];

      errors.forEach(function(error) {
        messages.push(error.msg);
      });

      if (!req.file) {
        messages.push("Please upload music video image.");
      }

      throw messages;
    }

    // if (!req.file) {
    //   throw new Error("Please upload music video image.");
    // }

    var title = sanitize(req.body.title.trim());
    var singer = sanitize(req.body.singer.trim());
    var releaseDate = sanitize(req.body.music_release.trim());
    var youtubeURL = sanitize(req.body.youtube_url.trim());
    var position = sanitize(req.body.position.trim());
    var description = sanitize(req.body.description.trim());
    var file = req.file;

    if (!file) {
      var music = new Music();
      music.title = title;
      music.singer = singer;
      music.music_release = releaseDate;
      music.youtube_url = youtubeURL;
      music.position = position;
      music.description = description;
      music.save((err, result) => {
        try {
          if (err) {
            throw err;
          }
          req.flash("success", "New music added successfully!");
          return res.redirect("/music/list");
        } catch (Err) {
          req.flash("form", req.body);
          req.flash("error", Err.message || Err);
          return res.redirect("/music/add");
        }
      });
    } else {
      var generateNewName = uuidV1();
      var fileExt = path.extname(file.originalname);
      var newFileName = generateNewName + fileExt;
      // var newFile = "public/uploads/" + newFileName;
      // var thumbnailFile = "public/uploads/thumb/" + newFileName;
      var newFile = "public/uploads/" + newFileName;
      var thumbnailFile = "public/uploads/thumb/" + newFileName;

      fs.renameSync(file.path, newFile);
      jimp
        .read(newFile)
        .then(result => {
          result
            .resize(250, jimp.AUTO) // resize
            .write(thumbnailFile); // save

          var music = new Music();
          music.title = title;
          music.singer = singer;
          music.music_release = releaseDate;
          music.youtube_url = youtubeURL;
          music.image = newFileName;
          music.position = position;
          music.description = description;
          music.save((err, result) => {
            try {
              if (err) {
                throw err;
              }
              req.flash("success", "New music added successfully!");
              return res.redirect("/music/list");
            } catch (Err) {
              req.flash("form", req.body);
              req.flash("error", Err.message || Err);
              return res.redirect("/music/add");
            }
          });
        })
        .catch(Err => {
          req.flash("form", req.body);
          req.flash("error", Err.message || Err);
          return res.redirect("/music/add");
        });
    }
  } catch (Err) {
    req.flash("form", req.body);
    req.flash("error", Err.message || Err);
    return res.redirect("/music/add");
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
          Music.findById(req.params.id, { image: 1 })
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
          Music.deleteOne({ _id: req.params.id })
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

exports.edit = function(req, res) {
  try {
    if (!req.params.id || req.params.id == "") {
      throw new Error("Invalid request.");
    }
    Music.find({ _id: req.params.id })
      .then(result => {
        var errMsg = req.flash("error");
        var successMsg = req.flash("success");
        var data = {
          title: "Edit Music Video",
          errors: errMsg,
          success: successMsg,
          form: result[0],
          csrfToken: req.csrfToken(),
          moment: moment
        };
        return res.render("music-add", data);
      })
      .catch(err => {
        return res.status(400).json({
          success: false,
          error: err.message || err
        });
      });
  } catch (Err) {
    req.flash("error", Err.message || Err);
    return res.redirect("/music/edit/" + req.params.id);
  }
};

exports.update = function(req, res) {
  try {
    const _id = req.params.id;
    async.waterfall(
      [
        function(callback) {
          // function 1
          try {
            if (!_id || _id == "") {
              throw new Error("Invalid request.");
            }
            req.checkBody("title", "Title is required").notEmpty();
            req.checkBody("singer", "Singer name is required").notEmpty();
            req.checkBody("youtube_url", "youtube Url is required ");
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
          Music.findByIdAndUpdate(_id, req.body, { new: true }, function(err, model) {
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
          return res.redirect(`/music/list`);
        }
        req.flash("success", "music update successfully!");
        return res.redirect(`/music/list`);
      }
    );
  } catch (err) {
    req.flash("form", req.body);
    req.flash("error", err.message || err);
    return res.redirect(`/music/list`);
  }
};

exports.ajaxMusicList = function(req, res) {
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
          singer: { $regex: req.body["search[value]"], $options: "ig" }
        },
        {
          music_release: { $regex: req.body["search[value]"], $options: "ig" }
        }
      ];
    }
    Music.aggregate()
      //.match({ type: "user" })
      .facet({
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [
          {
            $project: {
              _id: 0,
              title: 1,
              singer: 1,
              youtube_url: 1,
              music_release: 1,
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
