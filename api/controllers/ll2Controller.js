var LL2 = require("../../models/ll2");

exports.getAllLL2 = function(req,res){
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.offset) || 0;
    const search_query = req.query.search;
    const draw_query = req.query.draw
    
    let matchQry = {};
     console.log('paras', req, '\nlimit', limit, '\nskip', skip)
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
        // {
        //   singer: { $regex: search_query, $options: "ig" }
        // }
      ];
    }
    LL2.aggregate()
      //.match({ type: "user" })
      .facet({
        stage1: [{ $group: { _id: null, count: { $sum: 1 } } }],
        stage2: [
          {
            $project: {
              _id: 0,
              title: 1,
              // singer: 1,
              youtube_url:1,
              ll2_release: 1,
              description:1,
              image: 1, 
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
      

  } catch (Err) {
    return res.status(500).json({
      success: false,
      error: Err.message || Err
  });  
  }
}


/* exports.add = function (req, res) {
    try {
        var error = [];

        var title = sanitize(req.body.title.trim());
        var singer = sanitize(req.body.singer.trim());
        var music_release = sanitize(req.body.music_release.trim());
        var youtube_url = sanitize(req.body.youtube_url.trim());
        var position = sanitize(req.body.position.trim());
        var description = sanitize(req.body.description.trim());
        var file = req.file;

        if (!title || title.trim() == "") {
            error.push("Title is required.");
        }
        if (!singer || singer.trim() == "") {
            error.push("Singer name is required.");
        }
        if (!music_release || music_release.trim() == "") {
            error.push("Music release date is required.");
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

        var music = new Music();
        music.title = title;
        music.singer = singer;
        music.music_release = music_release;
        music.youtube_url = youtube_url;
        music.image = newFileName;
        music.position = position;
        music.description = description;
        music.save((err, result) => {
            if (err) {
              throw err;
            } else {
                return res.json({
                    success: true,
                    message: "Music added successfully"
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

exports.delete = function(req,res){
    try {
        if (!req.params.id || req.params.id == "") {
          throw new Error("Invalid request.");
        }
        Music.deleteOne({ _id: req.params.id })
        .then(result => {
            return res.json({
                success: true,
                message: "Music deleted successfully"
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

