const { default: mongoose } = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subscription: String,
    subscriberId: String,
    plan: String,
    method: String,
    date: { type: Date, default: Date.now },
    active: { type: Boolean, default: true }
  });
  module.exports = mongoose.model("Subscription", subscriptionSchema);