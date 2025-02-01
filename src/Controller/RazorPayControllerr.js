

const Razorpay = require("razorpay");
const getEnvironmentVariables = require("../Environment/env");
const Subscription = require("../modals/SubscriptionSchema");
const crypto = require("crypto");
const User = require("../modals/userr");
const MailServiceProvider = require("../Utils/mailchamp");

class RazorpayControllerr {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: getEnvironmentVariables().RAZORPAY.KEY_ID,
            key_secret: getEnvironmentVariables().RAZORPAY.KEY_SECRET,
        });
        this.createSubscription = this.createSubscription.bind(this);
        this.getSubscription = this.getSubscription.bind(this);
        this.cancelSubscription = this.cancelSubscription.bind(this);
        this.pauseSubscription = this.pauseSubscription.bind(this);
        this.resumeSubscription = this.resumeSubscription.bind(this);
        this.reactivateSubscription = this.reactivateSubscription.bind(this);
        this.getAllSubscriptions = this.getAllSubscriptions.bind(this);
        this.handleWebhook = this.handleWebhook.bind(this);
    }

    /**
     * Create a new subscription
     */
    async createSubscription(req, res) {
        try {
            if (!this.razorpay) throw new Error("Razorpay instance is not initialized");
            const { userId, plan_id: { id, plan }, total_count } = req.body;

            // Create Razorpay subscription

            const subscription = await this.razorpay.subscriptions.create({
                plan_id: id,
                total_count,
                customer_notify: 1,
            });

            // Save subscription in DB
            const newSubscription = new Subscription({
                userId,
                razorpaySubscriptionId: subscription.id,
                planId: id,
                planType: plan,
                method: "upi",
                status: subscription.status,
                totalCount: subscription.total_count,
                startAt: new Date(subscription.start_at * 1000),
                nextBillingAt: new Date(subscription.charge_at * 1000),
            });

            await newSubscription.save();
            return res.status(200).json({ success: true, subscription: newSubscription });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Fetch Subscription Details
     */
    async getSubscription(req, res) {
        try {
            const { subscription_id, userId, plan } = req.body;
            const razorpaySubscription = await this.razorpay.subscriptions.fetch(subscription_id);

            // Update DB with latest status
            const subscription = await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: subscription_id },
                {
                    status: razorpaySubscription.status,
                    nextBillingAt: new Date(razorpaySubscription.charge_at * 1000),
                    planType: plan
                },
                { new: true }
            );

            await User.findByIdAndUpdate(userId, { subscription: subscription?._id }, { new: true })

            return res.send(subscription)
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Cancel Subscription
     */
    async cancelSubscription(req, res) {
        try {
            const { subscription_id } = req.params;
            const { cancel_at_cycle_end, userId } = req.body; // 1: cancel after current cycle, 0: cancel immediately

            const razorpaySubscription = await this.razorpay.subscriptions.cancel(subscription_id, cancel_at_cycle_end || 0);

            // Update DB status
            const subscription = await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: subscription_id },
                { status: "cancelled", endAt: new Date() },
                { new: true }
            );

            const userDetails = await User.findByIdAndUpdate(userId, { subscription: null }, { new: true })


            const Reactivate = getEnvironmentVariables().WEBSITE_URL + "/pricing";
            const mailOptions = {
                from: getEnvironmentVariables().GMAIL.EMAIL,
                to: userDetails.email,
                subject: `${userDetails.fullName} Your Subscription Plan Has Been Cancelled`,
                templateName: 'subscription-cancel.html',
                variables: { logo: getEnvironmentVariables().LOGO, name: userDetails.fullName, Reactivate, company: getEnvironmentVariables().COMPANY },
            };
            await MailServiceProvider.sendEmail(mailOptions);

            return res.send(subscription);

        } catch (error) {
            console.log(error, 'hhh')
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Pause Subscription
     */
    async pauseSubscription(req, res) {
        try {
            const { subscription_id } = req.params;

            const razorpaySubscription = await this.razorpay.subscriptions.pause(subscription_id, {
                pause_at: "now", // or "cycle_end"
            });

            // Update DB
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: subscription_id },
                { status: "paused" },
                { new: true }
            );



            return res.status(200).json({ success: true, subscription: razorpaySubscription });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Resume Subscription
     */
    async resumeSubscription(req, res) {
        try {
            const { subscription_id } = req.params;

            const razorpaySubscription = await this.razorpay.subscriptions.resume(subscription_id, {
                resume_at: "now",
            });

            // Update DB
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: subscription_id },
                { status: "active" },
                { new: true }
            );

            return res.status(200).json({ success: true, subscription: razorpaySubscription });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Reactivate Subscription
     */
    async reactivateSubscription(req, res) {
        try {
            const { subscription_id } = req.params;

            const razorpaySubscription = await this.razorpay.subscriptions.update(subscription_id, {
                status: "active",
            });

            // Update DB
            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: subscription_id },
                { status: "active" },
                { new: true }
            );

            return res.status(200).json({ success: true, subscription: razorpaySubscription });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    /**
     * Get All Subscriptions
     */
    async getAllSubscriptions(req, res) {
        try {
            const subscriptions = await Subscription.find().populate("userId", "name email"); // Populate user details
            return res.status(200).json({ success: true, subscriptions });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    async handleWebhook(req, res) {
        try {
            const webhookSecret = "YOUR_WEBHOOK_SECRET"; // Set this in Razorpay Dashboard
            const razorpaySignature = req.headers["x-razorpay-signature"];
            const payload = JSON.stringify(req.body);

            // Verify webhook signature
            const expectedSignature = crypto
                .createHmac("sha256", webhookSecret)
                .update(payload)
                .digest("hex");

            if (expectedSignature !== razorpaySignature) {
                return res.status(400).json({ success: false, message: "Invalid webhook signature" });
            }

            const event = req.body.event;
            const subscriptionId = req.body.payload.subscription.entity.id;
            const status = req.body.payload.subscription.entity.status;
            const chargeAt = req.body.payload.subscription.entity.charge_at;

            console.log(`Received webhook: ${event} for ${subscriptionId}`);

            // Update subscription in database based on event
            let updateData = { status };

            if (chargeAt) {
                updateData.nextBillingAt = new Date(chargeAt * 1000);
            }

            await Subscription.findOneAndUpdate(
                { razorpaySubscriptionId: subscriptionId },
                updateData,
                { new: true }
            );

            return res.status(200).json({ success: true, message: "Webhook processed successfully" });
        } catch (error) {
            console.error("Webhook Error:", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new RazorpayControllerr();
