var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var favouriteSchema = new Schema({
  user_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'product'},
  },{
    timestamps: true
});

module.exports = mongoose.model("favourite", favouriteSchema);