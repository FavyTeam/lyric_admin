var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var musicSchema = new Schema(
  {
    title: { type: String, required: [true, "Title is required."] },
    singer: { type: String, required: [true, "Singer name is required."] },
    music_release: { type: Date },
    youtube_url: { type: String, default: "" },
    image: { type: String, default: "" },
    position: { type: Number, default: 0 },
    description: { type: String, default: "" }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Music", musicSchema);
