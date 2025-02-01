const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  plan: { type: String, default: 'free' },
  startDate: { type: Date },
  endDate: { type: Date },
  status: { type: String },
  paymentMethod: { type: String },
  nextBillingDate: { type: Date }
});

const areaOfInterestSchema = new mongoose.Schema({
  name: { type: String },
  icon: { type: String },
  size: { type: String }
});

const notificationSchema = new mongoose.Schema({
  email: { type: Boolean },
  sms: { type: Boolean },
  push: { type: Boolean }
});

const courseSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  courseTitle: { type: String },
  progress: { type: Number },
  completed: { type: Boolean },
  enrolledDate: { type: Date },
  completionDate: { type: Date },
  lastAccessed: { type: Date }
});

const badgeSchema = new mongoose.Schema({
  badgeName: { type: String },
  badgeIcon: { type: String },
  earnedDate: { type: Date }
});

const certificateSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  certificateURL: { type: String },
  earnedDate: { type: Date }
});

const activityLogSchema = new mongoose.Schema({
  action: { type: String },
  timestamp: { type: Date }
});

const socialLinksSchema = new mongoose.Schema({
  linkedin: { type: String },
  github: { type: String }
});

const loginHistorySchema = new mongoose.Schema({
  device: { type: String },
  ipAddress: { type: String },
  timestamp: { type: Date }
});

const authSchema = new mongoose.Schema({
  googleLogin: { type: Boolean },
  lastLogin: { type: Date },
  loginHistory: [loginHistorySchema]
});

const settingsSchema = new mongoose.Schema({
  darkMode: { type: Boolean },
  language: { type: String },
  emailNotifications: { type: Boolean },
  smsNotifications: { type: Boolean }
});

// Main profile schema
const profileSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
    mName: String,
    password: String,
    type: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'offline'],
      default: 'offline'
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    
    courseCount: { type: Number, default: 0 },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fullName: { type: String },
  email: { type: String },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'NewSubscription' },
  learningPreferences: {
    preferredLanguage: { type: String },
    areaOfInterest: [areaOfInterestSchema],
    notifications: notificationSchema
  },
  courses: [courseSchema],
  achievements: {
    badges: [badgeSchema],
    certificates: [certificateSchema]
  },
  leaderboard: {
    rank: { type: Number },
    points: { type: Number },
    streakDays: { type: Number },
    coursesCompleted: { type: Number }
  },
  activityLog: [activityLogSchema],
  socialLinks: socialLinksSchema,
  settings: settingsSchema,
  auth: authSchema,
  createdAt: { type: Date },
  updatedAt: { type: Date }
});

// Create the Profile model
const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
