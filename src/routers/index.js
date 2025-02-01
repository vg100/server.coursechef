//IMPORT
const express= require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();
const youtubesearchapi = require("youtube-search-api");
const { YoutubeTranscript } = require("youtube-transcript");
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const { createApi } = require("unsplash-js");
const showdown = require("showdown");
const axios = require("axios");
var gis = require("g-i-s");
const MailServiceProvider = require("../Utils/mailchamp");
const getEnvironmentVariables = require("../Environment/env");
const User = require("../modals/User");
const Course = require("../modals/Course");
const Subscription = require("../modals/Subscription");
const Contact = require("../modals/Contact");
const Admin = require("../modals/Admin");
const Coupon = require("../modals/Coupon");
const CouponController = require("../Controller/coupon.controller");
const { Router } = express;
const fs = require('fs');
const path = require('path');
const AuthController = require("../Controller/AuthController");
const SearchController = require("../Controller/SearchController");
const GenerativeAI = require("../Utils/GenerativeAI");
const InfoController = require("../Controller/InfoController");
const RozorpayController = require("../Controller/RazorpayController");
const LogController = require("../Controller/LogController");
const UserController = require("../Controller/UserController");
const CourseController = require("../Controller/CourseController");
const logger = require("../Utils/logger");
const ProfileController = require("../Controller/ProfileController");
const RazorPayControllerr = require("../Controller/RazorPayControllerr");
const socketController = require("../Controller/socketController");

//INITIALIZE
const router=Router();

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

const unsplash = createApi({ accessKey: getEnvironmentVariables().UNSPLASH_ACCESS_KEY });

//SIGNUP
router.post('/signup',AuthController.signup);

//SIGNIN
router.post('/signin', AuthController.signin);

router.get('/verify-email', AuthController.verifyEmail);
router.get('/resend-verification', AuthController.verifyEmail);

//SEND MAIL
router.post('/data', async (req, res,next) => {
  const receivedData = req.body;

  try {
    const emailHtml = receivedData.html;

    const options = {
      from: getEnvironmentVariables().GMAIL.EMAIL,
      to: receivedData.to,
      subject: receivedData.subject,
      html: emailHtml,
    };

    const data = await transporter.sendMail(options);
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json(error);
  }
});

//FOROGT PASSWORD
router.post('/forgot', AuthController.forgot);

//FOROGT PASSWORD
router.post('/reset-password', AuthController.resetPassword);

//GET DATA FROM MODEL
router.post('/prompt', CourseController.prompt );

//GET GENERATE THEORY
router.post("/generate", CourseController.generate);

//GET IMAGE
router.post('/image', CourseController.image)

//GET VIDEO 
router.post('/yt', CourseController.yt);

//GET TRANSCRIPT 
router.post('/transcript', CourseController.transcript);

//STORE COURSE
router.post('/course', CourseController.course);


//UPDATE COURSE
router.post('/update', CourseController.update);

router.post('/finish', async (req, res,next) => {
  const { courseId } = req.body;
  try {

    await Course.findOneAndUpdate(
      { _id: courseId },
      { $set: { completed: true, end: Date.now() } }
    ).then(result => {
      res.json({ success: true, message: 'Course completed successfully' });
    }).catch(error => {

      res.status(500).json({ success: false, message: 'Internal server error' });
    })

  } catch (error) {

    res.status(500).json({ success: false, message: 'Internal server error' });
  }

});

//SEND CERTIFICATE
router.post('/sendcertificate', async (req, res,next) => {
  const { html, email } = req.body;

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

  const options = {
    from: getEnvironmentVariables().GMAIL.EMAIL,
    to: email,
    subject: 'Certification of completion',
    html: html
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    } else {
      res.json({ success: true, message: 'Email sent successfully' });
    }
  });
});

//GET ALL COURSES
router.get('/courses', CourseController.getCoursesByUserId);

//GET PROFILE DETAILS
router.post('/profile', UserController.getProfile);

