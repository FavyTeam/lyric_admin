var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var embedSchema = new Schema(
  {
    title: { type: String, required: [true, "Title is required."] },
    youtube_url: { type: String, default: "" },
    image: { type: String, default: "" }
  },

  {
    timestamps: true
  }
);

module.exports = mongoose.model("Embed", embedSchema);
