var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var bcrypt = require("bcrypt-nodejs");

var userSchema = new Schema({
  email: { type: String, required: [true, "Email id is required."], unique: [true, 'Email already exist'] },
  password: { type: String, required: [true, "Password is required."] },
  first_name: { type: String },
  last_name: { type: String },
  image: { type: String, default: "" },
  stripe_customerId: { type: String},
  type: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  reset_token: { type: String },
  status: {
    type: Boolean,
    enum: [true, false],
    default: true
  }
}, {
  timestamps: true
});

userSchema.methods.encryptPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