//PAYPAL PAYMENT
router.post('/paypal', async (req, res,next) => {
  const { planId, email, name, lastName, post, address, country, brand, admin } = req.body;

  const firstLine = address.split(',').slice(0, -1).join(',');
  const secondLine = address.split(',').pop();

  const PAYPAL_CLIENT_ID = getEnvironmentVariables().PAYPAL.CLIENT_ID;
  const PAYPAL_APP_SECRET_KEY = getEnvironmentVariables().PAYPAL.APP_SECRET_KEY;
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");
  const setSubscriptionPayload = (subscriptionPlanID) => {
    let subscriptionPayload = {
      "plan_id": subscriptionPlanID,
      "subscriber": { "name": { "given_name": name, "surname": lastName }, "email_address": email, "shipping_address": { "name": { "full_name": name }, "address": { "address_line_1": firstLine, "address_line_2": secondLine, "admin_area_2": admin, "admin_area_1": country, "postal_code": post, "country_code": country } } },
      "application_context": {
        "brand_name": getEnvironmentVariables().COMPANY,
        "locale": "en-US",
        "shipping_preference": "SET_PROVIDED_ADDRESS",
        "user_action": "SUBSCRIBE_NOW",
        "payment_method": {
          "payer_selected": "PAYPAL",
          "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
        },
        "return_url": `${getEnvironmentVariables().WEBSITE_URL}/success`,
        "cancel_url": `${getEnvironmentVariables().WEBSITE_URL}/failed`
      }
    }
    return subscriptionPayload

  }

  let subscriptionPlanID = planId;
  const response = await fetch('https://api-m.sandbox.paypal.com/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify(setSubscriptionPayload(subscriptionPlanID)),
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json'
    },
  });
  const session = await response.json();
  res.send(session)
});

//GET SUBSCRIPTION DETAILS
router.post('/subscriptiondetail', async (req, res,next) => {

  try {
    const { uid } = req.body;

    const userDetails = await Subscription.findOne({ user: uid });

    if (userDetails.method === 'paypal') {
      const PAYPAL_CLIENT_ID = getEnvironmentVariables().PAYPAL.CLIENT_ID;
      const PAYPAL_APP_SECRET_KEY = getEnvironmentVariables().PAYPAL.APP_SECRET_KEY;
      const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");
      const response = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${userDetails.subscription}`, {
        headers: {
          'Authorization': 'Basic ' + auth,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      const session = await response.json();
      res.json({ session: session, method: userDetails.method });
    } else {

      const YOUR_KEY_ID = getEnvironmentVariables().RAZORPAY.KEY_ID;
      const YOUR_KEY_SECRET = getEnvironmentVariables().RAZORPAY.KEY_SECRET;
      const SUBSCRIPTION_ID = userDetails.subscription;

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
          res.json({ session: response.data, method: userDetails.method });
        })
        .catch(error => {
          //DO NOTHING
        });

    }

  } catch (error) {
    //DO NOTHING
  }

});

//GET PAYPAL DETAILS
router.post("/paypaldetails", async (req, res,next) => {
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

  await User.findOneAndUpdate(
    { _id: uid },
    { $set: { type: plan } }
  ).then(async result => {
    const PAYPAL_CLIENT_ID = getEnvironmentVariables().PAYPAL.CLIENT_ID;
    const PAYPAL_APP_SECRET_KEY = getEnvironmentVariables().PAYPAL.APP_SECRET_KEY;
    const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");
    const response = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriberId}`, {
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    const session = await response.json();
    res.send(session);
  }).catch(error => {
    res.status(500).json({ success: false, message: 'Internal server error' });
  })

});

//DOWNLOAD RECEIPT
router.post('/downloadreceipt', async (req, res,next) => {
  const { html, email } = req.body;

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

  const options = {
    from: getEnvironmentVariables().GMAIL.EMAIL,
    to: email,
    subject: 'Subscription Receipt',
    html: html
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res.status(500).json({ success: false, message: 'Failed to send receipt' });
    } else {
      res.json({ success: true, message: 'Receipt sent to your mail' });
    }
  });

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res
        .status(500)
        .json({ success: false, message: "Failed to send receipt" });
    } else {
      res.json({ success: true, message: "Receipt sent to your mail" });
    }
  });
});

//SEND RECEIPT
router.post('/sendreceipt', async (req, res,next) => {
  const { html, email, plan, subscriberId, user, method, subscription } = req.body;

  const existingSubscription = await Subscription.findOne({ user: user });
  if (existingSubscription) {
    //DO NOTHING
  } else {
    const newSub = new Subscription({ user, subscription, subscriberId, plan, method });
    await newSub.save();
  }

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

  const options = {
    from: getEnvironmentVariables().GMAIL.EMAIL,
    to: email,
    subject: 'Subscription Receipt',
    html: html
  };

  transporter.sendMail(options, (error, info) => {
    if (error) {
      res.status(500).json({ success: false, message: 'Failed to send receipt' });
    } else {
      res.json({ success: true, message: 'Receipt sent to your mail' });
    }
  });
});

