var Interview = require("../../models/interview");

exports.getAllInterview = function (req, res) {
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
        },
        {
          interviewer_name: { $regex: search_query, $options: "ig" }
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
              interviewer_name: 1,
              youtube_url:1,
              interview_release: 1,
              description:1,
              createdAt:1,
              updatedAt:1,
              image: 1,
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


/* exports.add = function (req, res) {
    try {
        var error = [];

        var title = sanitize(req.body.title.trim());
        var guest_name = sanitize(req.body.guest_name.trim());
        var interview_release = sanitize(req.body.interview_releaseDate.trim());
        var youtube_url = sanitize(req.body.interview_youtubeURL.trim());
        var description = sanitize(req.body.interview_Description.trim());
        var file = req.file;

        if (!title || title.trim() == "") {
            error.push("Title is required.");
        }
        if (!guest_name || guest_name.trim() == "") {
            error.push("Guest name is required.");
        }
        if (!interview_release || interview_release.trim() == "") {
            error.push("Interview release date is required.");
        }
        if (!youtube_url || youtube_url.trim() == "") {
            error.push("youtube link is required.");
        }
        if (!req.file) {
            messages.push("Please upload music video image.");
        }
        if (error.length > 0) {
            throw error;
        }

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

        var interview = new Interview();
        interview.title = title;
        interview.interviewer_name = guest_name;
        interview.interview_release = interview_release;
        interview.youtube_url = youtube_url;
        interview.image = newFileName;
        interview.description = description;
        music.save((err, result) => {
            if (err) {
              throw err;
            } else {
                return res.json({
                    success: true,
                    message: "Interview added successfully"
                }); 
            }
        })
        .catch(err => {
            return res.json({
              success: false,
              error: err.message || err
            });
        });
      })
    } catch (Err) {
        return res.json({
            success: false,
            error: Err.message || Err
        });
    }
}

exports.delete =  function(req,res){
    try {
        if (!req.params.id || req.params.id == "") {
          throw new Error("Invalid request.");
        }
        Interview.deleteOne({ _id: req.params.id })
        .then(result => {
            return res.json({
                success: true,
                message: "Interview deleted successfully"
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
} */