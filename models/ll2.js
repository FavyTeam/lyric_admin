var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ll2Schema = new Schema(
  {
    title: { type: String, required: [true, "Title is required."] },
    singer: { type: String, default: "" },
    ll2_release: { type: Date },
    youtube_url: { type: String, default: "" },
    image: { type: String, default: "" },
    description: { type: String, default: "" }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("LL2", ll2Schema);
