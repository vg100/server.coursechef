const Admin = require("../modals/Admin");
const User = require("../modals/User");
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const getEnvironmentVariables = require("../Environment/env");
const MailServiceProvider = require("../Utils/mailchamp");
const EmailController = require("./EmailController");
const Profile = require("../modals/Profile");

class AuthController {
  static async signup(req, res, next) {
    const { email, mName, password, type } = req.body;
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }
  
      // Create new user
      const newUser = await User.create({ email, mName, password, type });
  
      // Create user profile
      await Profile.create({
        userId: newUser._id,
        fullName: mName,
        email,
        subscription: {},
        learningPreferences: {},
        courses: [],
        achievements: {},
        leaderboard: {},
        activityLog: [],
        socialLinks: {},
        settings: {},
        auth: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
  
    await EmailController.welcome({ email, mName })

      const isFirstUser = (await User.estimatedDocumentCount()) === 1;
      if (isFirstUser) {
        await Admin.create({ email, mName, type: 'main' });
      }
  
      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        userId: newUser._id,
      });
  
    } catch (error) {
      next(error);
    }
  }
  
  static async signin(req, res, next) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('User not found. Please register for a new account.');
      }
      // if (!user.isVerified) {
      //   await AuthController.resendEmail(req, res, next);
      //   throw new Error('Please verify your email before signing in. Check your inbox for the verification email.');
      // }
      if (password !== user.password) {
        throw new Error('Invalid email or password');
      }
      return res.json({ success: true, message: 'SignIn successful', userData: user });

    } catch (error) {
      next(error);
    }

  }
  static async verifyEmail(req, res, next) {
    const { token } = req.query;

    try {
      const decoded = jwt.verify(token, 'your_secret_key');
      const user = await User.findOne({ email: decoded.email });

      if (!user) {
        throw new Error('User not found.');
      }

      if (user.isVerified) {

        throw new Error('Email is already verified.');
      }

      user.isVerified = true;
      user.verificationToken = null;
      await user.save();
      EmailController.welcome({ email: user.email, mName: user.mName })
      res.json({ success: true, message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
      next(error);
    }
  }

  static async resendEmail(req, res, next) {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).send('User not found.');
      if (user.isVerified) return res.status(400).send('Email already verified.');
      EmailController.emailVerify({ email, mName: user.mName })
      return res.status(200).json({ success: false, message: 'Please verify your email before signing in. Check your inbox for the verification email.' });
    } catch (err) {
      next(err)
    }
  }

  static async forgot(req, res, next) {
    const { email, name, company, logo } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new Error('User not found.');
      }

      const token = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();
      const resetLink = `${getEnvironmentVariables().WEBSITE_URL}/reset-password/${token}`;
      const emailOptions = {
        from: `support@coursechef.in`,
        to: user.email,
        subject: `${name} Password Reset`,
        templateName: 'password-reset.html',
        variables: { resetLink, company, logo, email },
      };
      await MailServiceProvider.sendEmail(emailOptions);
      res.json({ success: true, message: 'Password reset link sent to your email' });
    } catch (error) {
      next(error)
    }
  }
  static async resetPassword(req, res, next) {
    const { password, token } = req.body;
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new Error('User not found.');
      }

      user.password = password;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;

      await user.save();

      res.json({ success: true, message: 'Password updated successfully', email: user.email });

    } catch (error) {
      next(error)
    }

  }
}

module.exports = AuthController;