var Products = require("../../models/products");
var Favourite = require("../../models/favourite");
var async = require("async");
var sanitize = require("mongo-sanitize");

exports.getAllProduct = function (req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.offset) || 0;
    const search_query = req.query.search;
    const draw_query = req.query.draw;

    let matchQry = {};
    let sortQry = {};
    if (req.query.orderBy) {
      const orderBy = req.query.orderBy;
      sortQry[orderBy] = req.query.direction === "asc" ? 1 : -1;
    } else {
      sortQry['createdAt'] = -1;
    }

    if (search_query && search_query != "") {
      matchQry["$or"] = [
        {
          title: { $regex: search_query, $options: "ig" }
        }
      ];
    }
    async.waterfall([
      function (callback) {
        Products.aggregate()
          //.match({ type: "user" })
          .facet({
            stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
            stage2: [
              {
                $project: {
                  _id: 0,
                  title: 1,
                  price: 1,
                  sizes: 1,
                  description: 1,
                  images: 1,
                  createdAt: 1,
                  updatedAt: 1,
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
            draw: draw_query,
            recordsFiltered: "$stage1.count"
          })
          .exec()
          .then(result => {
            if (result.length > 0) {
              if (search_query != "") {
                result[0].recordsFiltered = result[0].data.length;
              }
              callback(null, result[0]);
            } else {
              result[0] = { recordsTotal: 0, data: [], draw: '1', recordsFiltered: 0 }
              callback(null, result[0]);
            }
          })
          .catch(err => {
            callback(err, null);
          });
      },
      function (productsData, callback) {
        if (req.query.userId != undefined || req.query.userId != null) {
          if (productsData.recordsTotal > 0) {
            async.eachOfSeries(productsData.data, function (product, iteration, inner_callback) {
              Favourite.findOne({ 'user_id': req.query.userId, 'product_id': product.id })
                .exec(function (err, results) {
                  if (err) {
                    inner_callback(err, null);
                  } else if (results != null) {
                    product.alreadySaved = true;
                    productsData.data[iteration] = product;
                    inner_callback(null, productsData);
                  } else {
                    product.alreadySaved = false;
                    productsData.data[iteration] = product;
                    inner_callback(null, productsData);
                  }
                })
            }, function (err, allProduct) {
              if (err) {
                callback(err, null)
              } else {
                callback(null, productsData);
              }
            });
          } else {
            callback(null, productsData);
          }
        } else {
          callback(null, productsData);
        }
      }
    ], function (err, result) {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || err
        });
      } else {
        // res.status(200).json(result[0]);
        return res.status(200).json(result);
      }
    })
  } catch (Err) {
    return res.status(500).json({
      success: false,
      error: Err.message || Err
    });
  }
}

exports.getAllProducts = function (req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const skip = parseInt(req.query.offset) || 0;
      const search_query = req.query.search;
      const draw_query = req.query.draw
      
      let matchQry = {};
      let sortQry = {};
      if (req.query.orderBy) {
        const orderBy = req.query.orderBy ; 
        sortQry[orderBy] = req.query.direction === "asc" ? 1 : -1;
      } else {
        sortQry['createdAt'] = -1 ;
      }
      
      if (search_query && search_query != "") {
        matchQry["$or"] = [
          {
            title: { $regex: search_query, $options: "ig" }
          }
        ];
      }
      Products.aggregate()
        //.match({ type: "user" })
        .facet({
          stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
          stage2: [
            {
              $project: {
                _id: 0,
                title: 1,
                price: 1,
                sizes: 1,
                description:1,
                images: 1,
                createdAt:1,
                updatedAt:1,
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
          draw: draw_query,
          recordsFiltered: "$stage1.count"
        })
        .exec()
        .then(result => {
         if (result.length > 0) {
          if (search_query != "") {
            result[0].recordsFiltered = result[0].data.length;
          }
          res.status(200).json(result[0]);
        } else {
          result[0] = { recordsTotal: 0, data: [], draw: '1', recordsFiltered: 0 }
          res.status(204).json(result[0]);
        } 
          
        })
        .catch(err => {
          return res.status(400).json({
            success: false,
            error: err.message || err
          });
        });
  
    } catch (mainBlock_error) {
      return res.status(500).json({
        success: false,
        error: mainBlock_error.message || mainBlock_error
      });  
    }
  }

exports.addRemoveFavourite = function (req,res) {
  try {
    async.waterfall([
      function (callback) {  // checkReuestValidation
          if (!req.body.product_id ) {
              callback({ error: true, message: 'Missing parameter: product_id' })
          } else if (!req.body.user_id) {
              callback({ error: true, message: 'Missing parameter: user_id' })
          } else {          
            callback(null) ;
          }
      },
      function (callback) {   // checkCustomerExist
        Favourite.findOne({'user_id': req.body.user_id, 'product_id': req.body.product_id  })
          .then(result => {
              if (result === null) {
                createFavourite(req.body.user_id, req.body.product_id, function (err, response) {
                  if (err) {
                    callback(err)
                  } else {
                    callback(null, response, 'Successfully add product in favourite')
                  }
                })
              } else {
                removeFavourite(result._id, function (err, response) {
                  if (err) {
                    callback(err)
                  } else {
                    callback(null, response, 'Successfully remove product from favourite')
                  }
                })
              }
              
            })
            .catch(err => {
              callback(err);
            });
      },
      ], function (err, result, message) { // final function
        if (err) {
          return res.status(500).json({
              success: false,
              message: 'error occur during create favourite',
              data: err.message || err
          });
        } else {
          return res.status(200).json({
          success: true,
          message: message,
          data: result
          });
        }
    });

  } catch (Err) {
    return res.status(500).json({
      success: false,
      error: Err.message || Err
    }); 
  }
}

exports.getFavourite = function (req, res) {
  try {
    const userId = req.query.userId || req.params.userId || req.body.userId;
    if (!userId) {
      throw new Error('Missing Parameter: userId')
    }
    Favourite.find({ user_id: userId }).populate('product_id').exec(function (err, results) {
      if (err) {
        throw err
      } else {
        return res.status(200).json({
          success: true,
          data: results
        })
      }
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || error
    });
  }
}
// exports.getFavourite = function (req,res) {
//   try {
//     const userId = req.query.userId || req.params.userId || req.body.userId;
//     if (!userId) {
//       throw new Error('Missing Parameter: userId')
//     }
//     Favourite.find({user_id:userId})
//     .then((results)=>{
//       if(!results){
//         throw new Error("No data found")
//       }else{
//         return res.status(200).json({
//           success:true,
//           data:results
//         })
//       }
//     })
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       error: error.message || error
//     }); 
//   }
// } 

/*==================== Helper Function==================*/
async function createFavourite(user_id, product_id, callback) {
  try {
    const favourite = new Favourite()
    favourite.user_id = sanitize(user_id.trim()) ;
    favourite.product_id = sanitize(product_id.trim());
    favourite.save((err, result) => {
          if (err) {
          callback(err); 
          } else {
            callback(null, result) 
          }
      }); 
  } catch(error) {
    callback(error)
  } 
}

async function removeFavourite(id, callback) {
  try {
    Favourite.deleteOne({ _id: id })
    .then(result => {
      callback(null, result)
    })
    .catch(err => {
      callback(err);
    });
  } catch(error) {
    callback(error)
  }
  
}
