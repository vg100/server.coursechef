const mongoose = require('mongoose');



const areaOfInterestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    icon: { type: String },
    size: { type: String }
});

const notificationSchema = new mongoose.Schema({
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
});

const courseSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    courseTitle: { type: String, required: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    completed: { type: Boolean, default: false },
    enrolledDate: { type: Date, default: Date.now },
    completionDate: { type: Date },
    lastAccessed: { type: Date, default: Date.now }
});

const badgeSchema = new mongoose.Schema({
    badgeName: { type: String, required: true },
    badgeIcon: { type: String },
    earnedDate: { type: Date, default: Date.now }
});

const certificateSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    certificateURL: { type: String, required: true },
    earnedDate: { type: Date, default: Date.now }
});

const activityLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const socialLinksSchema = new mongoose.Schema({
    linkedin: { type: String },
    github: { type: String }
});

const loginHistorySchema = new mongoose.Schema({
    device: { type: String },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now }
});

const authSchema = new mongoose.Schema({
    googleLogin: { type: Boolean, default: false },
    lastLogin: { type: Date },
    loginHistory: [loginHistorySchema]
});

const settingsSchema = new mongoose.Schema({
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false }
});

// Main profile schema
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    type: { type: String, enum: ['admin', 'user'], default: 'user' },
    status: { type: String, enum: ['active', 'inactive', 'offline'], default: 'offline' },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    courseCount: { type: Number, default: 0 },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    subscription:{ type: mongoose.Schema.Types.ObjectId, ref: 'NewSubscription',default: null},
    learningPreferences: {
        preferredLanguage: { type: String, default: 'en' },
        areaOfInterest: [areaOfInterestSchema],
        notifications: notificationSchema
    },
    courses: [courseSchema],
    achievements: {
        badges: [badgeSchema],
        certificates: [certificateSchema]
    },
    leaderboard: {
        rank: { type: Number, default: 0 },
        points: { type: Number, default: 0 },
        streakDays: { type: Number, default: 0 },
        coursesCompleted: { type: Number, default: 0 }
    },
    activityLog: [activityLogSchema],
    socialLinks: socialLinksSchema,
    settings: settingsSchema,
    auth: authSchema,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("NewUser", userSchema);
