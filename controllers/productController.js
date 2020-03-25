var sanitize = require("mongo-sanitize");
var util = require("util");
var fs = require("fs");
var path = require("path");
var uuidV1 = require("uuid/v1");
var jimp = require("jimp");
var async = require("async");
var moment = require('moment');

var Product = require("../models/products");


exports.index = function(req, res) {
    res.redirect("/product/list");
};
exports.list = function (req,res) {
    try {
        var errMsg = req.flash("error");
        var successMsg = req.flash("success");
    
        var data = {
        title: "Product List",
        errors: errMsg,
        success: successMsg
        };
        res.render("product-list", data);
    } catch (Err) {
        req.flash("error", Err.message || Err);
        return res.redirect("/dashboard");
    }
}
exports.ajaxProductList = function (req, res) {
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
        Product.aggregate()
          .facet({
            stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
            stage2: [
              {
                $project: {
                  _id: 0,
                  title: 1,
                  images:1,
                  price: 1,
                  description:1,
                  sizes:1,
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
            result[0] = { recordsTotal: 0, data: [], draw: '1', recordsFiltered: 0 }
          }
            res.json(result[0]);
          })
          .catch(err => {
            return res.status(500).json({
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
}

exports.add = function(req, res) {
    try {
      var errMsg = req.flash("error");
      var successMsg = req.flash("success");
      var form = req.flash("form")[0] || null;
  
      var data = {
        title: "Add New Product",
        errors: errMsg,
        success: successMsg,
        form,
        form,
        csrfToken: req.csrfToken(),
        moment: moment
      };
      res.render("product-add", data);
    } catch (Err) {
      req.flash("error", Err.message || Err);
      return res.redirect("/product/add");
    }
};

exports.save = function (req,res) {
    try {
      async.waterfall([
        function(callback){
          req.checkBody("title", "Title is required").notEmpty();
          req.checkBody("price", "Price is required and must be a number").isDecimal();
          req.checkBody("sizes[0]['s']", "Small Size quantity is required and must be a number").isDecimal();
          req.checkBody("sizes[1]['m']", "Medium Size quantity is required and must be a number").isDecimal();
          req.checkBody("sizes[2]['l']", "Large Size quantity is required and must be a number").isDecimal();
          req.checkBody("sizes[3]['xl']", "Xtra Large Size quantity is required and must be a number").isDecimal();
          req.checkBody("sizes[4]['xxl']", "Double Xl Size quantity is required and must be a number").isDecimal();
     
        var errors = req.validationErrors();
        if (errors) {
          var messages = [];
          errors.forEach(function(error) {
            messages.push(error.msg);
          });
          callback(messages); // call final function if error occur
        }
          callback(null)  // call 2nd function
        },
        function (callback) {
            if (req.files && req.files.length === 0 ) {
                callback("Please upload atleast 1 image for product.");
              }
             const images_array = [];
              async.mapSeries(req.files, function(file, inner_callback){
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
                        .resize(150, jimp.AUTO) // resize
                        .write(thumbnailFile); // save
                        images_array.push(newFileName);
                        inner_callback(null, inner_callback);
                    
                    })
                    .catch(jimp_error => {
                        inner_callback(jimp_error, inner_callback);
                    });
                }, 
                function(err) 
                {
                    if (err) {
                        callback(err)
                    }
                    req.body.images = images_array;
                    callback(null);  // outer callback
                });
        },
        function (callback) {
            try {
                var product = new Product();
                product.title = sanitize(req.body.title.trim());
                product.price = sanitize(req.body.price.trim());
                product.sizes = sanitize(req.body.sizes);
                product.images = sanitize(req.body.images);
                product.description = sanitize(req.body.description.trim());
                product.save((err, result) => {
                    if (err) {
                        console.log('saving error',err)
                        callback(err)
                    }
                    callback(null, result)
                })
            } catch (error) {
                callback(error); // call final function
            }
        }
    ], function (err, result) { // final function
        if (err) {
          throw err
        }
        req.flash("success", "New Product added successfully!");
        return res.redirect(`/product/list`);
      });
     
    } catch (err) {
        console.log('error', err)
        req.flash("form", req.body);
       req.flash("error", err.message || err);
       return res.redirect(`/product/add`);
    }
}

exports.edit = function (req, res) {
    try {
        if (!req.params.id || req.params.id == "") {
          throw new Error("Invalid request.");
        }
        Product.find({ _id: req.params.id })
        .then(result => {
          var errMsg = req.flash("error");
          var successMsg = req.flash("success");
          var data = {
            title: "Edit Product",
            errors: errMsg,
            success: successMsg,
            form:result[0],
            csrfToken: req.csrfToken(),
            moment: moment
          };
          return res.render("product-add", data);
        })
        .catch(err => {
          return res.json({
            success: false,
            error: err.message || err
          });
        });
      } catch (Err) {
        req.flash("error", Err.message || Err);
        return res.redirect("/product/list");
      }
}

exports.update = function (req,res) {
  try {
    const _id = req.params.id;
    if (!_id || _id == "") {
      throw new Error("Invalid request.");
    }
    async.waterfall([
      function(callback){
        req.checkBody("title", "Title is required").notEmpty();
        req.checkBody("price", "Price is required and must be a number").isDecimal();
        req.checkBody("sizes[0]['s']", "Small Size quantity is required and must be a number").isDecimal();
        req.checkBody("sizes[1]['m']", "Medium Size quantity is required and must be a number").isDecimal();
        req.checkBody("sizes[2]['l']", "Large Size quantity is required and must be a number").isDecimal();
        req.checkBody("sizes[3]['xl']", "Xtra Large Size quantity is required and must be a number").isDecimal();
        req.checkBody("sizes[4]['xxl']", "Double Xl Size quantity is required and must be a number").isDecimal();
   
      var errors = req.validationErrors();
      if (errors) {
        var messages = [];
        errors.forEach(function(error) {
          messages.push(error.msg);
        });
        callback(messages); // call final function if error occur
      }
        callback(null)  // call 2nd function
      },
      function (callback) {
        Product.find({ _id: req.params.id })
        .then(result => {
            callback(null, result[0])
        })
        .catch(err => {
          callback(err)
        });
      },
      function (exist_record, callback ) {
          if (req.files && req.files.length > 0 ) {
             const images_array = exist_record.images;
             const updated_images_array = req.body.updated_images;
             async.mapSeries(req.files, function(file, inner_callback){
                 const originalname = file.originalname;
                const indexOfImage =  updated_images_array.indexOf(originalname);
                if (indexOfImage < 0 ) {
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
                              .resize(150, jimp.AUTO) // resize
                              .write(thumbnailFile); // save

                          images_array.push(newFileName);
                          inner_callback(null, inner_callback);
                          
                          })
                          .catch(jimp_error => {
                              inner_callback(jimp_error, inner_callback);
                          });
                }
                else {
                  const image_name =  images_array[indexOfImage]
                  var generateNewName = uuidV1();
                  var fileExt = path.extname(file.originalname);
                  var newFileName = generateNewName + fileExt;
                  var newFile = "public/uploads/" + newFileName;
                  var thumbnailFile = "public/uploads/thumb/" + newFileName;
                  const old_filepath = `public/uploads/${image_name}`
                    const old_thumbpath = `public/uploads/thumb/${image_name}` 
                    if (fs.existsSync(old_filepath)) {
                      //file exists
                      fs.unlinkSync(old_filepath)
                    }
                    if (fs.existsSync(old_thumbpath)) {
                      //file exists
                      fs.unlinkSync(old_thumbpath)
                    }


                      fs.renameSync(file.path, newFile);
                      jimp
                          .read(newFile)
                          .then(result => {
                          result
                              .resize(150, jimp.AUTO) // resize
                              .write(thumbnailFile); // save

                          images_array[indexOfImage] = newFileName;
                          inner_callback(null, inner_callback);
                          
                          })
                          .catch(jimp_error => {
                              inner_callback(jimp_error, inner_callback);
                          });

                    } 
              
           
              }, 
              function(err) 
              {
                  if (err) {
                      callback(err)
                  }
                  req.body.images = images_array;
                  callback(null);  // outer callback
              });
            } else {
              callback(null)
            }
      },
      function (callback) {
        Product.findByIdAndUpdate(_id, req.body, {new: true} , function(err, model) {
          if (err) {
            if (err.code && err.code === 11000) {
              callback(err.errmsg); // call final function
            }          
          }
          callback(null, model);
          
        })
      }
  ], function (err, result) { // final function
      if (err) {
        throw err
      }
      req.flash("success", "Product edit successfully!");
      return res.redirect(`/product/list`);
    });
   
  } catch (err) {
      console.log('error', err)
      req.flash("form", req.body);
      req.flash("error", err.message || err);
      return res.redirect(`/product/list`);
  }
}

exports.delete = function(req,res) {
  try {
    if (!req.params.id || req.params.id == "") {
      throw new Error("Invalid request.");
    }
    async.waterfall([
      function(callback){
        Product.findById(req.params.id,{images: 1})
        .then(result => {
          async.mapSeries(result.images, function(image, inner_callback){ 
            const old_filepath = `public/uploads/${image}`
                const old_thumbpath = `public/uploads/thumb/${image}` 
                if (fs.existsSync(old_filepath)) {
                  //file exists
                  fs.unlinkSync(old_filepath)
                }
                if (fs.existsSync(old_thumbpath)) {
                  //file exists
                  fs.unlinkSync(old_thumbpath)
                }
                inner_callback(null)
          }, 
          function(err) 
          {
              if (err) {
                  callback(err)
              }
              callback(null);  // outer callback
          });      
        })
        .catch(err => {
          callback(err)
        });
      },
      function (callback) {
        Product.deleteOne({ _id: req.params.id })
        .then(result => {
          callback(null, result)
        })
        .catch(err => {
          callback(err);
        });
      }
    ], function (err, result) { // final function
      if (err) {
        return res.status(400).json({
          success: false,
          error: Err.message || Err
        });
      }
      return res.status(200).json({
        success: true,
        message: 'successfully delete selected record',
        data: result
      });
    });
  } catch (Err) {
    return res.status(500).json({
      success: false,
      error: Err.message || Err
    });
  }
}