var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var orderSchema = new Schema({
  user_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  products: [{
    product_id:{type: mongoose.Schema.Types.ObjectId, ref:'product'},
    amount: { type: Number, required: [true, "order amount is required."] },
    size: { type: String },
    quantity: {type: Number},
  }],
  shipping_address:{type: mongoose.Schema.Types.ObjectId, ref: 'shipping_address'},
  invoice_id: {type: String},
  invoice_status: {type: String}
  },{
    timestamps: true
});

module.exports = mongoose.model("order", orderSchema);

