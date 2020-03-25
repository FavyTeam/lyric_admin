var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var interviewSchema = new Schema(
  {
    title: { type: String, required: [true, "Title is required."] },
    interviewer_name: { type: String, required: [true, "name is required."] },
    interview_release: { type: Date },
    youtube_url: { type: String, default: "" },
    image: { type: String, default: "" },
    description: { type: String, default: "" }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Interview", interviewSchema);