//PAYPAL WEBHOOKS
router.post("/paypalwebhooks", async (req, res,next) => {
  const body = req.body;
  const event_type = body.event_type;

  switch (event_type) {
    case 'BILLING.SUBSCRIPTION.CANCELLED':
      const id = body['resource']['id'];
      updateSubsciption(id, "Cancelled");
      break;
    case 'BILLING.SUBSCRIPTION.EXPIRED':
      const id2 = body['resource']['id'];
      updateSubsciption(id2, "Expired");
      break;
    case 'BILLING.SUBSCRIPTION.SUSPENDED':
      const id3 = body['resource']['id'];
      updateSubsciption(id3, "Suspended");
      break;
    case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      const id4 = body['resource']['id'];
      updateSubsciption(id4, "Disabled Due To Payment Failure");
      break;
    case 'PAYMENT.SALE.COMPLETED':
      const id5 = body['resource']['billing_agreement_id'];
      sendRenewEmail(id5);
      break;

    default:
    //DO NOTHING
  }
});

//SEND RENEW EMAIL
async function sendRenewEmail(id) {
  try {
    const subscriptionDetails = await Subscription.findOne({ subscription: id });
    const userId = subscriptionDetails.user;
    const userDetails = await User.findOne({ _id: userId });
    const mailOptions = {
      from: getEnvironmentVariables().GMAIL.EMAIL,
      to: userDetails.email,
      subject: `${userDetails.mName} Your Subscription Plan Has Been Renewed`,
      templateName: 'subscription-reset.html',
      variables: { name: userDetails.mName, company: getEnvironmentVariables().COMPANY, logo: getEnvironmentVariables().LOGO },
    };
    await MailServiceProvider.sendEmail(mailOptions);

  } catch (error) {
    //DO NOTHING
  }
}

//UPDATE SUBSCRIPTION DETIALS
async function updateSubsciption(id, subject) {
  try {
    const subscriptionDetails = await Subscription.findOne({ subscription: id });
    const userId = subscriptionDetails.user;

    await User.findOneAndUpdate(
      { _id: userId },
      { $set: { type: 'free' } }
    );

    const userDetails = await User.findOne({ _id: userId });
    await Subscription.findOneAndDelete({ subscription: id });

    sendCancelEmail(userDetails.email, userDetails.mName, subject);
  } catch (error) {
    //DO NOTHING
  }
}

//SEND CANCEL EMAIL
async function sendCancelEmail(email, name, subject) {
  const Reactivate = getEnvironmentVariables().WEBSITE_URL + "/pricing";
  const mailOptions = {
    from: getEnvironmentVariables().GMAIL.EMAIL,
    to: email,
    subject: `${name} Your Subscription Plan Has Been ${subject}`,
    templateName: 'subscription-cancel.html',
    variables: { subject, logo: getEnvironmentVariables().LOGO, name, Reactivate, company: getEnvironmentVariables().COMPANY },
  };
  await MailServiceProvider.sendEmail(mailOptions);
}

//CANCEL PAYPAL SUBSCRIPTION
router.post('/paypalcancel', async (req, res,next) => {
  const { id } = req.body;

  const PAYPAL_CLIENT_ID = getEnvironmentVariables().PAYPAL.CLIENT_ID;
  const PAYPAL_APP_SECRET_KEY = getEnvironmentVariables().PAYPAL.APP_SECRET_KEY;
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");
  await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${id}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ "reason": "Not satisfied with the service" })

  }).then(async resp => {
    try {
      const subscriptionDetails = await Subscription.findOne({ subscription: id });
      const userId = subscriptionDetails.user;

      await User.findOneAndUpdate(
        { _id: userId },
        { $set: { type: 'free' } }
      );

      const userDetails = await User.findOne({ _id: userId });
      await Subscription.findOneAndDelete({ subscription: id });

      const Reactivate = getEnvironmentVariables().WEBSITE_URL + "/pricing";
      const mailOptions = {
        from: getEnvironmentVariables().GMAIL.EMAIL,
        to: userDetails.email,
        subject: `${userDetails.mName} Your Subscription Plan Has Been Cancelled`,
        templateName: 'paypal-subscription-cancel.html',
        variables: { logo: getEnvironmentVariables().LOGO, name: userDetails.mName, Reactivate, company: getEnvironmentVariables().COMPANY },
      };
      await MailServiceProvider.sendEmail(mailOptions);
      res.json({ success: true, message: "" });
    } catch (error) {
      //DO NOTHING
    }
  });
});

