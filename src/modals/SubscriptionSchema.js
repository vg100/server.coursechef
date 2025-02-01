const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "NewUser", required: true }, // Reference to user
    razorpaySubscriptionId: { type: String, required: true, unique: true }, // Razorpay Subscription ID
    planId: { type: String, required: true, default: '0' }, // Razorpay Plan ID
    planType: { type: String, default: 'Free' },
    method: { type: String },
    status: {
        type: String,
        enum: ["created", "active", "paused", "cancelled", "completed", "expired"],
        default: "created",
    }, // Subscription status
    totalCount: { type: Number, required: true }, // Total billing cycles
    currentCycle: { type: Number, default: 0 }, // Current billing cycle
    startAt: { type: Date, default: Date.now }, // Subscription start date
    nextBillingAt: { type: Date }, // Next billing cycle date
    endAt: { type: Date }, // End date if cancelled
    createdAt: { type: Date, default: Date.now }, // Timestamp
});

module.exports = mongoose.model("NewSubscription", SubscriptionSchema);


// const subscriptionSchema = new mongoose.Schema({
//     razorpaySubscriptionId: { type: String, },
//     razorpayCustomerId: { type: String, },
//     plan: { type: String, default: 'free' },
//     startDate: { type: Date, default: Date.now },
//     endDate: { type: Date },
//     status: { type: String, enum: ['active', 'canceled', 'expired', 'pending'], default: 'active' },
//     paymentMethod: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet'],},
//     nextBillingDate: { type: Date },
//     trialStartDate: { type: Date },
//     trialEndDate: { type: Date },
//     billingCycle: { type: String, enum: ['monthly', 'yearly']  },
//     amount: { type: Number, required: true },
//     currency: { type: String, default: 'INR' },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now }
// }, { timestamps: true });
