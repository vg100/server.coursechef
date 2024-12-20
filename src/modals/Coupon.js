const { default: mongoose } = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  expirationDate: { type: Date, required: true },
  discountValue: { type: Number, required: true },
  usersApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  offerId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);