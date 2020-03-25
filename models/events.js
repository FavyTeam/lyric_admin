var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var eventSchema = new Schema(
  {
    event_title: { type: String, required: [true, "Title is required."] },
    event_date: { type: Date },
    destination: { type: String, required: [true, "Destination is required."] },
    event_time: { type: String, default: "" },
    organized_by: { type: String, default: "" },
    image: { type: String, default: "" },
    category: { type: String, required: [true, "Category is required."] },
    description: { type: String, default: "" }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Eventtable", eventSchema);
