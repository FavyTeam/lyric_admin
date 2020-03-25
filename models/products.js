var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var productSchema = new Schema({
  title: { type: String, required: [true, "Title is required."] },
    price: { type: Number, required: [true, "Product price is required."]  },
    images: { type: Array, default: [] },
    description: { type: String, default: "" },
    sizes: {type: Array, default: [{"s" :0},{"m": 0}, {"l":0}, {"xl": 0}, {"xxl": 0}]}
  },{
    timestamps: true
});

module.exports = mongoose.model("product", productSchema);