var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var shippingAddressSchema = new Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    street: { type: String, required: [true, "Street is required."] },
    street2: { type: String, required: [false] },
    state: { type: String, required: [true, "state1 is required."] },
    city: { type: String, required: [true, "city is required."] },
    country: { type: String, required: [true, "Country is required."] },
    zipCode: { type: String, required: [true, "zipcode is required."] }
  },
  {
    timestamps: true
  }
);

// var shippingAddressSchema = new Schema({
//   user_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   street: { type: String, required: [true, "Street is required."] },
//   state1: {type: String, required: [true, "state1 is required."] },
//   state2 : {type: String, required: [false] },
//   country : {type: String, required: [true, "Country is required."] }
//   },{
//     timestamps: true
// });

module.exports = mongoose.model("shipping_address", shippingAddressSchema);
