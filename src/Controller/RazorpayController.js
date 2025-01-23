const { default: axios } = require("axios");
const getEnvironmentVariables = require("../Environment/env");
const Coupon = require("../modals/Coupon");
const Admin = require("../modals/Admin");
const User = require("../modals/User");
const Subscription = require("../modals/Subscription");
const MailServiceProvider = require("../Utils/mailchamp");
const Profile = require("../modals/Profile");



class RozorpayController {
  static async webhook(req, res, next) {
    try {
      const { event, payload } = req.body;

      // Ensure that event and payload exist
      if (!event || !payload) {
        throw new Error("Invalid webhook data.");
      }

      // Handle the specific event: subscription.charged
      if (event !== "subscription.charged") {
        return res.status(200).send({ message: "Event ignored." });
      }
      const subscription = payload.subscription?.entity;
      const payment = payload.payment?.entity;
      if (!subscription || !payment) {
        throw new Error("Invalid subscription or payment data.");
      }
      const subscriptionId = subscription.id;
      const paymentStatus = payment.status;
      if (paymentStatus !== "captured") {
        throw new Error("Payment not captured.");
      }
      const { userId, couponCode } = subscription.notes || {};
      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
          throw new Error("Coupon not found.");
        }
        coupon.usersApplied.push(userId);
        await coupon.save();
      }
      res.status(200).send({ message: "Coupon applied successfully after payment." });
    } catch (error) {
      next(error);
    }
  }
  static async createSubscription(req, res, next) {
    const { plan, email, fullAddress, couponCode, userId } = req.body;
    try {

      let offerId = null;

      const coupon = couponCode ? await Coupon.findOne({ code: couponCode }) : null;
      if (coupon) {
        offerId = coupon.offerId;
      }

      const requestBody = {
        plan_id: plan,
        total_count: 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          notes_key_1: fullAddress,
          userId: userId,
          couponCode: couponCode,

        },
        notify_info: {
          notify_email: email,
        },
        ...(offerId && { offer_id: offerId })
      };

      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: getEnvironmentVariables().RAZORPAY.KEY_ID,
          password: getEnvironmentVariables().RAZORPAY.KEY_SECRET
        }
      };
      const response = await axios.post("https://api.razorpay.com/v1/subscriptions", requestBody, config);
      if (response.data && response.data.id) {
        res.status(200).send(response.data);
      } else {
        throw new Error("Failed to create subscription.");
      }

    } catch (error) {
      console.error("Error:", JSON.stringify(error));
      res.status(500).send({ message: "An error occurred while creating the subscription." });
    }
  }

  static async getSubscriptionDetail(req, res, next) {
    const { subscriberId, uid, plan } = req.body;

    let cost = 0;
    if (plan === getEnvironmentVariables().SUBSCRIPTION.MONTH_TYPE) {
      cost = getEnvironmentVariables().SUBSCRIPTION.MONTH_COST
    } else {
      cost = getEnvironmentVariables().SUBSCRIPTION.YEAR_COST
    }
    cost = cost / 4;

    await Admin.findOneAndUpdate(
      { type: 'main' },
      { $inc: { total: cost } }
    );
    await User.findOneAndUpdate({ _id: uid }, { $set: { type: plan } })
      .then(async (result) => {
        const YOUR_KEY_ID = getEnvironmentVariables().RAZORPAY.KEY_ID;
        const YOUR_KEY_SECRET = getEnvironmentVariables().RAZORPAY.KEY_SECRET;
        const SUBSCRIPTION_ID = subscriberId;

        const config = {
          headers: {
            'Content-Type': 'application/json'
          },
          auth: {
            username: YOUR_KEY_ID,
            password: YOUR_KEY_SECRET
          }
        };

        axios.get(`https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}`, config)
          .then(response => {
            res.send(response.data);
          })
          .catch(error => {
            //DO NOTHING
          });

      }).catch(error => {
        res.status(500).json({ success: false, message: 'Internal server error' });
      })
      .catch((error) => {
        res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      });
  }


  static async getSubscriptionDetailMobile(req, res, next) {
    const { subscriberId, uid, plan } = req.body;
    try {
      let cost = 0;
      if (plan === getEnvironmentVariables().SUBSCRIPTION.MONTH_TYPE) {
        cost = getEnvironmentVariables().SUBSCRIPTION.MONTH_COST
      } else {
        cost = getEnvironmentVariables().SUBSCRIPTION.YEAR_COST
      }
      cost = cost / 4;

      await Admin.findOneAndUpdate({ type: 'main' }, { $inc: { total: cost } });
      const response = await Profile.findOneAndUpdate({ userId: uid },
        {
          $set: {
            "subscription.plan": plan,
            "subscription.status": "active",
            "subscription.startDate": new Date()
          }
        }, { new: true })

      const { data } = await axios.get(`https://api.razorpay.com/v1/subscriptions/${subscriberId}`, {
        headers: { 'Content-Type': 'application/json' },
        auth: {
          username: getEnvironmentVariables().RAZORPAY.KEY_ID,
          password: getEnvironmentVariables().RAZORPAY.KEY_SECRET
        }
      })
      res.send(data)
    } catch (error) {
      next(error);
    }
  }


  static async pendingSubscription(req, res, next) {
    const { sub } = req.body;
    const YOUR_KEY_ID = getEnvironmentVariables().RAZORPAY.KEY_ID;
    const YOUR_KEY_SECRET = getEnvironmentVariables().RAZORPAY.KEY_SECRET;
    const SUBSCRIPTION_ID = sub;

    const config = {
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: YOUR_KEY_ID,
        password: YOUR_KEY_SECRET
      }
    };

    try {
      const response = await axios.get(`https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}`, config);
      res.send(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      res.status(500).send({ message: 'Error fetching subscription data' });
    }
  }
  static async cancelSubscription(req, res, next) {
    const { id } = req.body;


    const YOUR_KEY_ID = getEnvironmentVariables().RAZORPAY.KEY_ID;
    const YOUR_KEY_SECRET = getEnvironmentVariables().RAZORPAY.KEY_SECRET;
    const SUBSCRIPTION_ID = id;

    const requestBody = {
      cancel_at_cycle_end: 0
    };

    const config = {
      headers: {
        'Content-Type': 'application/json'
      },
      auth: {
        username: YOUR_KEY_ID,
        password: YOUR_KEY_SECRET
      }
    };

    axios.post(`https://api.razorpay.com/v1/subscriptions/${SUBSCRIPTION_ID}/cancel`, requestBody, config)
      .then(async resp => {
        try {
          const subscriptionDetails = await Subscription.findOne({ subscription: id });
          const userId = subscriptionDetails.user;

          await User.findOneAndUpdate(
            { _id: userId },
            { $set: { type: 'free' } }
          );

          const userDetails = await User.findOne({ _id: userId });
          await Subscription.findOneAndDelete({ subscription: id });

          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            service: 'gmail',
            secure: true,
            auth: {
              user: getEnvironmentVariables().GMAIL.EMAIL,
              pass: getEnvironmentVariables().GMAIL.PASSWORD,
            },
          });

          const Reactivate = getEnvironmentVariables().WEBSITE_URL + "/pricing";
          const mailOptions = {
            from: getEnvironmentVariables().GMAIL.EMAIL,
            to: userDetails.email,
            subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
            templateName: 'subscription-cancel.html',
            variables: { logo: getEnvironmentVariables().LOGO, name: userDetails.mName, Reactivate, company: getEnvironmentVariables().COMPANY },
          };
          await MailServiceProvider.sendEmail(mailOptions);
          res.json({ success: true, message: '' });

        } catch (error) {
          //DO NOTHING
        }
      })
      .catch(error => {
        //DO NOTHING
      });
  }

}

module.exports = RozorpayController