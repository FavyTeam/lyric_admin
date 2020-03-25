var Order = require("../models/order");
var mongoose = require("mongoose");


exports.index = function(req, res) {
    res.redirect("/order/list");
};

exports.list = function(req, res) {
    try {
        var errMsg = req.flash("error");
        var successMsg = req.flash("success");
    
        var data = {
        title: "Order List",
        errors: errMsg,
        success: successMsg,
        list: 'orders'
        };
        if (req.params.userId) {
          data.list = 'userBased';
          data["user_id"] = req.params.userId
        } else if(req.params.productId) {
          data.list = 'productBased';
          data["product_id"] = req.params.productId
        } 
        res.render("order-list", data);
    } catch (Err) {
        req.flash("error", Err.message || Err);
        return res.redirect("/dashboard");
    }
};

exports.ajaxOrderList = function (req,res) {
    try {
        const limit = parseInt(req.body.length);
        const skip = parseInt(req.body.start);
        let matchQry = {};
        if (req.body.user_id) {
          matchQry["user_id"] = mongoose.Types.ObjectId(req.body.user_id)
        }
        if (req.body.product_id) {
          matchQry["product_id"] = mongoose.Types.ObjectId(req.body.product_id)
        }
        
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
                "productInfo.title": { $regex: req.body["search[value]"], $options: "ig" }
            },
            {
                "userInfo.first_name": { $regex: req.body["search[value]"], $options: "ig" }
            },
            {
                "userInfo.last_name": { $regex: req.body["search[value]"], $options: "ig" }
            }
          ];
        }
        Order.aggregate()
          .facet({
            stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
            stage2: [
              {
                $lookup: {
                   from: "users",
                   localField: "user_id",
                   foreignField: "_id",
                   as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$productInfo"
            },
            { $match: matchQry },
            { $sort: sortQry },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                size:1,
                quantity: 1,
                amount:1,
                invoice_id:1,
                invoice_status:1, 
                createdAt: 1,
                "userInfo.first_name": 1,
                "userInfo.last_name": 1,
                "userInfo.email": 1,
                "productInfo.images":1,
                "productInfo.title":1, 
                id: "$_id"
              }
            }
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
            } else if (result[0].data.length <= 0){
              result[0].recordsFiltered = result[0].data.length;
            } else if (result[0].data.length < limit ) {
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
        return res.status(500).json({
          success: false,
          error: Err.message || Err
        });
      }
}