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



//   const mongoose = require('mongoose');

// const SubscriptionSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     plan: { type: String, enum: ['monthly', 'yearly'], required: true },
//     status: { type: String, enum: ['active', 'pending', 'canceled'], default: 'pending' },
//     startDate: { type: Date, default: Date.now },
//     endDate: { type: Date },
//     paymentId: { type: String, required: true },
// }, { timestamps: true });

// module.exports = mongoose.model('Subscription', SubscriptionSchema);