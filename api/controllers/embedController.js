var Embed = require("../../models/embed");

exports.getAllEmbedVideos = function(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.offset) || 0;
    const search_query = req.query.search;
    const draw_query = req.query.draw;
    console.log("here????", req.query);
    let matchQry = {};
    let sortQry = {};
    if (req.query.orderBy) {
      const orderBy = req.query.orderBy;
      sortQry[orderBy] = req.query.direction === "asc" ? 1 : -1;
    } else {
      sortQry["createdAt"] = -1;
    }

    if (search_query && search_query != "") {
      matchQry["$or"] = [
        {
          title: { $regex: search_query, $options: "ig" }
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
              image: 1,
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
        console.log("result", result);
        if (result.length > 0) {
          if (search_query != "") {
            result[0].recordsFiltered = result[0].data.length;
          }
          res.status(200).json(result[0]);
        } else {
          result[0] = { recordsTotal: 0, data: [], draw: "1", recordsFiltered: 0 };
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
};
