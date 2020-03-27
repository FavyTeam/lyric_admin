/**
 * Validate File type before upload
 * @dependency: multer
 */

exports.fileFilterFunc = function(req, file, cb) {
  //console.log('Files: ', file);
  var allowFileFormats = ["image/jpeg", "image/jpg", "image/png"];
  if (allowFileFormats.indexOf(file.mimetype) == -1) {
    // You can always pass an error if something goes wrong:
    cb(new Error("Invalid File type."), false);
  } else {
    // To accept the file pass `true`, like so:
    cb(null, true);
  }
};