//UPDATE SUBSCRIPTION
router.post('/paypalupdate', async (req, res,next) => {
  const { id, idPlan } = req.body;

  const PAYPAL_CLIENT_ID = getEnvironmentVariables().PAYPAL.CLIENT_ID;
  const PAYPAL_APP_SECRET_KEY = getEnvironmentVariables().PAYPAL.APP_SECRET_KEY;
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET_KEY).toString("base64");

  try {
    const response = await fetch(`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${id}/revise`, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ "plan_id": idPlan, "application_context": { "brand_name": getEnvironmentVariables().COMPANY, "locale": "en-US", "payment_method": { "payer_selected": "PAYPAL", "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED" }, "return_url": `${getEnvironmentVariables().WEBSITE_URL}/successful`, "cancel_url": `${getEnvironmentVariables().WEBSITE_URL}/failed` } })
    });
    const session = await response.json();
    console.log(session)
    res.send(session)
  } catch (error) {
    //DO NOTHING
  }

});

//UPDATE SUBSCRIPTION AND USER DETAILS
router.post('/paypalupdateuser', async (req, res,next) => {
  const { id, mName, email, user, plan } = req.body;

  await Subscription.findOneAndUpdate(
    { subscription: id },
    { $set: { plan: plan } }
  ).then(async r => {
    await User.findOneAndUpdate(
      { _id: user },
      { $set: { type: plan } }
    ).then(async ress => {
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

      const mailOptions = {
        from: getEnvironmentVariables().GMAIL.EMAIL,
        to: email,
        subject: `${mName} Your Subscription Plan Has Been Modifed`,
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
    
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Subscription Modifed<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
                 </div>
    
                  <body style="margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:rgb(255,255,255);font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
                    <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" width="100%" style="max-width:37.5em;margin-left:auto;margin-right:auto;margin-top:40px;margin-bottom:40px;width:465px;border-radius:0.25rem;border-width:1px;border-style:solid;border-color:rgb(234,234,234);padding:20px">
                      <tr style="width:100%">
                        <td>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                            <tbody>
                              <tr>
                                <td><img alt="Vercel" src="${process.env.LOGO}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                              </tr>
                            </tbody>
                          </table>
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Subscription Modifed</h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">${mName}, your subscription plan has been Modifed.</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${process.env.COMPANY}</strong> Team</p></p>
                          </td>
                      </tr>
                    </table>
                  </body>
    
                </html>`,
      };
      await transporter.sendMail(mailOptions);
    }
    );
  });
});

//CREATE RAZORPAY SUBSCRIPTION
router.post("/razorpaycreate", RozorpayController.createSubscription);


//GET RAZORPAY SUBSCRIPTION DETAILS
router.post("/razorapydetails", RozorpayController.getSubscriptionDetail);

//GET RAZORPAY SUBSCRIPTION DETAILS
router.post("/getSubscriptionDetailMobile", RozorpayController.getSubscriptionDetailMobile);

//RAZORPAY PENDING
router.post("/razorapypending", RozorpayController.pendingSubscription);


//RAZORPAY CANCEL SUBSCRIPTION 
router.post('/razorpaycancel', RozorpayController.cancelSubscription);

//CONTACT
router.post('/contact', async (req, res,next) => {
  const { fname, lname, email, phone, msg } = req.body;
  try {
    const newContact = new Contact({ fname, lname, email, phone, msg });
    await newContact.save();
    res.json({ success: true, message: 'Submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

//ADMIN PANEL

//DASHBOARD
router.post('/dashboard', async (req, res,next) => {
  const users = await User.estimatedDocumentCount();
  const courses = await Course.estimatedDocumentCount();
  const admin = await Admin.findOne({ type: 'main' });
  const total = admin?.total;

  const monthlyPlanCount = await User.countDocuments({ type: "Monthly Plan" });
  const yearlyPlanCount = await User.countDocuments({ type: "Yearly Plan" });
  let monthCost = monthlyPlanCount * 299;
  let yearCost = yearlyPlanCount * 2999;
  let sum = monthCost + yearCost;
  let paid = yearlyPlanCount + monthlyPlanCount;
  const videoType = await Course.countDocuments({ type: 'video & text course' });
  const textType = await Course.countDocuments({ type: 'theory & image course' });
  let free = users - paid;
  res.json({ users: users, courses: courses, total: total, sum: sum, paid: paid, videoType: videoType, textType: textType, free: free, admin: admin });
});

//GET USERS
router.get('/getusers', async (req, res,next) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    //DO NOTHING
  }
});


//GET COURES
router.get('/getcourses', CourseController.getCourse);


// Delete user and their courses by user ID
router.delete('/deleteuser/:id', async (req, res,next) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the courses created by the user
    const deletedCourses = await Course.deleteMany({ user: userId });

    res.json({
      message: 'User and their courses deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user or courses', error });
  }
});

router.put('/edituser/:id', async (req, res,next) => {
  try {
    const userId = req.params.id;
    const updatedData = req.body;

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
});

//GET PAID USERS
router.get('/getpaid', async (req, res,next) => {
  try {
    const paidUsers = await User.find({ type: { $ne: 'free' } });
    res.json(paidUsers);
  } catch (error) {
    //DO NOTHING
  }
});

//GET ADMINS
router.get('/getadmins', async (req, res,next) => {
  try {
    const users = await User.find({ email: { $nin: await getEmailsOfAdmins() } });
    const admins = await Admin.find({});
    res.json({ users: users, admins: admins });
  } catch (error) {
    //DO NOTHING
  }
});

async function getEmailsOfAdmins() {
  const admins = await Admin.find({});
  return admins.map(admin => admin.email);
}

//ADD ADMIN
router.post('/addadmin', async (req, res,next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    const newAdmin = new Admin({ email: user.email, mName: user.mName, type: 'no' });
    await newAdmin.save();
    res.json({ success: true, message: 'Admin added successfully' });
  } catch (error) {
    //DO NOTHING
  }
});



//REMOVE ADMIN
router.post('/removeadmin', async (req, res,next) => {
  const { email } = req.body;
  try {
    await Admin.findOneAndDelete({ email: email });
    res.json({ success: true, message: 'Admin removed successfully' });
  } catch (error) {
    //DO NOTHING
  }
});

//GET CONTACTS
router.get('/getcontact', InfoController.getContacts);

//GET CHAT
router.post('/chat', async (req, res,next) => {
  try {

    const {prompt} = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }
    const text= await GenerativeAI.generateText(prompt)
    res.status(200).json({ text });

  } catch (error) {
   next(error)
  }
});

//SAVE ADMIN
router.post('/saveadmin', async (req, res,next) => {
  const { data, type } = req.body;
  try {
    if (type === 'terms') {
      await Admin.findOneAndUpdate(
        { type: 'main' },
        { $set: { terms: data } }
      ).then(rl => {
        res.json({ success: true, message: 'Saved successfully' });
      });
    } else if (type === 'privacy') {
      await Admin.findOneAndUpdate(
        { type: 'main' },
        { $set: { privacy: data } }
      ).then(rl => {
        res.json({ success: true, message: 'Saved successfully' });
      });
    } else if (type === 'cancel') {
      await Admin.findOneAndUpdate(
        { type: 'main' },
        { $set: { cancel: data } }
      ).then(rl => {
        res.json({ success: true, message: 'Saved successfully' });
      });
    } else if (type === 'refund') {
      await Admin.findOneAndUpdate(
        { type: 'main' },
        { $set: { refund: data } }
      ).then(rl => {
        res.json({ success: true, message: 'Saved successfully' });
      });
    } else if (type === 'billing') {
      await Admin.findOneAndUpdate(
        { type: 'main' },
        { $set: { billing: data } }
      ).then(rl => {
        res.json({ success: true, message: 'Saved successfully' });
      });
    }
  } catch (error) {
    //DO NOTHING
  }
});

//GET POLICIES
router.get('/policies', InfoController.getPolicies);

router.post('/apply-coupon', CouponController.applyCoupon);
router.post('/create-coupon',  CouponController.createCoupn);
router.get('/generate_autocompletions',  SearchController.generate_autocompletions);

// Webhook to handle Razorpay events
router.post("/razorpay-webhook", RozorpayController.webhook);

router.get('/logs', LogController.log);

router.post("/importcourse", CourseController.importCourse);

router.post("/log/create",(req, res, next)=>{
  logger.error(req.body);
})

router.post("/retryImage",CourseController.retryImage)

router.patch("/profile/update/:id",ProfileController.updateProfile)
router.get("/profile/get/:id",ProfileController.getProfile)
router.post("/recommendedcourses",ProfileController.getRecommended)
router.post("/notification/:userId?",ProfileController.sendNotification)





//for subscriptions
router.post("/subscriptions", RazorPayControllerr.createSubscription);
router.post("/subscriptions/get", RazorPayControllerr.getSubscription);
router.post("/subscriptions/:subscription_id", RazorPayControllerr.cancelSubscription);
router.post("/subscriptions/:subscription_id/pause", RazorPayControllerr.pauseSubscription);
router.post("/subscriptions/:subscription_id/resume", RazorPayControllerr.resumeSubscription);
router.post("/subscriptions/:subscription_id/reactivate", RazorPayControllerr.reactivateSubscription);
router.get("/subscriptions", RazorPayControllerr.getAllSubscriptions);
router.post("/razorpay-webhook", RazorPayControllerr.handleWebhook);


module.exports = router;